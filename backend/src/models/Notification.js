import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    merchantId: { type: String, required: true, trim: true },
    awbNumber: { type: String, required: true, trim: true },
    discrepancyType: {
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
    suggestedAction: { type: String },
    deliveryStatus: {
      type: String,
      required: true,
      enum: ["PENDING", "SENT", "FAILED", "RETRIED"],
      default: "PENDING"
    },
    retryCount: { type: Number, required: true, min: 0, default: 0 },
    response: { type: mongoose.Schema.Types.Mixed },
    error: { type: mongoose.Schema.Types.Mixed },
    lastAttemptAt: { type: Date },
    deadLetteredAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

NotificationSchema.index({ merchantId: 1, createdAt: -1 });
NotificationSchema.index({ awbNumber: 1, createdAt: -1 });
NotificationSchema.index({ deliveryStatus: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

