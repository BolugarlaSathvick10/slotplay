/**
 * lib/auth.ts
 *
 * All frontend authentication API calls.
 * Components and hooks import from here — never call axios directly.
 */

import api from './api';
import { ApiSuccess, User } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function registerUser(payload: RegisterPayload) {
  const { data } = await api.post<ApiSuccess>('/api/auth/register', payload);
  return data;
}

export async function loginUser(payload: LoginPayload) {
  const { data } = await api.post<ApiSuccess<User>>('/api/auth/login', payload);
  return data.data;
}

export async function logoutUser() {
  await api.post('/api/auth/logout');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get<ApiSuccess<User>>('/api/auth/me');
    return data.data;
  } catch {
    return null;
  }
}

export async function verifyOtp(otpCode: string) {
  const { data } = await api.post<ApiSuccess<User>>('/api/auth/verify-otp', { otpCode });
  return data.data;
}

export async function resendOtp(email: string) {
  const { data } = await api.post<ApiSuccess>('/api/auth/resend-otp', { email });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<ApiSuccess>('/api/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await api.post<ApiSuccess>('/api/auth/reset-password', payload);
  return data;
}

export async function updateProfile(payload: { name?: string; phone?: string }) {
  const { data } = await api.put<ApiSuccess<User>>('/api/auth/me', payload);
  return data.data;
}
