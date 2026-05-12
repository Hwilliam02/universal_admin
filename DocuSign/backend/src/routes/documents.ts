import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { UserRole } from "../types/index.js";
import { uploadDocument, listDocuments, getDocument } from "../controllers/documentController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { body } from "express-validator";
import { getConfig } from "../config/index.js";

const config = getConfig();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(config.UPLOADS_PATH, "original"));
  },
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    cb(null, safe);
  }
});

const upload = multer({ storage });

const router = Router();

router.post("/upload", requireAuth, upload.single("file"), asyncHandler(uploadDocument));
router.get("/:id", requireAuth, asyncHandler(getDocument));
router.get("/", requireAuth, asyncHandler(listDocuments));

export default router;
