/**
 * app/(main)/bookings/checkout/page.tsx — Phase 7 checkout
 * Booking already created. This handles: pay + submit screenshot.
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBookingDetail, useSubmitPayment } from '@/hooks/useBooking';
import { Upload, Check, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const bookingId    = searchParams.get('bookingId') ?? '';

  const { data: booking, isLoading } = useBookingDetail(bookingId || null);
  const submitPayment = useSubmitPayment();

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [utr, setUtr] = useState('');
  const [done, setDone] = useState(false);

  const venue = (booking?.venue as any);
  const slot  = (booking?.slot  as any);
  const upiId = venue?.owner?.ownerProfile?.upiId;

  const copyUpi = () => {
    if (upiId) { navigator.clipboard.writeText(upiId); toast.success('UPI ID copied!'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshot || utr.length < 10) { toast.error('Screenshot and UTR required'); return; }
    await submitPayment.mutateAsync({ bookingId, utrNumber: utr, screenshot });
    setDone(true);
  };

  if (!bookingId) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
      <p className="text-gray-500">No booking found. Please start over.</p>
    </div>
  );

  if (isLoading) return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4 animate-pulse">
      {[80,120,60,200].map(h => <div key={h} style={{ height: h }} className="bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
    </div>
  );

  if (done) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-6">
        <Check size={36} className="text-brand-600 dark:text-brand-400" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Payment submitted!</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        The venue owner will verify within a few hours. You'll get an email once confirmed.
      </p>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-8 text-left">
        <p className="text-xs text-gray-400 mb-1">Booking reference</p>
        <p className="font-mono font-bold text-gray-900 dark:text-white">{booking?.bookingRef}</p>
      </div>
      <button onClick={() => router.push(`/bookings/${bookingId}`)} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl">
        View booking details
      </button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Complete payment</h1>
      <p className="text-gray-500 text-sm mb-8">Pay via UPI, then upload the screenshot to confirm your slot.</p>

      {/* Summary */}
      {booking && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-2xl p-5 mb-6 space-y-2 text-sm">
          {venue && <p className="font-bold text-gray-900 dark:text-white">{venue.name}</p>}
          {slot && (
            <p className="text-gray-600 dark:text-gray-300">
              {new Date(slot.date || slot.startTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              {' · '}
              {(slot.startTime?.length <= 5 ? slot.startTime : new Date(slot.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))}
              {' – '}
              {(slot.endTime?.length <= 5 ? slot.endTime : new Date(slot.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))}
            </p>
          )}
          <div className="pt-2 border-t border-brand-200 dark:border-brand-800 flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-black text-brand-700 dark:text-brand-300 text-xl">₹{booking.totalAmount}</span>
          </div>
        </div>
      )}

      {/* UPI */}
      {upiId && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pay to</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-2.5 rounded-xl text-sm">{upiId}</code>
            <button onClick={copyUpi} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-brand-600 transition-colors"><Copy size={16} /></button>
            <a href={`upi://pay?pa=${upiId}&am=${booking?.totalAmount}&cu=INR`} className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors"><ExternalLink size={16} /></a>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Screenshot upload */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Payment screenshot</label>
          <label htmlFor="ss" className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${screenshot ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'}`}>
            {screenshot ? (
              <div><Check size={28} className="mx-auto text-brand-600 mb-2" /><p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{screenshot.name}</p></div>
            ) : (
              <div><Upload size={28} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" /><p className="text-sm text-gray-500">Click to upload · PNG or JPG · max 5 MB</p></div>
            )}
            <input id="ss" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && setScreenshot(e.target.files[0])} />
          </label>
        </div>

        {/* UTR */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">UTR / Transaction ID</label>
          <input
            value={utr}
            onChange={e => setUtr(e.target.value.replace(/\s/g, '').toUpperCase())}
            placeholder="From your UPI app transaction history"
            className="w-full font-mono text-center px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={!screenshot || utr.length < 10 || submitPayment.isPending}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-900 text-white font-black text-base rounded-xl transition-colors"
        >
          {submitPayment.isPending ? 'Submitting…' : 'Confirm payment →'}
        </button>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense><CheckoutContent /></Suspense>;
}
