import { env } from "../config/env.js";

export function redisConnection() {
  // BullMQ accepts ioredis options; a URL string works too.
  return { connection: { url: env.redisUrl } };
}

