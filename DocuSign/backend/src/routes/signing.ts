import { Router } from "express";
import { validateSigningToken } from "../middleware/validateSigningToken.js";
import { getSignPage, submitSignature, createEnvelope, listEnvelopes, serveSignerFile, getSignerFields, getSignedFile } from "../controllers/signingController.js";
import { requireAuth } from "../middleware/auth.js";
import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// Authenticated sender routes (JWT required)
router.get("/envelopes", requireAuth, asyncHandler(listEnvelopes));
router.post("/envelope", requireAuth, [
  body("documentId").isString(),
  body("signerEmail").isEmail(),
  body("signMode").optional().isIn(["self", "other", "both"]).withMessage("signMode must be 'self', 'other', or 'both'")
], validate, asyncHandler(createEnvelope));

// Token-based signer routes (no JWT — signing token authenticates)
router.get("/:token/file", validateSigningToken, asyncHandler(serveSignerFile));
router.get("/:token/signed-file", validateSigningToken, asyncHandler(getSignedFile));
router.get("/:token/fields", validateSigningToken, asyncHandler(getSignerFields));
router.get("/:token", validateSigningToken, asyncHandler(getSignPage));
router.post("/:token", validateSigningToken, [body("signatureBase64").optional().isString()], validate, asyncHandler(submitSignature));

export default router;
