import mongoose, { Schema, Model } from "mongoose";

export interface IAuditLog {
  envelopeId: mongoose.Types.ObjectId;
  action: string;
  timestamp: Date;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>({
  envelopeId: { type: Schema.Types.ObjectId, ref: "Envelope", required: true, index: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: () => new Date() },
  ipAddress: { type: String },
  metadata: { type: Schema.Types.Mixed }
});

AuditLogSchema.index({ envelopeId: 1 });

const AuditLogModel: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLogModel;
