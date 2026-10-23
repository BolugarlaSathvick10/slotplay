/**
 * hooks/useAuth.ts
 *
 * Primary auth hook. Used throughout the app to:
 *   - Read current user and auth state
 *   - Call login / logout / register actions
 *   - Hydrate auth state from the session cookie on page load
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  LoginPayload,
  RegisterPayload,
} from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, setUser, setLoading, clearAuth } =
    useAuthStore();

  // ── Hydrate from session cookie on mount ───────────────────────────────────
  // Called once per app load — checks /api/auth/me to restore session state
  const hydrate = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      // Session check failed — treat as unauthenticated, never surface to overlay
      setUser(null);
    }
  }, [setUser, setLoading]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (payload: LoginPayload, returnUrl?: string) => {
      const user = await loginUser(payload);
      if (!user) {
        throw new Error('Login failed: invalid response from server');
      }
      setUser(user);
      const displayName = user.name ? user.name.split(' ')[0] : 'there';
      toast.success(`Welcome back, ${displayName}!`);
      router.push(returnUrl ?? '/dashboard');
    },
    [setUser, router],
  );

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(
    async (payload: RegisterPayload) => {
      await registerUser(payload);
      toast.success('Account created! Check your email for a verification code.');
      try {
        sessionStorage.setItem('slotplay_verify_email', payload.email);
      } catch {}
      // After register, navigate to OTP page
      router.push(`/verify-otp?email=${encodeURIComponent(payload.email)}`);
    },
    [router],
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutUser();
    clearAuth();
    toast.success('You have been logged out');
    router.push('/');
  }, [clearAuth, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
    hydrate,
    login,
    register,
    logout,
  };
}
