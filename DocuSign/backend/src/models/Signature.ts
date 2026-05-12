import mongoose, { Schema, Model } from "mongoose";

export interface ISignature {
  envelopeId: mongoose.Types.ObjectId;
  signatureFilePath: string;
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
  finalHash: string;
}

const SignatureSchema = new Schema<ISignature>({
  envelopeId: { type: Schema.Types.ObjectId, ref: "Envelope", required: true, index: true },
  signatureFilePath: { type: String, required: true },
  signedAt: { type: Date, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  finalHash: { type: String, required: true }
});

SignatureSchema.index({ envelopeId: 1 });

const SignatureModel: Model<ISignature> = mongoose.models.Signature || mongoose.model<ISignature>("Signature", SignatureSchema);
export default SignatureModel;
