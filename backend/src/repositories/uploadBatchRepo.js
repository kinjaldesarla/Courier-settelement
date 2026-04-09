import { UploadBatch } from "../models/UploadBatch.js";

export const uploadBatchRepo = {
  async findByBatchId(batchId) {
    return UploadBatch.findOne({ batchId }).lean();
  },

  async create(batch) {
    return UploadBatch.create(batch);
  },

  async markProcessed(batchId, rowCount) {
    return UploadBatch.updateOne(
      { batchId },
      { $set: { status: "PROCESSED", processedAt: new Date(), rowCount } }
    );
  },

  async markFailed(batchId, error) {
    return UploadBatch.updateOne(
      { batchId },
      { $set: { status: "FAILED", processedAt: new Date(), error: String(error ?? "Unknown error") } }
    );
  }
};

