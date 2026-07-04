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
    setLoading(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }, [setUser, setLoading]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (payload: LoginPayload, returnUrl?: string) => {
      const user = await loginUser(payload);
      setUser(user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      router.push(returnUrl ?? '/dashboard');
    },
    [setUser, router],
  );

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(
    async (payload: RegisterPayload) => {
      await registerUser(payload);
      toast.success('Account created! Check your email for a verification code.');
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
