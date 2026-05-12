import axios from 'axios';

const CALC_URL = import.meta.env.VITE_CALC_BACKEND_URL || 'http://localhost:5000';

export const calcClient = axios.create({
  baseURL: CALC_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token from localStorage ───────────────────────
calcClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('appAccessToken');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 (token expired) → silent refresh ─────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

calcClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 TOKEN_EXPIRED → try to refresh
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return calcClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const productId    = import.meta.env.VITE_CALCULATOR_PRODUCT_ID;

      if (!refreshToken || !productId) {
        processQueue(error, null);
        isRefreshing = false;
        // Clear auth and force re-login
        localStorage.removeItem('appAccessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { default: masterClient } = await import('./masterClient');
        const { data } = await masterClient.post('/universal-auth/refresh-token', {
          refresh_token: refreshToken,
          product_id:    productId,
        });

        const newToken = data.accessToken;
        localStorage.setItem('appAccessToken', newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return calcClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('appAccessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default calcClient;
