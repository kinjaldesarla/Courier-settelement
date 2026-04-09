import express from "express";
import multer from "multer";
import { settlementController } from "../controllers/settlementController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // plenty for 1000-row CSV
});

export const settlementRoutes = express.Router();

// CSV upload: multipart/form-data with field name "file"
settlementRoutes.post("/upload", upload.single("file"), settlementController.upload);
settlementRoutes.get("/", settlementController.list);

