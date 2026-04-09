import { ok } from "../http/response.js";
import { settlementRepo } from "../repositories/settlementRepo.js";
import { jobRunRepo } from "../repositories/jobRunRepo.js";

export const statsController = {
  async get(req, res) {
    const [stats, jobs] = await Promise.all([
      settlementRepo.getStats(),
      jobRunRepo.list({ limit: 1 })
    ]);

    return ok(res, {
      ...stats,
      lastJob: jobs[0] ?? null
    });
  }
};
