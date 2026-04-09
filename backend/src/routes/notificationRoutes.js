import express from "express";
import { notificationController } from "../controllers/notificationController.js";

export const notificationRoutes = express.Router();

notificationRoutes.get("/", notificationController.list);

