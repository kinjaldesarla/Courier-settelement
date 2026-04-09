import { ok } from "../http/response.js";
import { notificationRepo } from "../repositories/notificationRepo.js";

export const notificationController = {
  async list(req, res) {
    const items = await notificationRepo.list({
      merchantId: req.query?.merchantId ?? null,
      status: req.query?.status ?? null,
      limit: req.query?.limit ?? 50
    });
    return ok(res, { items });
  }
};

