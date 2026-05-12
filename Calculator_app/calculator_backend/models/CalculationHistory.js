import mongoose from 'mongoose';

const calculationHistorySchema = new mongoose.Schema({
  global_user_id: { type: String, required: true, index: true },
  equation:       { type: String, required: true },
  result:         { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('CalculationHistory', calculationHistorySchema);
