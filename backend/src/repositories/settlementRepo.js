import { Settlement } from "../models/Settlement.js";

export const settlementRepo = {
  async insertMany(docs) {
    return Settlement.insertMany(docs, { ordered: false });
  },

  async listUnreconciled({ limit }) {
    const lim = Math.min(Math.max(Number(limit ?? 2000), 1), 5000);
    return Settlement.find({ reconciledAt: { $exists: false } })
      .sort({ settlementDate: -1, _id: -1 })
      .limit(lim)
      .lean();
  },

  async computeDuplicateAwbSet() {
    const rows = await Settlement.aggregate([
      { $group: { _id: "$awbNumber", batchIds: { $addToSet: "$batchId" }, c: { $sum: 1 } } },
      { $match: { $expr: { $gt: [{ $size: "$batchIds" }, 1] } } },
      { $project: { _id: 1 } }
    ]);
    return new Set(rows.map((r) => r._id));
  },

  async bulkUpdateReconciliation(updates) {
    if (!updates.length) return { matchedCount: 0, modifiedCount: 0 };

    const ops = updates.map((u) => ({
      updateOne: {
        filter: { _id: u._id },
        update: {
          $set: {
            reconciliationStatus: u.reconciliationStatus,
            discrepancyTypes: u.discrepancyTypes,
            discrepancies: u.discrepancies,
            reconciledAt: u.reconciledAt
          }
        }
      }
    }));

    return Settlement.bulkWrite(ops, { ordered: false });
  },

  async list({ status, limit }) {
    const lim = Math.min(Math.max(Number(limit ?? 50), 1), 200);

    const pipeline = [
      {
        $lookup: {
          from: "orders",
          localField: "awbNumber",
          foreignField: "awbNumber",
          as: "order"
        }
      },
      { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "uploadbatches",
          localField: "batchId",
          foreignField: "batchId",
          as: "batch"
        }
      },
      { $unwind: { path: "$batch", preserveNullAndEmptyArrays: true } }
    ];

    if (status) {
      pipeline.push({ $match: { reconciliationStatus: String(status) } });
    }

    pipeline.push(
      { $sort: { settlementDate: -1, _id: -1 } },
      { $limit: lim },
      {
        $project: {
          _id: 1,
          awbNumber: 1,
          merchantId: "$order.merchantId",
          courierPartner: "$order.courierPartner",
          orderStatus: "$order.orderStatus",
          orderCodAmount: "$order.codAmount",
          declaredWeight: "$order.declaredWeight",
          orderDate: "$order.orderDate",
          deliveryDate: "$order.deliveryDate",
          settledCodAmount: 1,
          chargedWeight: 1,
          forwardCharge: 1,
          rtoCharge: 1,
          codHandlingFee: 1,
          settlementDate: 1,
          batchId: 1,
          createdAt: 1,
          reconciliationStatus: 1,
          discrepancyTypes: 1,
          discrepancies: 1,
          reconciledAt: 1,
          batchStatus: "$batch.status",
          uploadedAt: "$batch.createdAt"
        }
      }
    );

    return Settlement.aggregate(pipeline);
  },

  async getStats() {
    const [totals, discrepancyValue, courierDisputes] = await Promise.all([
      Settlement.aggregate([
        {
          $group: {
            _id: null,
            totalSettlements: { $sum: 1 },
            totalDiscrepancies: {
              $sum: {
                $cond: [{ $eq: ["$reconciliationStatus", "DISCREPANCY"] }, 1, 0]
              }
            },
            pendingReviewCount: {
              $sum: {
                $cond: [{ $eq: ["$reconciliationStatus", "PENDING_REVIEW"] }, 1, 0]
              }
            }
          }
        }
      ]),
      Settlement.aggregate([
        { $unwind: { path: "$discrepancies", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: null,
            totalDiscrepancyValue: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      { $type: "$discrepancies.difference" },
                      ["double", "int", "long", "decimal"]
                    ]
                  },
                  { $abs: "$discrepancies.difference" },
                  0
                ]
              }
            }
          }
        }
      ]),
      Settlement.aggregate([
        {
          $match: {
            reconciliationStatus: { $in: ["DISCREPANCY", "PENDING_REVIEW"] }
          }
        },
        {
          $lookup: {
            from: "orders",
            localField: "awbNumber",
            foreignField: "awbNumber",
            as: "order"
          }
        },
        { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$order.courierPartner", "Unknown"] },
            disputes: { $sum: 1 }
          }
        },
        { $sort: { disputes: -1, _id: 1 } }
      ])
    ]);

    return {
      totalSettlements: totals[0]?.totalSettlements ?? 0,
      totalDiscrepancies: totals[0]?.totalDiscrepancies ?? 0,
      pendingReviewCount: totals[0]?.pendingReviewCount ?? 0,
      totalDiscrepancyValue: discrepancyValue[0]?.totalDiscrepancyValue ?? 0,
      courierDisputes: courierDisputes.map((item) => ({
        courier: item._id,
        disputes: item.disputes
      }))
    };
  }
};

