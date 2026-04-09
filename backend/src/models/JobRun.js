import mongoose from "mongoose";

const JobRunSchema = new mongoose.Schema(
  {
    jobType: {
      type: String,
      required: true,
      enum: ["RECONCILIATION_NIGHTLY", "RECONCILIATION_MANUAL"]
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { type: String, required: true, enum: ["RUNNING", "SUCCESS", "FAILED"], default: "RUNNING" },
    recordsProcessed: { type: Number, required: true, min: 0, default: 0 },
    discrepanciesFound: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String },
    errorText: { type: String }
  },
  { timestamps: true }
);

JobRunSchema.index({ jobType: 1, startTime: -1 });
JobRunSchema.index({ status: 1, createdAt: -1 });
JobRunSchema.index({ createdAt: -1 });

export const JobRun = mongoose.models.JobRun || mongoose.model("JobRun", JobRunSchema);

