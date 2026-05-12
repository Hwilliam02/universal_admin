import mongoose, { Schema, Model } from "mongoose";

export interface IField {
  envelopeId: mongoose.Types.ObjectId;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "signature" | "text" | "date";
}

const FieldSchema = new Schema<IField>({
  envelopeId: { type: Schema.Types.ObjectId, ref: "Envelope", required: true, index: true },
  pageNumber: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  type: { type: String, enum: ["signature", "text", "date", "name"], required: true }
});

FieldSchema.index({ envelopeId: 1 });

const FieldModel: Model<IField> = mongoose.models.Field || mongoose.model<IField>("Field", FieldSchema);
export default FieldModel;
