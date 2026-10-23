/**
 * app/(dashboard)/admin/verifications/page.tsx
 *
 * Platform-wide Admin Payment Verification Queue:
 * - Real-time polling queue of all pending verifications and unverified payments
 * - Admin leverage to verify payment directly, book the slot, and issue QR ticket
 * - Rejection option with custom reason
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAdminPendingVerifications, useVerifyPayment } from '@/hooks/useBooking';
import {
  Check, X, Clock, MapPin, Calendar, ExternalLink,
  ShieldCheck, Search, AlertCircle, User as UserIcon,
} from 'lucide-react';

export default function AdminVerificationsPage() {
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ bookingId: string } | null>(null);
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useAdminPendingVerifications(page);
  const verify = useVerifyPayment();
  const items = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const approve = async (bookingId: string) => {
    if (!confirm('Admin Confirmation: Confirm payment and book this slot? The QR ticket will be generated immediately for the player.')) return;
    await verify.mutateAsync({ bookingId, approved: true });
  };

  const reject = async () => {
    if (!modal) return;
    await verify.mutateAsync({ bookingId: modal.bookingId, approved: false, rejectionReason: reason });
    setModal(null);
    setReason('');
  };

  const filteredItems = items.filter((b: any) => {
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={12} /> Admin Console · Live
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Real-time
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Platform Payment Queue</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Review and confirm pending payments across all turfs — instantly books the slot and issues the QR pass
          </p>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3.5 py-2 rounded-xl self-start sm:self-auto">
            <Clock size={16} className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
              {total} awaiting confirmation
            </span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by booking ref, player name/email, or turf venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white"
        />
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="py-20 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-3">
            <Check size={24} />
          </div>
          <p className="font-bold text-gray-900 dark:text-white text-base">All caught up!</p>
          <p className="text-gray-500 text-sm mt-1">No pending payments requiring admin verification at this time.</p>
        </div>
      )}

      {/* Queue Items */}
      <div className="space-y-5">
        {filteredItems.map((b: any) => {
          const pv = b.paymentVerification || b.verification;
          const slot = b.slot;
          const venue = b.venue;
          const user = b.user;

          const isProofSubmitted = b.status === 'pending_verification' || !!pv?.screenshotUrl || !!pv?.utrNumber;

          return (
            <div
              key={b.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow transition-shadow"
            >
              {/* Header Bar */}
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm">
                    {user?.name?.[0]?.toUpperCase() || <UserIcon size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gray-400">{b.bookingRef}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                        isProofSubmitted
                          ? 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                          : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                      }`}>
                        {isProofSubmitted ? 'Proof Submitted' : 'Awaiting Payment'}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {user?.name || 'Customer'}{' '}
                      <span className="font-normal text-gray-500 text-sm">({user?.email || 'No email'})</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">₹{b.totalAmount}</span>
                  <p className="text-xs text-gray-400">Total slot fee</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-3 text-sm">
                  {venue && (
                    <div className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300">
                      <MapPin size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{venue.name}</p>
                        <p className="text-xs text-gray-500">{venue.address}, {venue.city}</p>
                      </div>
                    </div>
                  )}

                  {slot && (
                    <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                      <Calendar size={16} className="text-brand-600 flex-shrink-0" />
                      <span>
                        {new Date(slot.date || slot.startTime).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })} · {slot.startTime?.length <= 5 ? slot.startTime : new Date(slot.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {slot.endTime?.length <= 5 ? slot.endTime : new Date(slot.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {pv?.utrNumber && pv.utrNumber !== 'DIRECT_CONFIRMATION' && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Submitted UTR / Transaction ID</p>
                      <code className="font-mono font-bold text-gray-900 dark:text-white text-sm">{pv.utrNumber}</code>
                    </div>
                  )}

                  {!pv?.screenshotUrl && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>No screenshot uploaded yet. You can still confirm offline / direct UPI receipt.</span>
                    </div>
                  )}
                </div>

                {/* Screenshot Display */}
                {pv?.screenshotUrl && !pv.screenshotUrl.includes('undefined') && pv.screenshotUrl !== 'DIRECT_CONFIRMATION' ? (
                  <div className="relative h-44 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={
                        pv.screenshotUrl.startsWith('http')
                          ? pv.screenshotUrl
                          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${pv.screenshotUrl.startsWith('/') ? '' : '/'}${pv.screenshotUrl}`
                      }
                      alt="Payment proof screenshot"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                    <a
                      href={
                        pv.screenshotUrl.startsWith('http')
                          ? pv.screenshotUrl
                          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${pv.screenshotUrl.startsWith('/') ? '' : '/'}${pv.screenshotUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black transition-colors"
                      title="Open full image"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 text-xs p-4 text-center">
                    <p className="font-semibold text-gray-500 mb-1">Direct Confirmation Mode</p>
                    <p>Click confirm below if you or the venue owner verified cash, direct UPI, or bank credit.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
                <button
                  onClick={() => approve(b.id)}
                  disabled={verify.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
                >
                  <Check size={16} /> Confirm Payment & Book Slot
                </button>
                <button
                  onClick={() => setModal({ bookingId: b.id })}
                  disabled={verify.isPending}
                  className="flex-shrink-0 flex items-center justify-center gap-2 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-bold py-2.5 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reject Payment</h3>
            <p className="text-sm text-gray-500 mb-4">
              Explain why this payment is being rejected. The player will receive an immediate notification and email.
            </p>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. UTR number could not be found in bank statement, amount mismatch..."
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={verify.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
