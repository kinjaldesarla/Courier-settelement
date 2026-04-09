import express from "express";
import { jobController } from "../controllers/jobController.js";

export const jobRoutes = express.Router();

jobRoutes.get("/", jobController.list);
jobRoutes.post("/trigger", jobController.trigger);

