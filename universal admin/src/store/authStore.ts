import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, RegisterData } from '@/types';
import { login as loginApi, verifySuperAdmin as verifyApi, logout as logoutApi } from '@/api/authApi';
import { createSuperAdmin } from '@/api/userApi';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email: string, password: string, rememberMe: boolean = false) => {
        try {
          const response = await loginApi({ email, password, rememberMe });
          
          if ((response.status === 'success' || response.status === true) && response.data?.user) {
            // Backend sets httpOnly cookie automatically, no need to store token
            set({ 
              user: response.data.user, 
              isAuthenticated: true,
              token: response.token || null
            });
            return true;
          }
          
          throw new Error(response.message || 'Login failed');
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          const response = await createSuperAdmin(data);
          // Log full response for debugging when integrating
          console.log('Register response:', response);

          // Treat any explicit 'success' status or true as success
          if (response?.status === 'success' || response?.status === true) {
            return true;
          }

          throw new Error(response?.message || 'Registration failed');
        } catch (error) {
          console.error('Registration error:', error);
          throw error;
        }
      },

      verifySuperAdmin: async (email: string, code: string) => {
        try {
          const response = await verifyApi({ email, code });
          
          if ((response.status === 'success' || response.status === true) && response.data?.user) {
            // Set user as authenticated after successful verification
            set({ 
              user: response.data.user, 
              isAuthenticated: true,
              token: response.token || null
            });
            return true;
          }
          
          throw new Error(response.message || 'Verification failed');
        } catch (error) {
          console.error('Verification error:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call backend to clear httpOnly cookie
          await logoutApi();
          // Clear local state
          set({ user: null, isAuthenticated: false, token: null });
          return true;
        } catch (error) {
          console.error('Logout error:', error);
          // Even if API fails, clear local state
          set({ user: null, isAuthenticated: false, token: null });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
