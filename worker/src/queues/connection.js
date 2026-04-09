import { env } from "../config/env.js";

export function redisConnection() {
  return { connection: { url: env.redisUrl } };
}

