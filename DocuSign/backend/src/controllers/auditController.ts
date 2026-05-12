import { Request, Response } from "express";
import EnvelopeModel from "../models/Envelope.js";
import DocumentModel from "../models/Document.js";
import SignatureModel from "../models/Signature.js";
import AuditLogModel from "../models/AuditLog.js";
import { AppError } from "../types/index.js";

export const getAuditReport = async (req: Request, res: Response): Promise<void> => {
  const { envelopeId } = req.params as { envelopeId: string };

  const envelope = await EnvelopeModel.findById(envelopeId).lean().exec();
  if (!envelope) throw new AppError("Envelope not found", 404);

  // authorization: only admin or the signer can view
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  if (!user) throw new AppError("Unauthorized", 401);
  if (user.role !== "admin" && user.email !== envelope.signerEmail) throw new AppError("Forbidden", 403);

  const document = await DocumentModel.findById(envelope.documentId).lean().exec();
  const signatures = await SignatureModel.find({ envelopeId: envelope._id }).lean().exec();
  const auditLogs = await AuditLogModel.find({ envelopeId: envelope._id }).sort({ timestamp: 1 }).lean().exec();

  const result = {
    envelopeId: envelope._id,
    signerEmail: envelope.signerEmail,
    signingToken: envelope.signingToken,
    expiresAt: envelope.expiresAt,
    originalHash: document?.originalHash ?? null,
    finalHash: document?.finalFilePath ? (signatures.length ? signatures[signatures.length - 1].finalHash : null) : null,
    signedAt: signatures.length ? signatures[signatures.length - 1].signedAt : null,
    signatures: signatures.map((s) => ({ signatureFilePath: s.signatureFilePath, signedAt: s.signedAt, ipAddress: s.ipAddress, userAgent: s.userAgent, finalHash: s.finalHash })),
    auditLogs
  };

  const download = req.query.download === "1" || req.query.download === "true";
  if (download) {
    const filename = `audit-${envelopeId}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result, null, 2));
    return;
  }

  res.json(result);
};
