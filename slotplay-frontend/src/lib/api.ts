/**
 * lib/api.ts
 *
 * Pre-configured Axios instance for all backend requests.
 *
 * Key settings:
 *   baseURL     — reads NEXT_PUBLIC_API_URL from env
 *   credentials — withCredentials:true sends the session cookie on every request
 *   interceptors — transforms error responses into a consistent shape
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  withCredentials: true, // required for session cookies
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000,
});

// ── Response interceptor — normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // 401 = unauthenticated — expected when no session exists, not an error
    // Return a resolved null so callers like getCurrentUser() get null back cleanly
    if (error.response?.status === 401) {
      return Promise.resolve({ data: { success: false, data: null } });
    }

    // Surface the backend error message when available
    if (error.response?.data?.message) {
      const customError = new Error(error.response.data.message) as Error & {
        statusCode: number;
        code?: string;
        errors?: Record<string, string[]>;
      };
      customError.statusCode = error.response.status;
      customError.code = error.response.data.code;
      customError.errors = error.response.data.errors;
      return Promise.reject(customError);
    }

    // Network error (no response received)
    if (!error.response) {
      return Promise.reject(
        new Error('Network error — please check your connection'),
      );
    }

    return Promise.reject(error);
  },
);

export default api;

// ── Typed helper for multipart/form-data uploads ─────────────────────────────
export function buildFormData(
  fields: Record<string, string | Blob | File>,
): FormData {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  return form;
}
