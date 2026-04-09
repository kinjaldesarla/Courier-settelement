import { created, fail, ok } from "../http/response.js";
import { uploadSettlements } from "../services/settlementUploadService.js";
import { settlementRepo } from "../repositories/settlementRepo.js";

export const settlementController = {
  async upload(req, res) {
    const contentType = String(req.headers["content-type"] ?? "").toLowerCase();
    const isMultipart = contentType.includes("multipart/form-data");

    const batchIdInput = req.body?.batchId ?? req.query?.batchId ?? req.headers["x-batch-id"] ?? null;

    const sourceType = isMultipart ? "CSV" : "JSON";

    const result = await uploadSettlements({
      sourceType,
      originalFilename: req.file?.originalname ?? null,
      batchIdInput,
      fileBuffer: req.file?.buffer ?? null,
      jsonBody: isMultipart ? null : req.body
    });

    if (!result.ok) {
      return fail(res, result.httpStatus, result.code, result.message, result.details);
    }

    return created(res, result.data, { alreadyProcessed: result.alreadyProcessed });
  },

  async list(req, res) {
    const items = await settlementRepo.list({
      status: req.query?.status ?? null,
      limit: req.query?.limit ?? 50
    });
    return ok(res, { items });
  }
};

