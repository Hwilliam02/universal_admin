import { Request, Response } from "express";
import path from "path";
import { generateFileHash } from "../utils/hash.js";
import DocumentModel from "../models/Document.js";
import { UploadDocumentDTO, AppError, IRequestWithUser } from "../types/index.js";
import { getConfig } from "../config/index.js";

const config = getConfig();

export const uploadDocument = async (req: IRequestWithUser, res: Response): Promise<void> => {
  if (!req.file) throw new AppError("Missing file", 400);
  if (!req.user?.global_user_id) throw new AppError("Unauthorized", 401);
  const filePath = path.resolve(req.file.path);
  const hash = await generateFileHash(filePath);
  const title = (req.body.title as string | undefined) || req.file.originalname;

  const doc = await DocumentModel.create({
    originalFilePath: filePath,
    originalFilename: req.file.filename,
    originalHash: hash,
    title,
    status: "draft",
    createdAt: new Date(),
    createdBy: req.user.global_user_id
  });
  res.status(201).json({ id: doc._id });
};

export const listDocuments = async (req: IRequestWithUser, res: Response): Promise<void> => {
  if (!req.user?.global_user_id) throw new AppError("Unauthorized", 401);
  const docs = await DocumentModel.find({ createdBy: req.user.global_user_id }).lean().exec();
  res.json(docs.map(d => ({
    _id: d._id,
    title: d.title || d.originalFilename,
    originalFilename: d.originalFilename,
    status: d.status,
    createdAt: d.createdAt
  })));
};

export const getDocument = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const doc = await DocumentModel.findById(id).lean().exec();
  if (!doc) throw new AppError("Document not found", 404);
  res.json({
    id: doc._id,
    title: doc.title || doc.originalFilename,
    originalFilename: doc.originalFilename,
    originalHash: doc.originalHash,
    status: doc.status,
    createdAt: doc.createdAt
  });
};
