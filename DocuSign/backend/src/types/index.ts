import { Request } from "express";
import { Document as MongooseDocument } from "mongoose";

export enum UserRole {
  ADMIN = "admin",
  SIGNER = "signer"
}

export enum DocumentStatus {
  DRAFT = "draft",
  SENT = "sent",
  PARTIALLY_SIGNED = "partially_signed",
  SIGNED = "signed"
}

export enum EnvelopeStatus {
  SENT = "sent",
  VIEWED = "viewed",
  SIGNED = "signed"
}

export interface VisaClaim {
  product: string;
  role: string;
  status: string;
}

export interface IRequestWithUser extends Request {
  user?: {
    global_user_id: string;
    role: UserRole;
    email?: string;
    username?: string;
    visas?: VisaClaim[];
  };
}

// DTOs
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UploadDocumentDTO {
  originalFilePath: string;
  originalHash: string;
  createdBy: string;
}

export interface FieldDTO {
  envelopeId: string;
  pageNumber: number;
  // Normalized coordinates relative to page size (values 0..1)
  x: number; // fraction from left (0..1)
  y: number; // fraction from top (0..1)
  width: number; // fraction of page width (0..1)
  height: number; // fraction of page height (0..1)
  type: "signature" | "text" | "date" | "name";
}

export interface CreateEnvelopeDTO {
  documentId: string;
  signerEmail: string;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
