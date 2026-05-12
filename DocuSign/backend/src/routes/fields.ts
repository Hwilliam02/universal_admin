import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { UserRole } from "../types/index.js";
import { createField, getFieldsForEnvelope, deleteField } from "../controllers/fieldController.js";
import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  [
    body("envelopeId").isString(),
    body("pageNumber").isInt(),
    body("x").isFloat({ min: 0, max: 1 }),
    body("y").isFloat({ min: 0, max: 1 }),
    body("width").isFloat({ min: 0, max: 1 }),
    body("height").isFloat({ min: 0, max: 1 }),
    body("type").isIn(["signature", "text", "date", "name"])
  ],  validate,  asyncHandler(createField)
);

router.delete("/:fieldId", requireAuth, asyncHandler(deleteField));

router.get("/:envelopeId", requireAuth, asyncHandler(getFieldsForEnvelope));

export default router;
