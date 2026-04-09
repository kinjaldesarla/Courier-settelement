import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/courier",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  notificationApiUrl: process.env.NOTIFICATION_API_URL ?? "https://webhook.site/ff6d1945-468b-40b1-881c-722e67434a32",
  // when true, we send Idempotency-Key header
  sendIdempotencyKey: String(process.env.SEND_IDEMPOTENCY_KEY ?? "true").toLowerCase() === "true"
};

