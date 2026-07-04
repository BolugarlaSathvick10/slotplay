/**
 * store/authStore.ts
 *
 * Global authentication state managed by Zustand.
 *
 * The session is server-authoritative — this store caches the current user
 * for fast UI rendering. On page load, the app calls /api/auth/me to hydrate
 * the store from the active session cookie.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User, AuthState } from '@/types';

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

const initialState: AuthState = {
  user: null,
  isLoading: true, // start true — hydration pending
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set(
          { user, isAuthenticated: !!user, isLoading: false },
          false,
          'auth/setUser',
        ),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'auth/setLoading'),

      clearAuth: () =>
        set(
          { user: null, isAuthenticated: false, isLoading: false },
          false,
          'auth/clear',
        ),
    }),
    { name: 'SlotPlay/Auth' },
  ),
);
