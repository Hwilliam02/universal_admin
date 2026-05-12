import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAuditReport } from "../controllers/auditController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/:envelopeId", requireAuth, asyncHandler(getAuditReport));

export default router;
