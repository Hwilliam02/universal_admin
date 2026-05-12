import { Request, Response } from "express";
import FieldModel from "../models/Field.js";
import EnvelopeModel from "../models/Envelope.js";
import DocumentModel from "../models/Document.js";
import mongoose from "mongoose";
import { FieldDTO, AppError, DocumentStatus } from "../types/index.js";

/** Check whether the envelope's document has already been signed */
const guardSigned = async (envelopeId: string): Promise<void> => {
  const envelope = await EnvelopeModel.findById(envelopeId).lean().exec();
  if (!envelope) throw new AppError("Envelope not found", 404);
  if (envelope.status === "signed") throw new AppError("Cannot modify fields \u2014 envelope has already been signed", 403);
  const doc = await DocumentModel.findById(envelope.documentId).lean().exec();
  if (doc && doc.status === DocumentStatus.SIGNED) throw new AppError("Cannot modify fields \u2014 document has already been signed", 403);
  if (doc && doc.status === DocumentStatus.PARTIALLY_SIGNED) throw new AppError("Cannot modify fields \u2014 document is already partially signed", 403);
};

export const createField = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as FieldDTO;
  if (body.x < 0 || body.x > 1 || body.y < 0 || body.y > 1 || body.width <= 0 || body.width > 1 || body.height <= 0 || body.height > 1) throw new AppError("Invalid normalized coordinates", 400);

  // Block field creation on signed documents
  await guardSigned(body.envelopeId);

  const field = await FieldModel.create({
    envelopeId: body.envelopeId,
    pageNumber: body.pageNumber,
    x: body.x,
    y: body.y,
    width: body.width,
    height: body.height,
    type: body.type,
    label: (body as any).label || ""
  });

  res.status(201).json(field);
};

export const deleteField = async (req: Request, res: Response): Promise<void> => {
  const { fieldId } = req.params;
  const field = await FieldModel.findById(fieldId).lean().exec();
  if (!field) throw new AppError("Field not found", 404);

  // Block field deletion on signed documents
  await guardSigned(field.envelopeId.toString());

  await FieldModel.findByIdAndDelete(fieldId).lean().exec();
  res.json({ success: true });
};

export const getFieldsForEnvelope = async (req: Request, res: Response): Promise<void> => {
  let { envelopeId } = req.params;

  try {
    let envelopeObjectId: mongoose.Types.ObjectId | null = null;

    if (mongoose.Types.ObjectId.isValid(envelopeId)) {
      envelopeObjectId = new mongoose.Types.ObjectId(envelopeId);
    } else {
      const env = await EnvelopeModel.findOne({ signingToken: envelopeId }).lean().exec();
      if (env) envelopeObjectId = env._id as mongoose.Types.ObjectId;
    }

    if (!envelopeObjectId) {
      res.json([]);
      return;
    }

    const fields = await FieldModel.find({ envelopeId: envelopeObjectId }).lean().exec();
    res.json(fields);
  } catch (err) {
    console.error(err);
    throw err;
  }
};
