import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/courier",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  seedOnStart: String(process.env.SEED_ON_START ?? "false").toLowerCase() === "true",
  autoReconcileOnStart:
    String(process.env.AUTO_RECONCILE_ON_START ?? "true").toLowerCase() === "true"
};

