import UserSubscription from '../models/UserSubscription.js';

const FREE_LIMIT = parseInt(process.env.FREE_OPERATION_LIMIT || '5', 10);

/**
 * Checks if the user is allowed to perform a calculation.
 * - Pro users: always allowed.
 * - Free users: allowed up to FREE_OPERATION_LIMIT operations, then 402.
 *
 * Also upserts a UserSubscription record for new users (starts them on free plan).
 */
const requireSubscription = async (req, res, next) => {
  try {
    const { global_user_id } = req.user;

    // Upsert subscription record — new users start on free plan
    let subscription = await UserSubscription.findOne({ global_user_id });
    if (!subscription) {
      subscription = await UserSubscription.create({ global_user_id, plan: 'free', op_count: 0 });
    }

    // Check if subscription has expired
    const now = new Date();
    const expiryDate = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
    const isExpired = expiryDate && expiryDate < now;

    console.log(`[SubscriptionCheck] User: ${req.user.email} | Plan: ${subscription.plan} | Status: ${subscription.status} | Expired: ${isExpired} (End: ${expiryDate})`);

    // Determine if the user should be treated as Pro
    const isPro = subscription.plan === 'pro' && subscription.status === 'active' && !isExpired;
    req.isPro = isPro;

    // Pro users — only pass through if active AND not expired
    if (isPro) {
      req.subscription = subscription;
      return next();
    }

    // Free users (and expired Pro users) — check limit
    if (subscription.op_count >= FREE_LIMIT) {
      const isActuallyExpired = subscription.plan === 'pro' && isExpired;
      console.log(`[SubscriptionCheck] BLOCKED: Limit reached or Expired. Plan: ${subscription.plan}, OpCount: ${subscription.op_count}`);
      
      return res.status(402).json({
        code: isActuallyExpired ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_REQUIRED',
        error: isActuallyExpired 
          ? 'Your Pro subscription has expired. Please renew to continue with unlimited operations.'
          : 'Free tier limit reached. Please upgrade to Pro.',
        op_count: subscription.op_count,
        limit: FREE_LIMIT,
        plan: subscription.plan,
      });
    }

    console.log(`[SubscriptionCheck] ALLOWED: Fallback to Free tier with ${subscription.op_count}/${FREE_LIMIT}`);


    req.subscription = subscription;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export default requireSubscription;
