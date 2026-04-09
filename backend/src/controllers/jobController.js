import { ok } from "../http/response.js";
import { jobRunRepo } from "../repositories/jobRunRepo.js";
import { triggerManualReconciliation } from "../services/reconciliationService.js";

export const jobController = {
  async list(req, res) {
    const items = await jobRunRepo.list({ limit: req.query?.limit ?? 50 });
    return ok(res, { items });
  },

  async trigger(req, res) {
    const result = await triggerManualReconciliation();
    return ok(res, { result });
  }
};

