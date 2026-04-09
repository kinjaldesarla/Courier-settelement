import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, resetDb } from "./setup.js";
import { Order } from "../src/models/Order.js";
import { Settlement } from "../src/models/Settlement.js";
import { UploadBatch } from "../src/models/UploadBatch.js";

vi.mock("../src/queues/discrepancyProducer.js", () => {
  return {
    discrepancyQueue: () => ({
      add: vi.fn().mockResolvedValue(true)
    })
  };
});

describe("Reconciliation engine", () => {
  beforeAll(async () => {
    await startInMemoryMongo();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("creates a discrepancy, updates settlement status, and enqueues notification jobs", async () => {
    await Order.create({
      awbNumber: "AWB_X1",
      merchantId: "mrc_1",
      courierPartner: "Delhivery",
      orderStatus: "DELIVERED",
      codAmount: 1000,
      declaredWeight: 1.0,
      orderDate: new Date("2026-03-01"),
      deliveryDate: new Date("2026-03-10")
    });

    await UploadBatch.create({
      batchId: "batch_x",
      sourceType: "JSON",
      rowCount: 1,
      status: "PROCESSED",
      processedAt: new Date()
    });

    await Settlement.create({
      awbNumber: "AWB_X1",
      settledCodAmount: 950, // short remittance beyond tolerance
      chargedWeight: 1.25, // also weight dispute
      forwardCharge: 50,
      rtoCharge: 10, // phantom RTO charge (delivered)
      codHandlingFee: 2,
      settlementDate: new Date("2026-04-01"),
      batchId: "batch_x"
    });

    const { runReconciliation } = await import("../src/services/reconciliationService.js");
    const result = await runReconciliation({ jobType: "RECONCILIATION_MANUAL" });

    expect(result.reconciledSettlements).toBe(1);
    expect(result.settlementDiscrepancies).toBe(1);
    expect(result.notificationsEnqueued).toBeGreaterThan(0);

    const s = await Settlement.findOne({ awbNumber: "AWB_X1" }).lean();
    expect(s.reconciliationStatus).toBe("DISCREPANCY");
    expect(s.discrepancyTypes).toContain("COD_SHORT_REMITTANCE");
    expect(s.discrepancyTypes).toContain("WEIGHT_DISPUTE");
    expect(s.discrepancyTypes).toContain("PHANTOM_RTO_CHARGE");
    expect(s.reconciledAt).toBeTruthy();
  });
});

