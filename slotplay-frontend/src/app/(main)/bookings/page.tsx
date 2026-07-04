/**
 * app/(main)/bookings/page.tsx — Booking History (Phase 7)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useListBookings, useCancelBooking } from '@/hooks/useBooking';
import { Check, Clock, XCircle, MapPin, Calendar, ChevronRight } from 'lucide-react';

const TABS = [
  { label: 'All',             value: undefined },
  { label: 'Confirmed',       value: 'confirmed' },
  { label: 'Awaiting',        value: 'pending_payment' },
  { label: 'Rejected',        value: 'rejected' },
  { label: 'Cancelled',       value: 'cancelled' },
];

const STATUS = {
  pending_payment: { label: 'Awaiting Payment', dot: 'bg-yellow-500', color: 'text-yellow-600 dark:text-yellow-400' },
  confirmed:       { label: 'Confirmed',         dot: 'bg-green-500',  color: 'text-green-600 dark:text-green-400' },
  cancelled:       { label: 'Cancelled',         dot: 'bg-gray-400',   color: 'text-gray-500' },
  rejected:        { label: 'Rejected',          dot: 'bg-red-500',    color: 'text-red-600 dark:text-red-400' },
} as const;

export default function BookingsPage() {
  const [tab, setTab]   = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const cancel = useCancelBooking();
  const { data, isLoading } = useListBookings(page, tab);
  const bookings   = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-6">My Bookings</h1>

      {/* Status tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-7">
        {TABS.map(t => (
          <button key={t.label} onClick={() => { setTab(t.value); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              tab === t.value ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>}

      {!isLoading && bookings.length === 0 && (
        <div className="py-20 text-center">
          <Calendar size={40} className="mx-auto text-gray-200 dark:text-gray-800 mb-3" />
          <p className="text-gray-500 mb-5">No bookings yet.</p>
          <Link href="/venues" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold">Browse turfs</Link>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map((b: any) => {
          const s = STATUS[b.status as keyof typeof STATUS] ?? STATUS.cancelled;
          const venue = b.venue; const slot = b.slot;
          return (
            <div key={b.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                    <span className={`text-xs font-bold ${s.color}`}>{s.label}</span>
                    <span className="text-xs text-gray-400 font-mono">· {b.bookingRef}</span>
                  </div>
                  {venue && <p className="font-bold text-gray-900 dark:text-white truncate">{venue.name}</p>}
                  {slot && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(slot.date || slot.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {(slot.startTime?.length <= 5 ? slot.startTime : new Date(slot.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-lg font-black text-gray-900 dark:text-white">₹{b.totalAmount}</span>
                  <div className="flex items-center gap-2">
                    {b.status === 'pending_payment' && (
                      <button onClick={() => confirm('Cancel this booking?') && cancel.mutate(b.id)}
                        className="text-xs text-red-500 font-medium hover:underline">
                        Cancel
                      </button>
                    )}
                    <Link href={`/bookings/${b.id}`} className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-0.5">
                      View <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Prev</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= pagination.pages} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
