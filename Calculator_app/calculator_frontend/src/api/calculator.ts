import calcClient from './calcClient';

export interface ComputeResult {
  equation: string;
  result:   string;
  plan:     'free' | 'pro';
  op_count: number;
  limit:    number;
}

export interface HistoryItem {
  equation:  string;
  result:    string;
  createdAt: string;
}

/** POST /api/calculator/compute */
export const compute = async (equation: string): Promise<ComputeResult> => {
  const { data } = await calcClient.post('/api/calculator/compute', { equation });
  return data;
};

/** GET /api/calculator/history — returns last 2 calculations */
export const getHistory = async (): Promise<HistoryItem[]> => {
  const { data } = await calcClient.get('/api/calculator/history');
  return data.history;
};

/** GET /api/calculator/subscription-info */
export const getSubscriptionInfo = async () => {
  const { data } = await calcClient.get('/api/calculator/subscription-info');
  return data;
};
