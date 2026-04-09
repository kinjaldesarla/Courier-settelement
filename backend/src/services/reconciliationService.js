import { settlementRepo } from "../repositories/settlementRepo.js";
import { orderRepo } from "../repositories/orderRepo.js";
import { jobRunWriteRepo } from "../repositories/jobRunWriteRepo.js";
import { notificationWriteRepo } from "../repositories/notificationWriteRepo.js";
import { discrepancyQueue } from "../queues/discrepancyProducer.js";

function codTolerance(codAmount) {
  // tolerance = 2% or ₹10, whichever is lower
  return Math.min(codAmount * 0.02, 10);
}

function diff(actual, expected) {
  if (typeof actual === "number" && typeof expected === "number") return actual - expected;
  return null;
}

function buildSettlementDiscrepancies({ settlement, order, isDuplicateAwb }) {
  const discrepancies = [];

  if (!order) {
    discrepancies.push({
      type: "MISSING_ORDER",
      expectedValue: null,
      actualValue: { awbNumber: settlement.awbNumber },
      difference: null
    });
    return discrepancies;
  }

  // 1) COD short-remittance
  const tol = codTolerance(order.codAmount);
  if (settlement.settledCodAmount < order.codAmount - tol) {
    discrepancies.push({
      type: "COD_SHORT_REMITTANCE",
      expectedValue: order.codAmount,
      actualValue: settlement.settledCodAmount,
      difference: settlement.settledCodAmount - order.codAmount
    });
  }

  // 2) Weight dispute
  if (settlement.chargedWeight > order.declaredWeight * 1.1) {
    discrepancies.push({
      type: "WEIGHT_DISPUTE",
      expectedValue: order.declaredWeight,
      actualValue: settlement.chargedWeight,
      difference: settlement.chargedWeight - order.declaredWeight
    });
  }

  // 3) Phantom RTO charge
  if (settlement.rtoCharge > 0 && order.orderStatus === "DELIVERED") {
    discrepancies.push({
      type: "PHANTOM_RTO_CHARGE",
      expectedValue: 0,
      actualValue: settlement.rtoCharge,
      difference: settlement.rtoCharge
    });
  }

  // 5) Duplicate settlement
  if (isDuplicateAwb) {
    discrepancies.push({
      type: "DUPLICATE_SETTLEMENT",
      expectedValue: "unique settlement per AWB",
      actualValue: { awbNumber: settlement.awbNumber, batchId: settlement.batchId },
      difference: null
    });
  }

  return discrepancies;
}

function settlementStatusFrom(discrepancies) {
  if (!discrepancies.length) return "MATCHED";
  // duplicates and missing orders typically need manual review
  if (discrepancies.some((d) => d.type === "DUPLICATE_SETTLEMENT" || d.type === "MISSING_ORDER")) {
    return "PENDING_REVIEW";
  }
  return "DISCREPANCY";
}

export async function runReconciliation({ jobType = "RECONCILIATION_MANUAL", limit } = {}) {
  const job = await jobRunWriteRepo.start(jobType);

  try {
    const duplicateAwbSet = await settlementRepo.computeDuplicateAwbSet();
    const settlements = await settlementRepo.listUnreconciled({ limit: limit ?? 2000 });

    const awbs = settlements.map((s) => s.awbNumber);
    const orders = await orderRepo.findByAwbNumbers(awbs);
    const orderByAwb = new Map(orders.map((o) => [o.awbNumber, o]));

    const now = new Date();
    const updates = [];
    const queuedEvents = [];

    let discrepanciesFound = 0;

    for (const s of settlements) {
      const o = orderByAwb.get(s.awbNumber) ?? null;
      const discrepancies = buildSettlementDiscrepancies({
        settlement: s,
        order: o,
        isDuplicateAwb: duplicateAwbSet.has(s.awbNumber)
      });

      if (discrepancies.length) discrepanciesFound += 1;

      const reconciliationStatus = settlementStatusFrom(discrepancies);
      const discrepancyTypes = discrepancies.map((d) => d.type);

      updates.push({
        _id: s._id,
        reconciliationStatus,
        discrepancyTypes,
        discrepancies,
        reconciledAt: now
      });

      if (o && discrepancies.length) {
        for (const d of discrepancies) {
          const notif = await notificationWriteRepo.createOne({
            merchantId: o.merchantId,
            awbNumber: s.awbNumber,
            discrepancyType: d.type,
            expectedValue: d.expectedValue ?? null,
            actualValue: d.actualValue ?? null,
            suggestedAction: "Review discrepancy and raise dispute if applicable.",
            deliveryStatus: "PENDING",
            retryCount: 0,
            response: null,
            error: null,
            createdAt: now
          });

          queuedEvents.push({
            notificationId: String(notif._id),
            merchantId: notif.merchantId,
            awbNumber: notif.awbNumber,
            discrepancyType: notif.discrepancyType,
            expectedValue: notif.expectedValue ?? null,
            actualValue: notif.actualValue ?? null,
            suggestedAction: notif.suggestedAction ?? null
          });
        }
      }
    }

    await settlementRepo.bulkUpdateReconciliation(updates);

    // 4) Overdue remittance (orders delivered > 14 days ago and no settlement record exists)
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const overdueOrders = await orderRepo.listOverdueWithoutSettlement({ cutoffDate: cutoff });

    for (const o of overdueOrders) {
      const notif = await notificationWriteRepo.createOne({
        merchantId: o.merchantId,
        awbNumber: o.awbNumber,
        discrepancyType: "OVERDUE_REMITTANCE",
        expectedValue: { settlementBy: new Date(o.deliveryDate.getTime() + 14 * 24 * 60 * 60 * 1000) },
        actualValue: { settlementFound: false },
        suggestedAction: "Follow up for settlement remittance; no settlement found after 14 days.",
        deliveryStatus: "PENDING",
        retryCount: 0,
        response: null,
        error: null,
        createdAt: now
      });

      queuedEvents.push({
        notificationId: String(notif._id),
        merchantId: notif.merchantId,
        awbNumber: notif.awbNumber,
        discrepancyType: notif.discrepancyType,
        expectedValue: notif.expectedValue ?? null,
        actualValue: notif.actualValue ?? null,
        suggestedAction: notif.suggestedAction ?? null
      });
    }

    const q = discrepancyQueue();
    for (const e of queuedEvents) {
      await q.add(
        "discrepancy",
        e,
        {
          jobId: e.notificationId, // idempotent enqueue
          attempts: 6,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: true,
          removeOnFail: false
        }
      );
    }

    await jobRunWriteRepo.finishSuccess(job._id, {
      recordsProcessed: settlements.length,
      discrepanciesFound: discrepanciesFound + overdueOrders.length,
      notes: `Reconciled ${settlements.length} settlement rows; overdue orders=${overdueOrders.length}.`
    });

    return {
      jobRunId: String(job._id),
      reconciledSettlements: settlements.length,
      settlementDiscrepancies: discrepanciesFound,
      overdueOrders: overdueOrders.length,
      notificationsEnqueued: queuedEvents.length
    };
  } catch (err) {
    await jobRunWriteRepo.finishFailed(job._id, { errorText: err?.message ?? err });
    throw err;
  }
}

export async function triggerManualReconciliation() {
  return runReconciliation({ jobType: "RECONCILIATION_MANUAL" });
}

