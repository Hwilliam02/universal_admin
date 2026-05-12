import { create } from 'zustand';

interface SubscriptionState {
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  opCount: number;
  limit: number;
  periodEnd: string | null;
  setSubscription: (data: Partial<SubscriptionState>) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: 'free',
  status: 'active',
  opCount: 0,
  limit: 5,
  periodEnd: null,
  setSubscription: (data) => set((state) => ({ ...state, ...data })),
}));
