import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    merchantId: { type: String, required: true, trim: true },
    awbNumber: { type: String, required: true, trim: true },
    discrepancyType: { type: String, required: true },
    expectedValue: { type: mongoose.Schema.Types.Mixed },
    actualValue: { type: mongoose.Schema.Types.Mixed },
    suggestedAction: { type: String },
    deliveryStatus: { type: String, required: true },
    retryCount: { type: Number, required: true, default: 0 },
    response: { type: mongoose.Schema.Types.Mixed },
    error: { type: mongoose.Schema.Types.Mixed },
    lastAttemptAt: { type: Date },
    deadLetteredAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false, collection: "notifications" }
);

export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

