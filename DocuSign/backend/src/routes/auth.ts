import { Router } from "express";
import { login, register, getMe } from "../controllers/authController.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", authRateLimiter, asyncHandler(register));

router.post("/login", authRateLimiter, asyncHandler(login));

/** Validate token & return fresh user data */
router.get("/me", requireAuth as any, asyncHandler(getMe as any));

export default router;
