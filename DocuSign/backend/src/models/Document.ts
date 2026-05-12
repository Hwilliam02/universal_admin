import mongoose, { Schema, Model } from "mongoose";
import { DocumentStatus } from "../types/index.js";

export interface IDocument {
  originalFilePath: string;
  originalFilename: string;
  originalHash: string;
  title?: string;
  finalFilePath?: string;
  status: DocumentStatus;
  signMode?: "self" | "other" | "both";
  createdBy: string;
  createdAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  originalFilePath: { type: String, required: true },
  originalFilename: { type: String, required: true },
  originalHash: { type: String, required: true },
  title: { type: String },
  finalFilePath: { type: String },
  status: { type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.DRAFT },
  signMode: { type: String, enum: ["self", "other", "both"], default: "self" },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() }
});

DocumentSchema.index({ createdBy: 1 });

const DocumentModel: Model<IDocument> = mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
export default DocumentModel;
