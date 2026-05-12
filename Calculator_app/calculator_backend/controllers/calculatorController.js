import UserSubscription from '../models/UserSubscription.js';
import CalculationHistory from '../models/CalculationHistory.js';

/**
 * POST /api/calculator/compute
 * Body: { equation: "1 + 1" }
 * - Verifies subscription (done by middleware before this)
 * - Evaluates the equation safely
 * - Saves to history (keep only last 2)
 * - Increments op_count for free users
 */
export const compute = async (req, res) => {
  try {
    const { equation } = req.body;
    const { global_user_id } = req.user;
    const subscription = req.subscription;

    if (!equation || typeof equation !== 'string') {
      return res.status(400).json({ error: 'equation is required' });
    }

    // Safe evaluation — only allow numbers and math operators
    const sanitized = equation.replace(/[^0-9+\-*/.() ]/g, '');
    if (!sanitized.trim()) {
      return res.status(400).json({ error: 'Invalid equation' });
    }

    let result;
    try {
      // eslint-disable-next-line no-new-func
      result = Function(`"use strict"; return (${sanitized})`)();
      if (!isFinite(result)) throw new Error('Result is not finite');
    } catch {
      return res.status(400).json({ error: 'Could not evaluate equation' });
    }

    const resultStr = String(result);

    // Save to history (keep only last 2 records per user)
    await CalculationHistory.create({ global_user_id, equation: sanitized, result: resultStr });
    const count = await CalculationHistory.countDocuments({ global_user_id });
    if (count > 2) {
      // Find and delete oldest entries beyond 2
      const oldest = await CalculationHistory
        .find({ global_user_id })
        .sort({ createdAt: 1 })
        .limit(count - 2)
        .select('_id');
      await CalculationHistory.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
    }

    // Increment op_count for anyone not considered 'Pro' (Free users or Expired Pro users)
    let newOpCount = subscription.op_count;
    if (!req.isPro) {
      subscription.op_count += 1;
      await subscription.save();
      newOpCount = subscription.op_count;
    }

    return res.json({
      equation: sanitized,
      result: resultStr,
      plan: subscription.plan,
      op_count: newOpCount,
      limit: parseInt(process.env.FREE_OPERATION_LIMIT || '5', 10),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/calculator/history
 * Returns last 2 calculations for the authenticated user.
 */
export const getHistory = async (req, res) => {
  try {
    const { global_user_id } = req.user;
    const history = await CalculationHistory
      .find({ global_user_id })
      .sort({ createdAt: -1 })
      .limit(2)
      .select('equation result createdAt -_id');

    return res.json({ history });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/calculator/subscription-status
 * Returns the user's subscription details (plan, op_count, limit).
 * Lightweight endpoint — called on app load to hydrate frontend state.
 */
export const getSubscriptionInfo = async (req, res) => {
  try {
    const { global_user_id } = req.user;
    let subscription = await UserSubscription.findOne({ global_user_id });
    if (!subscription) {
      subscription = await UserSubscription.create({ global_user_id, plan: 'free', op_count: 0 });
    }
    const isExpired = subscription.current_period_end && new Date(subscription.current_period_end) < new Date();
    const isPro = subscription.plan === 'pro' && subscription.status === 'active' && !isExpired;

    return res.json({
      plan:       subscription.plan,
      status:     subscription.status,
      isPro,
      isExpired,
      op_count:   subscription.op_count,
      limit:      parseInt(process.env.FREE_OPERATION_LIMIT || '5', 10),
      period_end: subscription.current_period_end,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
