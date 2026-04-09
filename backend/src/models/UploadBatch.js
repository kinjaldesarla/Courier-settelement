import mongoose from "mongoose";

const UploadBatchSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, trim: true },
    sourceType: { type: String, required: true, enum: ["CSV", "JSON"] },
    originalFilename: { type: String },
    contentHash: { type: String }, // optional but useful if you want to detect same payloads across names
    rowCount: { type: Number, required: true, min: 0, max: 1000 },
    status: { type: String, required: true, enum: ["RECEIVED", "PROCESSED", "FAILED"], default: "RECEIVED" },
    processedAt: { type: Date },
    error: { type: String }
  },
  { timestamps: true }
);

UploadBatchSchema.index({ batchId: 1 }, { unique: true });
UploadBatchSchema.index({ status: 1, createdAt: -1 });
UploadBatchSchema.index({ createdAt: -1 });

export const UploadBatch =
  mongoose.models.UploadBatch || mongoose.model("UploadBatch", UploadBatchSchema);

