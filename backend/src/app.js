import express from "express";
import cors from "cors";
import { settlementRoutes } from "./routes/settlementRoutes.js";
import { jobRoutes } from "./routes/jobRoutes.js";
import { notificationRoutes } from "./routes/notificationRoutes.js";
import { reconciliationRoutes } from "./routes/reconciliationRoutes.js";
import { statsRoutes } from "./routes/statsRoutes.js";
import { notFound } from "./http/middleware/notFound.js";
import { errorHandler } from "./http/middleware/errorHandler.js";
import { ok } from "./http/response.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (req, res) => ok(res, { status: "ok" }));

  app.use("/api/settlements", settlementRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/reconciliation", reconciliationRoutes);
  app.use("/api/stats", statsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

