/**
 * app/(dashboard)/dashboard/page.tsx
 *
 * Overview dashboard — stats cards, recent bookings, quick actions.
 * Role-aware: shows owner stats if roleId === 2.
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useListBookings } from '@/hooks/useBooking';
import { usePendingVerifications } from '@/hooks/useBooking';
import {
  CalendarCheck, Clock, CheckCircle, XCircle,
  MapPin, PlusSquare, BarChart2, ArrowRight,
  TrendingUp, AlertCircle,
} from 'lucide-react';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; href?: string;
}) {
  const inner = (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {href && <ArrowRight size={15} className="text-gray-400" />}
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">{value}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Booking row ───────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  confirmed:       'bg-green-500',
  pending_payment: 'bg-yellow-500',
  cancelled:       'bg-gray-400',
  rejected:        'bg-red-500',
};

function BookingRow({ booking }: { booking: any }) {
  const venue = booking.venue;
  const slot  = booking.slot;
  return (
    <Link href={`/bookings/${booking.id}`} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[booking.status] ?? 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{venue?.name ?? 'Venue'}</p>
        <p className="text-xs text-gray-500">
          {slot ? new Date(slot.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white">₹{booking.totalAmount}</p>
        <p className="text-xs capitalize text-gray-400">{booking.status.replace('_', ' ')}</p>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const isOwner = user?.roleId === 2;
  const isAdmin = user?.roleId === 3;

  const { data: bookingData } = useListBookings(1, undefined);
  const { data: pendingData } = usePendingVerifications(1);

  const bookings = bookingData?.data ?? [];
  const confirmed   = bookings.filter((b: any) => b.status === 'confirmed').length;
  const pending     = bookings.filter((b: any) => b.status === 'pending_payment').length;
  const total       = bookingData?.pagination?.total ?? 0;
  const pendingPay  = pendingData?.pagination?.total ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">{greeting}</p>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          {user?.name?.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total bookings" value={total}
          icon={CalendarCheck} color="bg-brand-600"
          href="/dashboard/bookings"
        />
        <StatCard
          label="Confirmed" value={confirmed}
          sub="This month" icon={CheckCircle} color="bg-green-600"
        />
        <StatCard
          label="Awaiting payment" value={pending}
          icon={Clock} color="bg-yellow-500"
          href="/dashboard/bookings"
        />
        {isOwner ? (
          <StatCard
            label="Pending verifications" value={pendingPay}
            icon={AlertCircle} color="bg-orange-500"
            href="/owner/verifications"
          />
        ) : (
          <StatCard
            label="Completed" value={confirmed}
            sub="Play again!" icon={TrendingUp} color="bg-purple-600"
          />
        )}
      </div>

      {/* Two-column: recent bookings + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-white">Recent bookings</h2>
            <Link href="/dashboard/bookings" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarCheck size={32} className="mx-auto text-gray-200 dark:text-gray-800 mb-3" />
              <p className="text-sm text-gray-500">No bookings yet.</p>
              <Link href="/venues" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">Browse turfs →</Link>
            </div>
          ) : (
            <div>{bookings.slice(0, 6).map((b: any) => <BookingRow key={b.id} booking={b} />)}</div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Quick actions</h2>
            <div className="space-y-2">
              <Link href="/venues" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                  <MapPin size={16} className="text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Browse turfs</p>
                  <p className="text-xs text-gray-400">Find & book a slot</p>
                </div>
              </Link>

              <Link href="/dashboard/bookings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <CalendarCheck size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">My bookings</p>
                  <p className="text-xs text-gray-400">View history & tickets</p>
                </div>
              </Link>

              <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <BarChart2 size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Edit profile</p>
                  <p className="text-xs text-gray-400">Update name & phone</p>
                </div>
              </Link>

              {isOwner && (
                <Link href="/owner/venues/new" className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
                    <PlusSquare size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Add new venue</p>
                    <p className="text-xs text-brand-500">List your turf</p>
                  </div>
                </Link>
              )}

              {isOwner && pendingPay > 0 && (
                <Link href="/owner/verifications" className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center">
                    <AlertCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">{pendingPay} pending payments</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Tap to verify</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
