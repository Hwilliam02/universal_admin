import calcClient from './calcClient';

export interface CheckoutSessionResponse {
  url: string;
}

/**
 * POST /api/subscribe/create-checkout-session
 * Returns the Stripe Checkout URL for the Pro plan.
 */
export const createCheckoutSession = async (): Promise<CheckoutSessionResponse> => {
  const { data } = await calcClient.post('/api/subscribe/create-checkout-session');
  return data;
};

/**
 * GET /api/subscribe/status
 * Fetches the current user's subscription details.
 */
export const getSubscriptionStatus = async () => {
  const { data } = await calcClient.get('/api/subscribe/status');
  return data;
};
