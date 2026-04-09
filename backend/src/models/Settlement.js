import mongoose from "mongoose";

const DiscrepancySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "COD_SHORT_REMITTANCE",
        "WEIGHT_DISPUTE",
        "PHANTOM_RTO_CHARGE",
        "OVERDUE_REMITTANCE",
        "DUPLICATE_SETTLEMENT",
        "MISSING_ORDER"
      ]
    },
    expectedValue: { type: mongoose.Schema.Types.Mixed },
    actualValue: { type: mongoose.Schema.Types.Mixed },
    difference: { type: mongoose.Schema.Types.Mixed }
  },
  { _id: false }
);

const SettlementSchema = new mongoose.Schema(
  {
    awbNumber: { type: String, required: true, trim: true },
    settledCodAmount: { type: Number, required: true, min: 0 },
    chargedWeight: { type: Number, required: true, min: 0 },
    forwardCharge: { type: Number, required: true, min: 0 },
    rtoCharge: { type: Number, required: true, min: 0 },
    codHandlingFee: { type: Number, required: true, min: 0 },
    settlementDate: { type: Date, required: true },
    batchId: { type: String, required: true, trim: true },

    reconciliationStatus: {
      type: String,
      required: true,
      enum: ["MATCHED", "DISCREPANCY", "PENDING_REVIEW"],
      default: "PENDING_REVIEW"
    },
    discrepancyTypes: { type: [String], default: [] },
    discrepancies: { type: [DiscrepancySchema], default: [] },
    reviewedAt: { type: Date },
    reconciledAt: { type: Date }
  },
  { timestamps: true }
);

// Idempotency at record level within a batch.
SettlementSchema.index({ batchId: 1, awbNumber: 1 }, { unique: true });
SettlementSchema.index({ batchId: 1, settlementDate: -1 });
SettlementSchema.index({ awbNumber: 1 });
SettlementSchema.index({ createdAt: -1 });
SettlementSchema.index({ reconciliationStatus: 1, createdAt: -1 });
SettlementSchema.index({ batchId: 1, reconciliationStatus: 1 });

export const Settlement =
  mongoose.models.Settlement || mongoose.model("Settlement", SettlementSchema);

