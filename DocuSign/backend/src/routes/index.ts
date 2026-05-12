import { Router } from "express";
import authRoutes from "./auth.js";
import documentRoutes from "./documents.js";
import fieldRoutes from "./fields.js";
import signingRoutes from "./signing.js";
import fileRoutes from "./files.js";
import auditRoutes from "./audit.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/fields", fieldRoutes);
router.use("/sign", signingRoutes);
router.use("/files", fileRoutes);
router.use("/audit", auditRoutes);

export default router;
