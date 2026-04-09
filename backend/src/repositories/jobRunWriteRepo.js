import { JobRun } from "../models/JobRun.js";

export const jobRunWriteRepo = {
  async start(jobType) {
    return JobRun.create({
      jobType,
      startTime: new Date(),
      status: "RUNNING",
      recordsProcessed: 0,
      discrepanciesFound: 0
    });
  },

  async finishSuccess(id, { recordsProcessed, discrepanciesFound, notes }) {
    return JobRun.updateOne(
      { _id: id },
      {
        $set: {
          endTime: new Date(),
          status: "SUCCESS",
          recordsProcessed,
          discrepanciesFound,
          notes: notes ?? null
        }
      }
    );
  },

  async finishFailed(id, { errorText }) {
    return JobRun.updateOne(
      { _id: id },
      {
        $set: {
          endTime: new Date(),
          status: "FAILED",
          errorText: String(errorText ?? "Unknown error")
        }
      }
    );
  }
};

