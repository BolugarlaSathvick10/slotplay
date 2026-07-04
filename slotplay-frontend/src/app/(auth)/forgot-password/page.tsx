/**
 * app/(auth)/forgot-password/page.tsx
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPassword } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Mail className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          If <strong className="text-gray-700 dark:text-gray-300">{sentEmail}</strong> is registered,
          a password reset code has been sent.
        </p>
        <button
          onClick={() => router.push(`/reset-password?email=${encodeURIComponent(sentEmail)}`)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors mb-3"
        >
          Enter reset code
        </button>
        <Link href="/login" className="text-sm text-green-600 dark:text-green-400 hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to login
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Forgot password?
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Enter your email and we&apos;ll send you a reset code.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors
              ${errors.email ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'}`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
        >
          {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isLoading ? 'Sending…' : 'Send reset code'}
        </button>
      </form>
    </div>
  );
}
