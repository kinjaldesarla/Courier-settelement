import { fail } from "../response.js";

export function errorHandler(err, req, res, next) {
  void next;

  // eslint-disable-next-line no-console
  console.error(err);

  if (res.headersSent) return;

  return fail(res, 500, "INTERNAL_ERROR", "Unexpected server error", {
    name: err?.name,
    message: err?.message
  });
}

