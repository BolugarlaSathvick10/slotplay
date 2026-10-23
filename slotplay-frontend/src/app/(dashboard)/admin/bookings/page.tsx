/**
 * app/(dashboard)/admin/bookings/page.tsx
 *
 * Platform-wide Admin Bookings & Payment Confirmation page:
 * - Shows all bookings across all venues in the system
 * - Filter by status (All, Pending Action, Confirmed, Rejected, Cancelled)
 * - Search by booking ref, player name/email, venue name
 * - Leverage to confirm or reject payments across any turf
 * - Automatically confirms the slot and generates QR ticket for the user
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminBookings, useVerifyPayment } from '@/hooks/useBooking';
import {
  CalendarCheck, Clock, CheckCircle, XCircle,
  MapPin, Calendar, Check, X, QrCode, Search,
  ExternalLink, ShieldCheck, User as UserIcon,
} from 'lucide-react';

const TABS = [
  { label: 'All Bookings',         value: undefined },
  { label: 'Proof Submitted',      value: 'pending_verification' },
  { label: 'Awaiting Payment',     value: 'pending_payment' },
  { label: 'Confirmed',            value: 'confirmed' },
  { label: 'Rejected',             value: 'rejected' },
  { label: 'Cancelled',            value: 'cancelled' },
];

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  confirmed:            { label: 'Confirmed ✓',        bg: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',   text: 'text-green-700 dark:text-green-300' },
  pending_verification: { label: 'Proof Submitted',   bg: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300' },
  pending_payment:      { label: 'Awaiting Payment',  bg: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300' },
  rejected:             { label: 'Rejected',          bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',         text: 'text-red-700 dark:text-red-300' },
  cancelled:            { label: 'Cancelled',         bg: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',        text: 'text-gray-600 dark:text-gray-400' },
};

export default function AdminBookingsPage() {
  const [tab, setTab] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState<{ bookingId: string } | null>(null);
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useAdminBookings(page, tab);
  const verify = useVerifyPayment();

  const bookings = data?.data ?? [];
  const pagination = data?.pagination;

  const handleApprove = async (bookingId: string) => {
    if (!confirm('Admin confirmation: Confirm this payment and book the slot? QR code will be generated immediately for the user.')) return;
    await verify.mutateAsync({ bookingId, approved: true });
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await verify.mutateAsync({ bookingId: rejectModal.bookingId, approved: false, rejectionReason: reason });
    setRejectModal(null);
    setReason('');
  };

  const filteredBookings = bookings.filter((b: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.bookingRef?.toLowerCase().includes(term) ||
      b.venue?.name?.toLowerCase().includes(term) ||
      b.user?.name?.toLowerCase().includes(term) ||
      b.user?.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider">
              Admin Console
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">All Platform Bookings</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Monitor and confirm payments for all sports slots across every venue in SlotPlay
          </p>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
        <div className="flex overflow-x-auto gap-2 pb-2">
          {TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => { setTab(t.value); setPage(1); }}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                tab === t.value
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search ref, player, venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filteredBookings.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-20 text-center">
          <CalendarCheck size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 font-medium">No bookings match this filter.</p>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((b: any) => {
          const badge = STATUS_BADGE[b.status] ?? STATUS_BADGE.cancelled;
          const pv = b.paymentVerification;
          const isPending = b.status === 'pending_payment' || b.status === 'pending_verification';

          return (
            <div
              key={b.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:border-brand-200 dark:hover:border-gray-700 transition-colors"
            >
              {/* Card Header */}
              <div className="px-5 py-4 bg-gray-50/70 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  <span className="font-mono text-xs text-gray-500 font-semibold">{b.bookingRef}</span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-xl font-black text-gray-900 dark:text-white">₹{b.totalAmount}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {/* Venue Details */}
                <div className="space-y-1.5">
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <MapPin size={15} className="text-brand-600" />
                    {b.venue?.name ?? 'Venue'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.venue?.address}, {b.venue?.city}
                  </p>
                  {b.slot && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 mt-1">
                      <Calendar size={13} className="text-gray-400" />
                      {new Date(b.slot.date || b.slot.startTime).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      · {b.slot.startTime?.slice(0, 5)} - {b.slot.endTime?.slice(0, 5)}
                    </p>
                  )}
                </div>

                {/* Player details */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <UserIcon size={12} /> Player Info
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">{b.user?.name ?? 'Guest User'}</p>
                  <p className="text-xs text-gray-500">{b.user?.email}</p>
                  {b.user?.phone && <p className="text-xs text-gray-500 font-mono">{b.user.phone}</p>}
                </div>

                {/* Payment & Verification status */}
                <div className="space-y-1 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment verification</p>
                  {pv?.utrNumber ? (
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      <span className="text-gray-400">UTR:</span>{' '}
                      <code className="font-mono font-bold text-gray-900 dark:text-white">{pv.utrNumber}</code>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No UTR submitted yet</p>
                  )}
                  {pv?.screenshotUrl && (
                    <a
                      href={pv.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline mt-1"
                    >
                      <ExternalLink size={12} /> View proof screenshot
                    </a>
                  )}
                </div>
              </div>

              {/* Card Footer with Confirmation Actions */}
              <div className="px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {b.status === 'confirmed' && (
                    <Link
                      href={`/bookings/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-bold rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors"
                    >
                      <QrCode size={13} /> View QR Ticket
                    </Link>
                  )}
                  <Link
                    href={`/bookings/${b.id}`}
                    className="text-xs font-semibold text-gray-500 hover:text-brand-600 transition-colors"
                  >
                    View booking page →
                  </Link>
                </div>

                {isPending && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(b.id)}
                      disabled={verify.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                    >
                      <Check size={14} /> Confirm Payment & Book Slot
                    </button>
                    <button
                      onClick={() => setRejectModal({ bookingId: b.id })}
                      disabled={verify.isPending}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold rounded-xl transition-colors"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-500 self-center">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pagination.pages}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <h3 className="font-black text-gray-900 dark:text-white text-xl mb-2">Reject Booking</h3>
            <p className="text-sm text-gray-500 mb-5">
              The player will be notified and the slot will be released back to available.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setReason(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={verify.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:bg-red-400"
              >
                {verify.isPending ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
