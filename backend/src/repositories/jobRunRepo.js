import { JobRun } from "../models/JobRun.js";

export const jobRunRepo = {
  async list({ limit }) {
    const lim = Math.min(Math.max(Number(limit ?? 50), 1), 200);
    return JobRun.find({}).sort({ startTime: -1, _id: -1 }).limit(lim).lean();
  }
};

