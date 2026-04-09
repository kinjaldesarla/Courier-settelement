import request from "supertest";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { startInMemoryMongo, stopInMemoryMongo, resetDb } from "./setup.js";
import { createApp } from "../src/app.js";

describe("POST /api/settlements/upload (JSON)", () => {
  const app = createApp();

  beforeAll(async () => {
    await startInMemoryMongo();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("uploads a valid batch and is idempotent by batchId", async () => {
    const body = {
      batchId: "batch_test_1",
      rows: [
        {
          awbNumber: "A100",
          settledCodAmount: 100,
          chargedWeight: 1.2,
          forwardCharge: 50,
          rtoCharge: 0,
          codHandlingFee: 2,
          settlementDate: "2026-04-08"
        }
      ]
    };

    const r1 = await request(app).post("/api/settlements/upload").send(body);
    expect(r1.status).toBe(201);
    expect(r1.body.ok).toBe(true);
    expect(r1.body.data.insertedCount).toBe(1);
    expect(r1.body.meta.alreadyProcessed).toBe(false);

    const r2 = await request(app).post("/api/settlements/upload").send(body);
    expect(r2.status).toBe(201);
    expect(r2.body.ok).toBe(true);
    expect(r2.body.data.insertedCount).toBe(0);
    expect(r2.body.meta.alreadyProcessed).toBe(true);
  });

  it("rejects duplicate awbNumber inside the same upload", async () => {
    const body = {
      batchId: "batch_test_dup",
      rows: [
        {
          awbNumber: "A200",
          settledCodAmount: 100,
          chargedWeight: 1.2,
          forwardCharge: 50,
          rtoCharge: 0,
          codHandlingFee: 2,
          settlementDate: "2026-04-08"
        },
        {
          awbNumber: "A200",
          settledCodAmount: 100,
          chargedWeight: 1.2,
          forwardCharge: 50,
          rtoCharge: 0,
          codHandlingFee: 2,
          settlementDate: "2026-04-08"
        }
      ]
    };

    const r = await request(app).post("/api/settlements/upload").send(body);
    expect(r.status).toBe(400);
    expect(r.body.ok).toBe(false);
    expect(r.body.error.code).toBe("VALIDATION_FAILED");
    expect(r.body.error.details.validationErrors.length).toBeGreaterThan(0);
  });
});

