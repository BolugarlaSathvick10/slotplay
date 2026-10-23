/**
 * app/(auth)/verify-otp/page.tsx
 *
 * Email OTP verification page.
 * Reads `email` from query params for display purposes only.
 * Actual verification uses the active session userId on the backend.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { verifyOtp, resendOtp } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(emailParam);
  const { setUser } = useAuthStore();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
      try {
        sessionStorage.setItem('slotplay_verify_email', emailParam);
      } catch {}
    } else {
      try {
        const stored = sessionStorage.getItem('slotplay_verify_email');
        if (stored) setEmail(stored);
      } catch {}
    }
  }, [emailParam]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const otp = digits.join('');

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits are filled
    if (newDigits.every(Boolean) && newDigits.join('').length === 6) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return;
    if (!email || !email.trim()) {
      toast.error('Please enter your registered email address.');
      return;
    }
    setIsVerifying(true);
    try {
      const user = await verifyOtp(code, email.trim());
      setUser(user);
      toast.success('Email verified! Welcome to SlotPlay.');
      try {
        sessionStorage.removeItem('slotplay_verify_email');
      } catch {}
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      toast.error(message);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setIsResending(true);
    try {
      await resendOtp(email);
      toast.success('New verification code sent!');
      setCountdown(60);
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <ShieldCheck className="text-green-600 dark:text-green-400" size={32} />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Verify your email
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        We sent a 6-digit code to
      </p>
      {email ? (
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-8">
          {email}
        </p>
      ) : (
        <div className="mb-6 max-w-xs mx-auto">
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      {/* OTP Input Grid */}
      <div className="flex justify-center gap-2 mb-8" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 dark:focus:border-green-400 transition-colors
              border-gray-300 dark:border-gray-700"
            aria-label={`Digit ${i + 1}`}
            disabled={isVerifying}
          />
        ))}
      </div>

      {/* Verify button */}
      <button
        onClick={() => handleVerify(otp)}
        disabled={otp.length !== 6 || isVerifying}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-900 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors mb-4"
      >
        {isVerifying ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : null}
        {isVerifying ? 'Verifying…' : 'Verify email'}
      </button>

      {/* Resend */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Didn&apos;t receive it?{' '}
        {countdown > 0 ? (
          <span className="text-gray-400">Resend in {countdown}s</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-green-600 dark:text-green-400 font-medium hover:underline disabled:opacity-50"
          >
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </p>
    </div>
  );
}
