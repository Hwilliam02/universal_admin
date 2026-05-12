import mongoose, { Schema, Model } from "mongoose";
import { EnvelopeStatus } from "../types/index.js";

export interface IEnvelope {
  documentId: mongoose.Types.ObjectId;
  signerEmail: string;
  signingToken: string;
  expiresAt: Date;
  status: EnvelopeStatus;
}

const EnvelopeSchema = new Schema<IEnvelope>({
  documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
  signerEmail: { type: String, required: true, index: true },
  signingToken: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: Object.values(EnvelopeStatus), default: EnvelopeStatus.SENT }
});

EnvelopeSchema.index({ signingToken: 1 });

const EnvelopeModel: Model<IEnvelope> = mongoose.models.Envelope || mongoose.model<IEnvelope>("Envelope", EnvelopeSchema);
export default EnvelopeModel;
