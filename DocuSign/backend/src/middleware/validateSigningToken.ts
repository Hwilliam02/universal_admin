import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/index.js";
import EnvelopeModel from "../models/Envelope.js";

export const validateSigningToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = (req.params.token as string) || req.query.token;
    if (!token) { next(new AppError("Missing token", 400)); return; }

    const envelope = await EnvelopeModel.findOne({ signingToken: token }).exec();
    if (!envelope) { next(new AppError("Invalid or expired token", 400)); return; }

    if (envelope.expiresAt && envelope.expiresAt < new Date()) {
      next(new AppError("Token expired", 400)); return;
    }

    // Note: we allow GET on already-signed envelopes (view-only).
    // Only POST submission checks for double-signing (handled in submitSignature).

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).envelope = envelope;
    next();
  } catch (err) {
    next(err);
  }
};
