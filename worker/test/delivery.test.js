import { describe, expect, it, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Notification } from "../src/models/Notification.js";
import { deliverDiscrepancyJob } from "../src/services/delivery.js";

let mongo;

beforeEach(async () => {
  if (!mongo) {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { autoIndex: true });
  }
  await Notification.deleteMany({});
});

describe("worker delivery", () => {
  it("marks SENT on 200 response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true })
    });

    const n = await Notification.create({
      merchantId: "m1",
      awbNumber: "A1",
      discrepancyType: "COD_SHORT_REMITTANCE",
      expectedValue: 100,
      actualValue: 90,
      suggestedAction: "test",
      deliveryStatus: "PENDING",
      retryCount: 0,
      createdAt: new Date()
    });

    await deliverDiscrepancyJob({
      notificationId: String(n._id),
      jobData: {
        notificationId: String(n._id),
        merchantId: "m1",
        awbNumber: "A1",
        discrepancyType: "COD_SHORT_REMITTANCE"
      },
      notificationApiUrl: "http://example.com"
    });

    const updated = await Notification.findById(n._id).lean();
    expect(updated.deliveryStatus).toBe("SENT");
    expect(updated.response.status).toBe(200);
  });

  it("marks RETRIED and increments retryCount on non-2xx", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom"
    });

    const n = await Notification.create({
      merchantId: "m1",
      awbNumber: "A1",
      discrepancyType: "COD_SHORT_REMITTANCE",
      deliveryStatus: "PENDING",
      retryCount: 0,
      createdAt: new Date()
    });

    await expect(
      deliverDiscrepancyJob({
        notificationId: String(n._id),
        jobData: {
          notificationId: String(n._id),
          merchantId: "m1",
          awbNumber: "A1",
          discrepancyType: "COD_SHORT_REMITTANCE"
        },
        notificationApiUrl: "http://example.com"
      })
    ).rejects.toThrow(/Notification API returned 500/);

    const updated = await Notification.findById(n._id).lean();
    expect(updated.deliveryStatus).toBe("RETRIED");
    expect(updated.retryCount).toBe(1);
  });
});

