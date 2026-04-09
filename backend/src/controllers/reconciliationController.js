import { ok } from "../http/response.js";
import { triggerManualReconciliation } from "../services/reconciliationService.js";

export const reconciliationController = {
  async run(req, res) {
    const result = await triggerManualReconciliation();
    return ok(res, { result });
  }
};

