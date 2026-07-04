/**
 * app/(auth)/reset-password/page.tsx
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '@/lib/auth';

const schema = z.object({
  otpCode: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/),
  newPassword: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!email) { toast.error('Missing email. Please restart the flow.'); return; }
    setIsLoading(true);
    try {
      await resetPassword({ email, ...data });
      toast.success('Password reset! Please log in with your new password.');
      router.push('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Reset failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <KeyRound className="text-green-600 dark:text-green-400" size={28} />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 text-center">
        Reset password
      </h1>
      {email && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
          For <strong className="text-gray-700 dark:text-gray-300">{email}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* OTP code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Reset code (from email)
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            {...register('otpCode')}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors tracking-widest text-center font-mono
              ${errors.otpCode ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.otpCode && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.otpCode.message}</p>
          )}
        </div>

        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            New password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              {...register('newPassword')}
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors
                ${errors.newPassword ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'}`}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Confirm password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors
              ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors mt-2"
        >
          {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isLoading ? 'Resetting…' : 'Reset password'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/forgot-password" className="text-green-600 dark:text-green-400 hover:underline">
          Request a new code
        </Link>
      </p>
    </div>
  );
}
