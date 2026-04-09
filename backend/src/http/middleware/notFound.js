import { fail } from "../response.js";

export function notFound(req, res) {
  return fail(res, 404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`);
}

