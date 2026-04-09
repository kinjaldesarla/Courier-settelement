import express from "express";
import { reconciliationController } from "../controllers/reconciliationController.js";

export const reconciliationRoutes = express.Router();

reconciliationRoutes.post("/run", reconciliationController.run);

