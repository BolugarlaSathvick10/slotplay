/**
 * app/(main)/owner/verifications/page.tsx
 * Owner payment verification queue.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePendingVerifications, useVerifyPayment } from '@/hooks/useBooking';
import { Check, X, Clock, MapPin, Calendar, ExternalLink } from 'lucide-react';

export default function VerificationsPage() {
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ bookingId: string } | null>(null);
  const [reason, setReason] = useState('');
  const { data, isLoading } = usePendingVerifications(page);
  const verify = useVerifyPayment();
  const items = data?.data ?? [];

  const approve = async (bookingId: string) => {
    if (!confirm('Approve this payment?')) return;
    await verify.mutateAsync({ bookingId, approved: true });
  };
  const reject = async () => {
    if (!modal) return;
    await verify.mutateAsync({ bookingId: modal.bookingId, approved: false, rejectionReason: reason });
    setModal(null); setReason('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Payment Queue</h1>
          <p className="text-gray-500 mt-1 text-sm">{data?.pagination?.total ?? 0} pending verifications</p>
        </div>
        {data?.pagination?.total ? (
          <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2 rounded-xl">
            <Clock size={14} className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{data.pagination.total} pending</span>
          </div>
        ) : null}
      </div>

      {isLoading && <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>}

      {!isLoading && items.length === 0 && (
        <div className="py-20 text-center">
          <Check size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-500">All caught up — no pending payments!</p>
        </div>
      )}

      <div className="space-y-5">
        {items.map((b: any) => {
          const pv = b.paymentVerification; const slot = b.slot; const venue = b.venue; const user = b.user;
          return (
            <div key={b.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between">
                <div>
                  <p className="font-mono text-xs text-gray-400">{b.bookingRef}</p>
                  <p className="font-bold text-gray-900 dark:text-white">{user?.name} <span className="font-normal text-gray-400 text-sm">({user?.email})</span></p>
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">₹{b.totalAmount}</span>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-3 text-sm">
                  {venue && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><MapPin size={14} className="text-gray-400" />{venue.name}</div>}
                  {slot && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Calendar size={14} className="text-gray-400" />
                    {new Date(slot.date || slot.startTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {(slot.startTime?.length <= 5 ? slot.startTime : new Date(slot.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))}
                  </div>}
                  {pv && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs text-gray-400 mb-0.5">UTR</p>
                      <code className="font-mono font-bold text-gray-900 dark:text-white">{pv.utrNumber}</code>
                    </div>
                  )}
                </div>

                {pv?.screenshotUrl ? (
                  <div className="relative h-44 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <Image src={pv.screenshotUrl} alt="Payment screenshot" fill className="object-contain" />
                    <a href={pv.screenshotUrl} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black">
                      <ExternalLink size={13} />
                    </a>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 text-sm">No screenshot</div>
                )}
              </div>

              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button onClick={() => approve(b.id)} disabled={verify.isPending} className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold py-2.5 rounded-xl transition-colors">
                  <Check size={16} /> Approve
                </button>
                <button onClick={() => setModal({ bookingId: b.id })} disabled={verify.isPending} className="flex-1 flex items-center justify-center gap-2 border-2 border-red-400 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-7 max-w-md w-full">
            <h3 className="font-black text-gray-900 dark:text-white text-xl mb-2">Reject payment</h3>
            <p className="text-sm text-gray-500 mb-5">The customer will be notified. Add a reason (optional).</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g. UTR not matching, screenshot unclear…"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => { setModal(null); setReason(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold">Cancel</button>
              <button onClick={reject} disabled={verify.isPending} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:bg-red-400">
                {verify.isPending ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
