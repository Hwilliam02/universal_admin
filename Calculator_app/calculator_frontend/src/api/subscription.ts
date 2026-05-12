import calcClient from './calcClient';

export interface SubscriptionStatus {
  plan:       'free' | 'pro';
  status:     'active' | 'cancelled' | 'past_due' | 'trialing';
  op_count:   number;
  limit:      number;
  period_end: string | null;
}

/** GET /api/subscribe/status */
export const getStatus = async (): Promise<SubscriptionStatus> => {
  const { data } = await calcClient.get('/api/subscribe/status');
  return data;
};

/** POST /api/subscribe/create-checkout-session → redirects to Stripe URL */
export const createCheckoutSession = async (): Promise<void> => {
  const { data } = await calcClient.post('/api/subscribe/create-checkout-session');
  if (data.url) {
    window.location.href = data.url;
  }
};
