import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  global_user_id: string;
  email: string;
  username: string;
}

interface AuthState {
  appAccessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (appToken: string, refreshToken: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      appAccessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (appAccessToken, refreshToken, user) =>
        set({ appAccessToken, refreshToken, user, isAuthenticated: true }),
      clearAuth: () =>
        set({ appAccessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'calc-auth-storage',
    }
  )
);
