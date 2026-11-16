import { Router } from "express";

import multer from "multer";

import {
  confirmVerification,
  scanDocument,
} from "../controllers/verificationController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) =>
    callback(
      null,
      ["image/jpeg", "image/png", "image/webp", "application/pdf", "image/jpg"].includes(file.mimetype),
    ),
});

router.post("/scan", upload.single("document"), scanDocument);

router.post("/:id/confirm", confirmVerification);

export default router;
