import crypto from "crypto";
import { parse as parseCsv } from "csv-parse/sync";
import { nanoid } from "nanoid";
import { settlementRepo } from "../repositories/settlementRepo.js";
import { uploadBatchRepo } from "../repositories/uploadBatchRepo.js";

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function toNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeString(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function validateAndNormalizeRow(row, rowIndex1Based) {
  const errors = [];
  const awbNumber = normalizeString(row.awbNumber);
  if (!awbNumber) errors.push("missing awbNumber");

  const settledCodAmount = toNumber(row.settledCodAmount);
  const chargedWeight = toNumber(row.chargedWeight);
  const forwardCharge = toNumber(row.forwardCharge);
  const rtoCharge = toNumber(row.rtoCharge);
  const codHandlingFee = toNumber(row.codHandlingFee);
  const settlementDate = toDate(row.settlementDate);

  if (settledCodAmount === null) errors.push("invalid settledCodAmount");
  if (chargedWeight === null) errors.push("invalid chargedWeight");
  if (forwardCharge === null) errors.push("invalid forwardCharge");
  if (rtoCharge === null) errors.push("invalid rtoCharge");
  if (codHandlingFee === null) errors.push("invalid codHandlingFee");
  if (!settlementDate) errors.push("invalid settlementDate");

  if (errors.length) {
    return {
      ok: false,
      error: { row: rowIndex1Based, awbNumber: awbNumber || null, errors }
    };
  }

  return {
    ok: true,
    value: {
      awbNumber,
      settledCodAmount,
      chargedWeight,
      forwardCharge,
      rtoCharge,
      codHandlingFee,
      settlementDate
    }
  };
}

function parseJsonBody(body) {
  // Supported:
  // - { batchId?, rows: [...] }
  // - [...] (raw array)
  if (Array.isArray(body)) return { batchId: null, rows: body };
  if (body && Array.isArray(body.rows)) return { batchId: body.batchId ?? null, rows: body.rows };
  return { batchId: null, rows: null };
}

function parseCsvBuffer(buffer) {
  const text = buffer.toString("utf8");
  const records = parseCsv(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records;
}

export async function uploadSettlements({ sourceType, originalFilename, batchIdInput, fileBuffer, jsonBody }) {
  const validationErrors = [];

  let rows;
  let sourceHash;
  let sourceTypeNorm;

  if (sourceType === "CSV") {
    sourceTypeNorm = "CSV";
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      return {
        ok: false,
        httpStatus: 400,
        code: "INVALID_UPLOAD",
        message: "CSV upload requires a file",
        details: null
      };
    }
    sourceHash = sha256(fileBuffer);
    try {
      rows = parseCsvBuffer(fileBuffer);
    } catch (e) {
      return {
        ok: false,
        httpStatus: 400,
        code: "MALFORMED_CSV",
        message: "Could not parse CSV",
        details: { error: String(e?.message ?? e) }
      };
    }
  } else if (sourceType === "JSON") {
    sourceTypeNorm = "JSON";
    const parsed = parseJsonBody(jsonBody);
    if (!parsed.rows) {
      return {
        ok: false,
        httpStatus: 400,
        code: "INVALID_JSON",
        message: "Expected JSON array or { rows: [...] }",
        details: null
      };
    }
    rows = parsed.rows;
    const raw = Buffer.from(JSON.stringify(jsonBody ?? rows));
    sourceHash = sha256(raw);
    batchIdInput = batchIdInput ?? parsed.batchId ?? null;
  } else {
    return {
      ok: false,
      httpStatus: 415,
      code: "UNSUPPORTED_TYPE",
      message: "Only CSV or JSON uploads are supported",
      details: null
    };
  }

  if (!Array.isArray(rows)) {
    return {
      ok: false,
      httpStatus: 400,
      code: "INVALID_ROWS",
      message: "Upload must contain an array of rows",
      details: null
    };
  }

  if (rows.length === 0) {
    return {
      ok: false,
      httpStatus: 400,
      code: "EMPTY_UPLOAD",
      message: "Upload contains 0 rows",
      details: null
    };
  }

  if (rows.length > 1000) {
    return {
      ok: false,
      httpStatus: 400,
      code: "ROW_LIMIT_EXCEEDED",
      message: "Max 1,000 rows per upload",
      details: { rowCount: rows.length, max: 1000 }
    };
  }

  // Batch idempotency:
  // - If caller provides batchId, use it.
  // - Else derive from content hash (same payload -> same batchId).
  const batchId = normalizeString(batchIdInput) || `hash_${sourceHash.slice(0, 24)}`;

  const existing = await uploadBatchRepo.findByBatchId(batchId);
  if (existing && existing.status === "PROCESSED") {
    return {
      ok: true,
      alreadyProcessed: true,
      data: {
        batch: existing,
        insertedCount: 0,
        skippedCount: existing.rowCount ?? rows.length,
        validationErrors: []
      }
    };
  }

  // Track the batch early (unique batchId enforces idempotency across uploads).
  if (!existing) {
    try {
      await uploadBatchRepo.create({
        batchId,
        sourceType: sourceTypeNorm,
        originalFilename: originalFilename ?? null,
        contentHash: sourceHash,
        rowCount: rows.length,
        status: "RECEIVED"
      });
    } catch (e) {
      // If we raced and another request created it, re-fetch.
      const again = await uploadBatchRepo.findByBatchId(batchId);
      if (again && again.status === "PROCESSED") {
        return {
          ok: true,
          alreadyProcessed: true,
          data: {
            batch: again,
            insertedCount: 0,
            skippedCount: again.rowCount ?? rows.length,
            validationErrors: []
          }
        };
      }
    }
  }

  const seenAwb = new Set();
  const normalizedDocs = [];

  for (let i = 0; i < rows.length; i++) {
    const rowIndex = i + 1;
    const r = rows[i] ?? {};

    // CSV columns come in as strings with exact header names; map both snake/camel just in case.
    const mapped = {
      awbNumber: r.awbNumber ?? r.awb_number ?? r.AWB ?? r.awb ?? r["awbNumber"],
      settledCodAmount: r.settledCodAmount ?? r.settled_cod_amount ?? r.cod_settled ?? r["settledCodAmount"],
      chargedWeight: r.chargedWeight ?? r.charged_weight ?? r["chargedWeight"],
      forwardCharge: r.forwardCharge ?? r.forward_charge ?? r["forwardCharge"],
      rtoCharge: r.rtoCharge ?? r.rto_charge ?? r["rtoCharge"],
      codHandlingFee: r.codHandlingFee ?? r.cod_handling_fee ?? r["codHandlingFee"],
      settlementDate: r.settlementDate ?? r.settlement_date ?? r["settlementDate"]
    };

    const vr = validateAndNormalizeRow(mapped, rowIndex);
    if (!vr.ok) {
      validationErrors.push(vr.error);
      continue;
    }

    if (seenAwb.has(vr.value.awbNumber)) {
      validationErrors.push({
        row: rowIndex,
        awbNumber: vr.value.awbNumber,
        errors: ["duplicate awbNumber within upload"]
      });
      continue;
    }
    seenAwb.add(vr.value.awbNumber);

    normalizedDocs.push({
      ...vr.value,
      batchId
    });
  }

  if (validationErrors.length) {
    await uploadBatchRepo.markFailed(batchId, "Validation failed");
    return {
      ok: false,
      httpStatus: 400,
      code: "VALIDATION_FAILED",
      message: "Upload validation failed",
      details: { validationErrors, batchId }
    };
  }

  let insertedCount = 0;
  let skippedCount = 0;

  try {
    const inserted = await settlementRepo.insertMany(normalizedDocs);
    insertedCount = inserted.length;
    skippedCount = normalizedDocs.length - insertedCount;
    await uploadBatchRepo.markProcessed(batchId, normalizedDocs.length);
  } catch (e) {
    // If insertMany fails due to duplicates, it throws with writeErrors while still inserting others.
    const writeErrors = e?.writeErrors ?? [];
    const dupErrors = writeErrors.filter((we) => we?.code === 11000);
    if (writeErrors.length && dupErrors.length === writeErrors.length) {
      insertedCount = normalizedDocs.length - writeErrors.length;
      skippedCount = writeErrors.length;
      await uploadBatchRepo.markProcessed(batchId, normalizedDocs.length);
    } else {
      await uploadBatchRepo.markFailed(batchId, e?.message ?? "Insert failed");
      return {
        ok: false,
        httpStatus: 500,
        code: "INSERT_FAILED",
        message: "Failed to persist settlement rows",
        details: { error: String(e?.message ?? e), batchId, requestId: nanoid(8) }
      };
    }
  }

  const batch = await uploadBatchRepo.findByBatchId(batchId);
  return {
    ok: true,
    alreadyProcessed: false,
    data: {
      batch,
      insertedCount,
      skippedCount,
      validationErrors: []
    }
  };
}

