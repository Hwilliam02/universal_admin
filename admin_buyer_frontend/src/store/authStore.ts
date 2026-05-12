import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '@/api/client';
import type { AuthState, ApiResponse } from '@/types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email: string, password: string, product_id?: string) => {
        try {
          const response = await client.post<ApiResponse>('/auth/login', { email, password, product_id });
          const data = response.data;

          if (data.status === 'verification_required') {
            return { status: 'verification_required', email: data.user?.email || email };
          }

          const tokenToUse = data.appAccessToken || data.accessToken;
          const refreshToken = data.refreshToken;
          if (tokenToUse) {
            set({
              user: data.user || null,
              isAuthenticated: true,
              token: tokenToUse,
            });
            localStorage.setItem('token', tokenToUse);
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
            }
            return { status: 'success' };
          }

          throw new Error('Login failed');
        } catch (error: any) {
          console.error('Login error:', error);
          throw error.response?.data?.error || error.message || 'Login failed';
        }
      },

      verify: async (email: string, verification_code: string, new_password: string) => {
        try {
          const response = await client.post<ApiResponse>('/auth/verify', { 
            email, 
            verification_code, 
            new_password 
          });
          const data = response.data;

          const tokenToUse = data.appAccessToken || data.accessToken;
          const refreshToken = data.refreshToken;
          if (tokenToUse) {
            set({
              user: data.user || null,
              isAuthenticated: true,
              token: tokenToUse,
            });
            localStorage.setItem('token', tokenToUse);
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
            }
            return true;
          }
          return false;
        } catch (error: any) {
          console.error('Verification error:', error);
          throw error.response?.data?.error || error.message || 'Verification failed';
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, token: null });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
