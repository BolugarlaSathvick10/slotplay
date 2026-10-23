/**
 * app/(dashboard)/dashboard/bookings/page.tsx
 *
 * Full booking history inside the dashboard shell.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useListBookings, useCancelBooking } from '@/hooks/useBooking';
import { Check, Clock, XCircle, MapPin, Calendar, ChevronRight, Download } from 'lucide-react';

const TABS = [
  { label: 'All',       value: undefined },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending',   value: 'pending_payment' },
  { label: 'Rejected',  value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_UI: Record<string, { label: string; dot: string; text: string }> = {
  pending_payment: { label: 'Awaiting Payment', dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
  confirmed:       { label: 'Confirmed',         dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-400' },
  cancelled:       { label: 'Cancelled',         dot: 'bg-gray-400',   text: 'text-gray-500' },
  rejected:        { label: 'Rejected',          dot: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' },
};

export default function DashboardBookingsPage() {
  const [tab, setTab]   = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const cancel = useCancelBooking();
  const { data, isLoading } = useListBookings(page, tab);
  const bookings   = data?.data   ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Booking History</h1>
        <Link href="/venues" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors">
          + New booking
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.label}
            onClick={() => { setTab(t.value); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              tab === t.value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-20 text-center">
          <Calendar size={36} className="mx-auto text-gray-200 dark:text-gray-800 mb-3" />
          <p className="text-gray-500 mb-4 text-sm">No bookings found.</p>
          <Link href="/venues" className="px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl">Browse turfs</Link>
        </div>
      )}

      {/* Booking table */}
      {!isLoading && bookings.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {bookings.map((b: any, i: number) => {
            const s = STATUS_UI[b.status] ?? STATUS_UI.cancelled;
            const venue = b.venue; const slot = b.slot;
            return (
              <div
                key={b.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  i < bookings.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                }`}
              >
                {/* Status dot */}
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{venue?.name ?? 'Venue'}</p>
                    <span className={`text-xs font-semibold hidden sm:block ${s.text}`}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-mono">{b.bookingRef}</span>
                    {slot && (
                      <span className="flex items-center gap-1">
                        {new Date(slot.date ? slot.date + 'T00:00:00' : slot.startTime).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {slot.startTime && (
                          <span className="font-semibold text-gray-500">
                            {' '}· {slot.startTime.slice(0, 5)}
                            {slot.endTime ? `–${slot.endTime.slice(0, 5)}` : ''}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-gray-900 dark:text-white">₹{b.totalAmount}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {b.status === 'confirmed' && (
                    <Link
                      href={`/bookings/${b.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-semibold hover:bg-brand-100 transition-colors"
                    >
                      <Download size={12} /> Ticket
                    </Link>
                  )}
                  {b.status === 'pending_payment' && (
                    <button
                      onClick={() => confirm('Cancel booking?') && cancel.mutate(b.id)}
                      className="px-2.5 py-1.5 border border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <Link href={`/bookings/${b.id}`} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Prev</button>
          <span className="px-4 py-2 text-sm text-gray-500 self-center">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= pagination.pages} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
