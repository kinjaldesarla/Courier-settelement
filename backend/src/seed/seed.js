import { nanoid } from "nanoid";
import mongoose from "mongoose";
import { connectMongo } from "../config/mongo.js";
import { env } from "../config/env.js";
import { Order } from "../models/Order.js";
import { Settlement } from "../models/Settlement.js";
import { UploadBatch } from "../models/UploadBatch.js";
import { JobRun } from "../models/JobRun.js";
import { Notification } from "../models/Notification.js";

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  const v = Math.random() * (max - min) + min;
  const p = 10 ** decimals;
  return Math.round(v * p) / p;
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function makeAwb(i) {
  return `AWB${String(i).padStart(7, "0")}`;
}

async function resetCollections() {
  await Promise.all([
    Order.deleteMany({}),
    Settlement.deleteMany({}),
    UploadBatch.deleteMany({}),
    JobRun.deleteMany({}),
    Notification.deleteMany({})
  ]);
}

async function seed() {
  await connectMongo();

  const shouldReset = env.nodeEnv !== "production";
  if (shouldReset) await resetCollections();

  const merchants = ["mrc_1001", "mrc_1002", "mrc_1003", "mrc_1004", "mrc_1005"];
  const couriers = ["Delhivery", "BlueDart", "EcomExpress", "XpressBees"];
  const statuses = ["DELIVERED", "RTO", "IN_TRANSIT", "LOST"];

  // 60 orders to exceed the requirement.
  const orders = [];
  for (let i = 1; i <= 60; i++) {
    const orderStatus = pick(statuses);
    const orderDate = daysAgo(randInt(5, 40));
    const delivered =
      orderStatus === "DELIVERED" || orderStatus === "RTO"
        ? new Date(orderDate.getTime() + randInt(1, 10) * 24 * 60 * 60 * 1000)
        : null;

    orders.push({
      awbNumber: makeAwb(i),
      merchantId: pick(merchants),
      courierPartner: pick(couriers),
      orderStatus,
      codAmount: randInt(199, 2499),
      declaredWeight: randFloat(0.2, 3.5, 2),
      orderDate,
      deliveryDate: delivered
    });
  }

  await Order.insertMany(orders, { ordered: false });

  // One settlement batch with multiple records (and intentional mismatches).
  const batchId = `batch_${new Date().toISOString().slice(0, 10)}_${nanoid(6)}`;
  const batchRowCount = 30;

  await UploadBatch.create({
    batchId,
    sourceType: "JSON",
    originalFilename: "seed-settlements.json",
    rowCount: batchRowCount,
    status: "PROCESSED",
    processedAt: new Date()
  });

  const orderByAwb = new Map(orders.map((o) => [o.awbNumber, o]));
  const settlementDocs = [];

  // Pick 28 AWBs that exist + 2 that don't (to simulate missing orders).
  const existingAwbs = Array.from(orderByAwb.keys()).slice(0, 28);
  const missingAwbs = ["AWB9999001", "AWB9999002"];
  const awbsForBatch = [...existingAwbs, ...missingAwbs];

  for (let i = 0; i < awbsForBatch.length; i++) {
    const awbNumber = awbsForBatch[i];
    const o = orderByAwb.get(awbNumber);

    const baseCod = o ? o.codAmount : randInt(199, 2499);
    const baseWeight = o ? o.declaredWeight : randFloat(0.2, 3.5, 2);
    const settlementDate = daysAgo(randInt(1, 7));

    // Intentional mismatches:
    // - Every 5th record: COD mismatch
    // - Every 7th record: weight mismatch
    const codMismatch = i % 5 === 0;
    const weightMismatch = i % 7 === 0;

    const settledCodAmount = codMismatch ? baseCod + randInt(20, 200) : baseCod;
    const chargedWeight = weightMismatch ? randFloat(baseWeight + 0.3, baseWeight + 1.2, 2) : baseWeight;

    // Simple charge modeling (intentionally a bit inconsistent when mismatched).
    const forwardCharge = Math.max(25, Math.round(chargedWeight * 40));
    const rtoCharge = o?.orderStatus === "RTO" ? Math.max(30, Math.round(chargedWeight * 35)) : 0;
    const codHandlingFee = Math.round(settledCodAmount * 0.015);

    settlementDocs.push({
      awbNumber,
      settledCodAmount,
      chargedWeight,
      forwardCharge,
      rtoCharge,
      codHandlingFee,
      settlementDate,
      batchId
    });
  }

  await Settlement.insertMany(settlementDocs, { ordered: false });

  // Seed one historical job run + some notification logs for dashboard visibility.
  await JobRun.create({
    jobType: "RECONCILIATION_NIGHTLY",
    startTime: daysAgo(1),
    endTime: daysAgo(1),
    status: "SUCCESS",
    recordsProcessed: settlementDocs.length,
    discrepanciesFound: 8,
    notes: "Seeded run (for UI/log visibility)."
  });

  const notifSeed = settlementDocs.slice(0, 10).map((s, idx) => {
    const o = orderByAwb.get(s.awbNumber);
    return {
      merchantId: o?.merchantId ?? pick(merchants),
      awbNumber: s.awbNumber,
      discrepancyType: idx % 2 === 0 ? "COD_MISMATCH" : "WEIGHT_MISMATCH",
      expectedValue: idx % 2 === 0 ? o?.codAmount : o?.declaredWeight,
      actualValue: idx % 2 === 0 ? s.settledCodAmount : s.chargedWeight,
      suggestedAction: "Review settlement line item and raise dispute with courier if needed.",
      deliveryStatus: pick(["PENDING", "SENT", "FAILED"]),
      retryCount: randInt(0, 2),
      response: idx % 3 === 0 ? { mock: true, id: nanoid(8) } : null,
      error: idx % 3 === 1 ? { message: "Mock delivery error" } : null,
      createdAt: daysAgo(randInt(0, 3))
    };
  });

  await Notification.insertMany(notifSeed, { ordered: false });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        mongo: mongoose.connection.name,
        seeded: {
          orders: await Order.countDocuments(),
          uploadBatches: await UploadBatch.countDocuments(),
          settlements: await Settlement.countDocuments(),
          jobRuns: await JobRun.countDocuments(),
          notifications: await Notification.countDocuments()
        },
        batchId
      },
      null,
      2
    )
  );
}

seed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });

