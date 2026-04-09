export function ok(res, data, meta) {
  return res.status(200).json({ ok: true, data, meta: meta ?? null });
}

export function created(res, data, meta) {
  return res.status(201).json({ ok: true, data, meta: meta ?? null });
}

export function fail(res, statusCode, code, message, details) {
  return res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message,
      details: details ?? null
    }
  });
}

