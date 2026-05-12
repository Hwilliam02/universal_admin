import Stripe from 'stripe';
import UserSubscription from '../models/UserSubscription.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * GET /api/subscribe/status
 * Returns the current user's subscription status.
 */
export const getStatus = async (req, res) => {
  try {
    const { global_user_id } = req.user;
    let sub = await UserSubscription.findOne({ global_user_id });
    if (!sub) {
      sub = await UserSubscription.create({ global_user_id, plan: 'free', op_count: 0 });
    }
    return res.json({
      plan:       sub.plan,
      status:     sub.status,
      op_count:   sub.op_count,
      limit:      parseInt(process.env.FREE_OPERATION_LIMIT || '5', 10),
      period_end: sub.current_period_end,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/subscribe/create-checkout-session
 * Creates a Stripe Checkout Session for the Pro plan.
 * Returns { url } — frontend redirects the user there.
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { global_user_id, email } = req.user;
    const PRICE_ID    = process.env.STRIPE_PRICE_ID;
    
    // Get frontend URL from config
    const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);
    const FRONTEND_URL = allowedOrigins[0];

    if (!PRICE_ID || PRICE_ID === 'price_REPLACE_ME') {

      return res.status(500).json({ error: 'Stripe PRICE_ID is not configured' });
    }

    // Get or create Stripe customer
    let sub = await UserSubscription.findOne({ global_user_id });
    if (!sub) {
      sub = await UserSubscription.create({ global_user_id, plan: 'free', op_count: 0 });
    }

    let customerId = sub.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { global_user_id },
      });
      customerId = customer.id;
      sub.stripe_customer_id = customerId;
      await sub.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer:    customerId,
      mode:        'subscription',
      line_items:  [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${FRONTEND_URL}?session_id={CHECKOUT_SESSION_ID}&subscribed=true`,
      cancel_url:  `${FRONTEND_URL}?cancelled=true`,
      metadata:    { global_user_id },
    });

    return res.json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/webhooks/stripe  (raw body — verified with Stripe signature)
 * Handles:
 *   - checkout.session.completed     → activate pro subscription
 *   - customer.subscription.deleted  → downgrade to free
 *   - invoice.payment_failed         → mark as past_due
 */
export const handleWebhook = async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('⚠️  Stripe webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session      = event.data.object;
        const global_user_id = session.metadata?.global_user_id;
        if (!global_user_id) break;

        // Retrieve the subscription for period_end
        const stripeSub = await stripe.subscriptions.retrieve(session.subscription);

        await UserSubscription.findOneAndUpdate(
          { global_user_id },
          {
            plan:                   'pro',
            status:                 'active',
            stripe_subscription_id: session.subscription,
            current_period_end:     new Date(stripeSub.current_period_end * 1000),
            op_count:               0, // reset free-tier counter on upgrade
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Subscription activated for user: ${global_user_id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub    = event.data.object;
        await UserSubscription.findOneAndUpdate(
          { stripe_subscription_id: stripeSub.id },
          { plan: 'free', status: 'cancelled', stripe_subscription_id: null, current_period_end: null }
        );
        console.log(`🔻 Subscription cancelled: ${stripeSub.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await UserSubscription.findOneAndUpdate(
          { stripe_subscription_id: invoice.subscription },
          { status: 'past_due' }
        );
        console.log(`⚠️  Payment failed for subscription: ${invoice.subscription}`);
        break;
      }

      default:
        // Unhandled event — that's fine
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }

  return res.json({ received: true });
};
