import { Request, Response } from "express";
import crypto from "crypto";
import { getConfig } from "../config/index.js";
import EnvelopeModel from "../models/Envelope.js";
import DocumentModel from "../models/Document.js";
import { DocumentStatus, IRequestWithUser } from "../types/index.js";
import SignatureModel from "../models/Signature.js";
import AuditLogModel from "../models/AuditLog.js";
import { AppError } from "../types/index.js";
import path from "path";
import fs from "fs/promises";
import { generateFileHash } from "../utils/hash.js";
import { PDFDocument, rgb } from "pdf-lib";

const config = getConfig();

export const getSignerFields = async (req: Request, res: Response): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envelope: any = (req as any).envelope;
  const FieldModel = (await import("../models/Field.js")).default;
  const fields = await FieldModel.find({ envelopeId: envelope._id }).lean().exec();
  res.json(fields);
};

export const serveSignerFile = async (req: Request, res: Response): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envelope: any = (req as any).envelope;
  const document = await DocumentModel.findById(envelope.documentId).lean().exec();
  if (!document) throw new AppError("Document not found", 404);

  const { safeResolveUploadPath } = await import("../utils/path.js");
  const fsSync = await import("fs");

  // When already signed, serve the final signed PDF so the browser shows
  // the embedded signatures and text values instead of the blank original.
  if (envelope.status === "signed" && document.finalFilePath) {
    if (!fsSync.default.existsSync(document.finalFilePath)) throw new AppError("Signed file missing on disk", 404);
    res.sendFile(document.finalFilePath);
    return;
  }

  // When document is partially signed (another signer completed), serve
  // the intermediate PDF so the next signer can see previous signatures.
  if (document.status === "partially_signed" && document.finalFilePath) {
    if (!fsSync.default.existsSync(document.finalFilePath)) throw new AppError("Intermediate file missing on disk", 404);
    res.sendFile(document.finalFilePath);
    return;
  }

  // Serve the original PDF so the signer can view it
  const fullPath = safeResolveUploadPath("original", document.originalFilename);
  if (!fsSync.default.existsSync(fullPath)) throw new AppError("File not found", 404);
  res.sendFile(fullPath);
};

export const listEnvelopes = async (req: IRequestWithUser, res: Response): Promise<void> => {
  if (!req.user?.global_user_id) throw new AppError("Unauthorized", 401);
  // list envelopes for documents created by this user
  const docs = await DocumentModel.find({ createdBy: req.user.global_user_id }).lean().exec();
  const docIds = docs.map(d => d._id);
  const envelopes = await EnvelopeModel.find({ documentId: { $in: docIds } }).lean().exec();

  const result = envelopes.map(e => {
    const doc = docs.find(d => d._id.toString() === e.documentId.toString());
    return {
      _id: e._id,
      documentId: e.documentId.toString(),
      documentTitle: doc ? (doc.title || doc.originalFilename) : "Unknown",
      signerEmail: e.signerEmail,
      status: e.status,
      expiresAt: e.expiresAt,
      signingToken: e.signingToken,
      signMode: (doc as any)?.signMode || "self"
    };
  });

  res.json(result);
};

export const createEnvelope = async (req: IRequestWithUser, res: Response): Promise<void> => {
  const { documentId, signerEmail, signMode } = req.body as { documentId: string; signerEmail: string; signMode?: "self" | "other" | "both" };
  const adminEmail = req.user?.email;

  // Block creating new envelopes for already-signed or partially-signed documents
  const doc = await DocumentModel.findById(documentId).exec();
  if (!doc) throw new AppError("Document not found", 404);
  if (doc.status === DocumentStatus.SIGNED) {
    throw new AppError("Cannot create envelope — document has already been signed", 403);
  }
  if (doc.status === DocumentStatus.PARTIALLY_SIGNED) {
    throw new AppError("Cannot create envelope — document is already partially signed", 403);
  }

  // Block duplicate envelopes for the same document
  const existingEnvelopes = await EnvelopeModel.find({ documentId }).lean().exec();
  if (existingEnvelopes.length > 0) {
    throw new AppError("Envelopes already exist for this document", 400);
  }

  const expiresAt = new Date(Date.now() + config.SIGNING_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  if (signMode === "both") {
    // Validate: signer email must differ from admin
    if (!adminEmail) throw new AppError("Admin email not available", 400);
    if (signerEmail.toLowerCase() === adminEmail.toLowerCase()) {
      throw new AppError("Signer email must be different from your own email for 'both' mode", 400);
    }

    // Create admin envelope
    const adminToken = crypto.randomBytes(16).toString("hex");
    const adminEnvelope = await EnvelopeModel.create({ documentId, signerEmail: adminEmail, signingToken: adminToken, expiresAt });
    await AuditLogModel.create({ envelopeId: adminEnvelope._id, action: "envelope_created", timestamp: new Date(), metadata: { signerEmail: adminEmail, signMode: "both", role: "admin" } });

    // Create signer envelope
    const signerToken = crypto.randomBytes(16).toString("hex");
    const signerEnvelope = await EnvelopeModel.create({ documentId, signerEmail, signingToken: signerToken, expiresAt });
    await AuditLogModel.create({ envelopeId: signerEnvelope._id, action: "envelope_created", timestamp: new Date(), metadata: { signerEmail, signMode: "both", role: "signer" } });

    // Update document signMode
    doc.signMode = "both";
    await doc.save();

    res.status(201).json({
      signMode: "both",
      adminEnvelope: { token: adminToken, envelopeId: adminEnvelope._id },
      signerEnvelope: { token: signerToken, envelopeId: signerEnvelope._id }
    });
  } else {
    // Existing behavior for "self" and "other" modes
    const token = crypto.randomBytes(16).toString("hex");
    const envelope = await EnvelopeModel.create({ documentId, signerEmail, signingToken: token, expiresAt });
    await AuditLogModel.create({ envelopeId: envelope._id, action: "envelope_created", timestamp: new Date(), metadata: { signerEmail } });

    if (signMode) {
      doc.signMode = signMode;
      await doc.save();
    }

    res.status(201).json({ token, envelopeId: envelope._id });
  }
};

export const getSignPage = async (req: Request, res: Response): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envelope: any = (req as any).envelope;
  const document = await DocumentModel.findById(envelope.documentId).lean().exec();
  if (!document) throw new AppError("Document not found", 404);
  res.json({
    envelopeId: envelope._id,
    documentId: document._id,
    originalFilename: document.originalFilename,
    documentTitle: document.title || document.originalFilename,
    signerEmail: envelope.signerEmail,
    status: envelope.status
  });
};

export const getSignedFile = async (req: Request, res: Response): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envelope: any = (req as any).envelope;
  if (envelope.status !== "signed") throw new AppError("Document not yet signed", 400);
  const document = await DocumentModel.findById(envelope.documentId).lean().exec();
  if (!document?.finalFilePath) throw new AppError("Signed file not found", 404);
  const fsSync = await import("fs");
  if (!fsSync.default.existsSync(document.finalFilePath)) throw new AppError("Signed file missing on disk", 404);
  res.sendFile(document.finalFilePath);
};

export const submitSignature = async (req: Request, res: Response): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envelope: any = (req as any).envelope;

  // Guard against double-signing
  if (envelope.status === "signed") throw new AppError("Document already signed", 400);

  const {
    signatureBase64,
    fieldSignatures,   // [{fieldId, data}] — per-field signature images
    fieldValues,       // [{fieldId, type, value}] — text / date / name values
  } = req.body as {
    signatureBase64: string;
    fieldSignatures?: { fieldId: string; data: string }[];
    fieldValues?: { fieldId: string; type: string; value: string }[];
  };

  // Build a map: fieldId → base64 data URL
  const sigMap: Record<string, string> = {};
  if (fieldSignatures && fieldSignatures.length > 0) {
    for (const fs of fieldSignatures) {
      sigMap[fs.fieldId] = fs.data;
    }
  } else if (signatureBase64) {
    // Legacy / single-sig fallback — applied to all signature fields
    sigMap["__default__"] = signatureBase64;
  }

  // Validate at least one signature provided
  const primarySig = signatureBase64 || (fieldSignatures?.[0]?.data);
  if (!primarySig) throw new AppError("Invalid signature format", 400);

  // Determine document and base PDF to sign on
  const document = await DocumentModel.findById(envelope.documentId).exec();
  if (!document) throw new AppError("Document missing", 404);

  // If document is partially signed (first signer already signed), use the
  // intermediate PDF as the base so the second signer's marks are layered on top.
  let basePdfPath: string;
  if (document.status === DocumentStatus.PARTIALLY_SIGNED && document.finalFilePath) {
    const fsCheck = await import("fs");
    if (!fsCheck.default.existsSync(document.finalFilePath)) {
      throw new AppError("Intermediate signed file missing on disk", 404);
    }
    basePdfPath = document.finalFilePath;
  } else {
    basePdfPath = document.originalFilePath;
    // Verify original file hash to detect tampering
    const currentHash = await generateFileHash(document.originalFilePath);
    if (currentHash !== document.originalHash) {
      throw new AppError("Document hash mismatch - possible tampering", 400);
    }
  }

  // Convert base64 data-URL to buffer, returning the MIME subtype alongside
  const parseImage = (dataUrl: string): { buffer: Buffer; subtype: string } => {
    const m = dataUrl.match(/^data:image\/(png|jpe?g|gif|bmp|webp);base64,(.+)$/);
    if (!m) throw new AppError("Invalid signature image format", 400);
    return { buffer: Buffer.from(m[2], "base64"), subtype: m[1] };
  };

  const { buffer: primaryData, subtype: primarySubtype } = parseImage(primarySig);

  // Save primary signature image
  const sigFilename = `${Date.now()}-${envelope._id.toString()}.png`;
  const sigPath = path.resolve(config.UPLOADS_PATH, "signatures", sigFilename);
  await fs.mkdir(path.dirname(sigPath), { recursive: true });
  await fs.writeFile(sigPath, primaryData);

  // Embed signatures into PDF
  const pdfBytes = await fs.readFile(basePdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width: fallbackWidth } = firstPage.getSize();

  const FieldModel = (await import("../models/Field.js")).default;
  const sigFields = await FieldModel.find({ envelopeId: envelope._id, type: "signature" }).lean().exec();

  if (sigFields.length > 0) {
    for (const field of sigFields) {
      // Use per-field image if available, else fall back to primary
      const fieldDataUrl = sigMap[field._id.toString()] || primarySig;
      const { buffer: imgBuffer, subtype } = parseImage(fieldDataUrl);
      const embeddedImage = subtype === "jpeg" || subtype === "jpg"
        ? await pdfDoc.embedJpg(imgBuffer)
        : await pdfDoc.embedPng(imgBuffer);

      const pageIdx = (field.pageNumber || 1) - 1;
      const page = pages[Math.min(pageIdx, pages.length - 1)];
      const { width: pw, height: ph } = page.getSize();
      const pdfX = field.x * pw;
      const pdfY = ph - (field.y * ph) - (field.height * ph);
      const pdfW = field.width * pw;
      const pdfH = field.height * ph;
      page.drawImage(embeddedImage, { x: pdfX, y: pdfY, width: pdfW, height: pdfH });
    }
  } else {
    // Fallback: bottom-right of first page when no fields were placed
    const fallbackImage = primarySubtype === "jpeg" || primarySubtype === "jpg"
      ? await pdfDoc.embedJpg(primaryData)
      : await pdfDoc.embedPng(primaryData);
    const pngDims = fallbackImage.scale(0.5);
    firstPage.drawImage(fallbackImage, {
      x: fallbackWidth - pngDims.width - 50,
      y: 50,
      width: pngDims.width,
      height: pngDims.height
    });
  }

  // Embed text / date / name field values into the PDF
  if (fieldValues && fieldValues.length > 0) {
    const textFieldsMap: Record<string, { type: string; value: string }> = {};
    for (const fv of fieldValues) {
      textFieldsMap[fv.fieldId] = { type: fv.type, value: fv.value };
    }

    const textFields = await FieldModel.find({
      envelopeId: envelope._id,
      type: { $in: ["text", "date", "name"] }
    }).lean().exec();

    for (const field of textFields) {
      const fv = textFieldsMap[field._id.toString()];
      if (!fv) continue;

      const pageIdx = (field.pageNumber || 1) - 1;
      const page = pages[Math.min(pageIdx, pages.length - 1)];
      const { width: pw, height: ph } = page.getSize();
      const pdfX = field.x * pw;
      const pdfY = ph - (field.y * ph) - (field.height * ph);
      const pdfW = field.width * pw;
      const pdfH = field.height * ph;
      const fontSize = Math.max(8, Math.min(14, pdfH * 0.55));
      page.drawText(fv.value, {
        x: pdfX + 4,
        y: pdfY + (pdfH - fontSize) / 2,
        size: fontSize,
        color: rgb(0, 0, 0),
        maxWidth: pdfW - 8,
      });
    }
  }

  const finalPdfBytes = await pdfDoc.save();
  const signedFilename = `${Date.now()}-${envelope._id.toString()}.pdf`;
  const signedPath = path.resolve(config.UPLOADS_PATH, "signed", signedFilename);
  await fs.mkdir(path.dirname(signedPath), { recursive: true });
  await fs.writeFile(signedPath, finalPdfBytes);

  const finalHash = await generateFileHash(signedPath);

  // Record signature
  const sig = await SignatureModel.create({ envelopeId: envelope._id, signatureFilePath: sigPath, signedAt: new Date(), ipAddress: req.ip, userAgent: req.get("user-agent") || "", finalHash });

  // Check if all envelopes for this document are now signed
  const allEnvelopes = await EnvelopeModel.find({ documentId: envelope.documentId }).exec();
  const allNowSigned = allEnvelopes.every(e =>
    e._id.toString() === envelope._id.toString() || e.status === "signed"
  );

  // Update document and envelope
  document.finalFilePath = signedPath;
  document.status = allNowSigned ? DocumentStatus.SIGNED : DocumentStatus.PARTIALLY_SIGNED;
  await document.save();

  envelope.status = "signed";
  await envelope.save();

  await AuditLogModel.create({ envelopeId: envelope._id, action: "signed", timestamp: new Date(), ipAddress: req.ip, metadata: { signatureId: sig._id } });

  res.json({ success: true, signedFile: signedFilename, finalHash });
};
