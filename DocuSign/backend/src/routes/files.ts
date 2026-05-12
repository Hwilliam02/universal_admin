import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { serveFile } from "../controllers/fileController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/:type/:filename", requireAuth, asyncHandler(serveFile));

export default router;
