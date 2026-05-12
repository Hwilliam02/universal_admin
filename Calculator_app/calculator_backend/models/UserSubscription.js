import mongoose from 'mongoose';

const userSubscriptionSchema = new mongoose.Schema({
  global_user_id:        { type: String, required: true, unique: true },
  plan:                  { type: String, enum: ['free', 'pro'], default: 'free' },
  status:                { type: String, enum: ['active', 'cancelled', 'past_due', 'trialing'], default: 'active' },
  stripe_customer_id:    { type: String, default: null },
  stripe_subscription_id:{ type: String, default: null },
  current_period_end:    { type: Date,   default: null },
  // Free-tier operation counter — resets to 0 when user upgrades to pro
  op_count:              { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('UserSubscription', userSubscriptionSchema);
