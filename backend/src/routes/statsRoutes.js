import express from "express";
import { statsController } from "../controllers/statsController.js";

export const statsRoutes = express.Router();

statsRoutes.get("/", statsController.get);
