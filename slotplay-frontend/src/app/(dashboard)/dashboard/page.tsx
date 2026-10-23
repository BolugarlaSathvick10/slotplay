/**
 * app/(dashboard)/dashboard/page.tsx
 *
 * Role-aware overview dashboard:
 * - Admin: Platform metrics, all turf bookings, quick verification & venue links
 * - Owner: Turf metrics, bookings across owner's turfs, revenue & pending payments
 * - Player: Personal bookings, upcoming slots & quick booking
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  useListBookings,
  usePendingVerifications,
  useOwnerBookings,
  useOwnerStats,
  useAdminBookings,
  useAdminStats,
  useAdminPendingVerifications,
} from '@/hooks/useBooking';
import {
  CalendarCheck, Clock, CheckCircle,
  MapPin, PlusSquare, BarChart2, ArrowRight,
  TrendingUp, AlertCircle, Users, IndianRupee, ShieldCheck,
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
  confirmed:            'bg-green-500',
  pending_payment:      'bg-yellow-500',
  pending_verification: 'bg-orange-500',
  cancelled:            'bg-gray-400',
  rejected:             'bg-red-500',
};

function BookingRow({ booking, isManagementView }: { booking: any; isManagementView?: boolean }) {
  const venue = booking.venue;
  const slot  = booking.slot;
  const user  = booking.user;
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
    >
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[booking.status] ?? 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {venue?.name ?? 'Venue'}
          {isManagementView && user && (
            <span className="ml-2 font-normal text-xs text-gray-400">by {user.name}</span>
          )}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-mono text-gray-400">{booking.bookingRef}</span>
          <span>·</span>
            {slot
              ? `${new Date(slot.date ? slot.date + 'T00:00:00' : slot.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${
                  slot.startTime ? ` · ${slot.startTime.slice(0, 5)}` : ''
                }`
              : '—'}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white">₹{booking.totalAmount}</p>
        <p className="text-xs capitalize text-gray-400">{(booking.status || '').replace(/_/g, ' ')}</p>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const isOwner = user?.roleId === 2 || user?.role?.toLowerCase() === 'owner';
  const isAdmin = user?.roleId === 3 || user?.role?.toLowerCase() === 'admin';

  // Player hooks - only run if player
  const { data: userBookingData } = useListBookings(1, undefined, { enabled: !isAdmin && !isOwner });

  // Owner hooks - only run if owner
  const { data: ownerBookingData } = useOwnerBookings(1, undefined, { enabled: isOwner });
  const { data: ownerStats } = useOwnerStats({ enabled: isOwner });
  const { data: ownerPendingVerifications } = usePendingVerifications(1, { enabled: isOwner });

  // Admin hooks - only run if admin
  const { data: adminBookingData } = useAdminBookings(1, undefined, { enabled: isAdmin });
  const { data: adminPendingVerifications } = useAdminPendingVerifications(1, { enabled: isAdmin });
  const { data: adminStats } = useAdminStats({ enabled: isAdmin });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Role-specific stats & bookings
  let statsCards = null;
  let recentBookingsList: any[] = [];
  let viewAllHref = '/dashboard/bookings';
  let isManagement = false;

  if (isAdmin) {
    isManagement = true;
    viewAllHref = '/admin/bookings';
    recentBookingsList = adminBookingData?.data ?? [];
    statsCards = (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total bookings"
          value={adminStats?.totalBookings ?? 0}
          icon={CalendarCheck}
          color="bg-brand-600"
          href="/admin/bookings"
        />
        <StatCard
          label="Confirmed"
          value={adminStats?.confirmedBookings ?? 0}
          sub="Platform-wide"
          icon={CheckCircle}
          color="bg-green-600"
          href="/admin/bookings?status=confirmed"
        />
        <StatCard
          label="Pending action"
          value={adminPendingVerifications?.pagination?.total ?? adminStats?.pendingVerifications ?? 0}
          sub="Live verification queue"
          icon={AlertCircle}
          color="bg-orange-500"
          href="/admin/verifications"
        />
        <StatCard
          label="Total revenue"
          value={`₹${adminStats?.totalRevenue ?? 0}`}
          sub={`${adminStats?.totalVenues ?? 0} venues`}
          icon={IndianRupee}
          color="bg-purple-600"
          href="/admin/reports"
        />
      </div>
    );
  } else if (isOwner) {
    isManagement = true;
    viewAllHref = '/owner/bookings';
    recentBookingsList = ownerBookingData?.data ?? [];
    statsCards = (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Turf bookings"
          value={ownerStats?.totalBookings ?? 0}
          icon={CalendarCheck}
          color="bg-brand-600"
          href="/owner/bookings"
        />
        <StatCard
          label="Confirmed"
          value={ownerStats?.confirmedBookings ?? 0}
          sub="Ready to play"
          icon={CheckCircle}
          color="bg-green-600"
          href="/owner/bookings?status=confirmed"
        />
        <StatCard
          label="Pending payments"
          value={ownerPendingVerifications?.pagination?.total ?? ownerStats?.pendingPayments ?? 0}
          sub="Review & confirm"
          icon={AlertCircle}
          color="bg-orange-500"
          href="/owner/verifications"
        />
        <StatCard
          label="Turf revenue"
          value={`₹${ownerStats?.totalRevenue ?? 0}`}
          sub={`${ownerStats?.totalVenues ?? 0} venues`}
          icon={IndianRupee}
          color="bg-purple-600"
        />
      </div>
    );
  } else {
    // Player
    recentBookingsList = userBookingData?.data ?? [];
    const confirmedCount = recentBookingsList.filter((b: any) => b.status === 'confirmed').length;
    const pendingCount = recentBookingsList.filter((b: any) => b.status === 'pending_payment' || b.status === 'pending_verification').length;
    const totalCount = userBookingData?.pagination?.total ?? 0;

    statsCards = (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="My bookings"
          value={totalCount}
          icon={CalendarCheck}
          color="bg-brand-600"
          href="/dashboard/bookings"
        />
        <StatCard
          label="Confirmed"
          value={confirmedCount}
          sub="Ready tickets"
          icon={CheckCircle}
          color="bg-green-600"
          href="/dashboard/bookings"
        />
        <StatCard
          label="Awaiting confirmation"
          value={pendingCount}
          icon={Clock}
          color="bg-yellow-500"
          href="/dashboard/bookings"
        />
        <StatCard
          label="Completed"
          value={confirmedCount}
          sub="Play again!"
          icon={TrendingUp}
          color="bg-purple-600"
          href="/venues"
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">{greeting}</p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {user?.name?.split(' ')[0]} 👋
          </h1>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 uppercase tracking-wide">
            {isAdmin ? 'Admin' : isOwner ? 'Turf Owner' : 'Player'}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      {statsCards}

      {/* Two-column: recent bookings + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                {isAdmin ? 'Recent platform bookings' : isOwner ? 'Recent turf bookings' : 'My recent bookings'}
              </h2>
              <p className="text-xs text-gray-400">
                {isAdmin ? 'All slots booked across all venues' : isOwner ? 'Bookings for your sports venues' : 'Your recent slot reservations'}
              </p>
            </div>
            <Link
              href={viewAllHref}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recentBookingsList.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarCheck size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">No bookings yet.</p>
              {!isManagement && (
                <Link href="/venues" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
                  Browse turfs →
                </Link>
              )}
            </div>
          ) : (
            <div>
              {recentBookingsList.slice(0, 6).map((b: any) => (
                <BookingRow key={b.id} booking={b} isManagementView={isManagement} />
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Quick actions</h2>
            <div className="space-y-2">
              {isAdmin && (
                <>
                  <Link href="/admin/verifications" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center">
                      <ShieldCheck size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Verify Payments</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Review proof & confirm slots</p>
                    </div>
                  </Link>

                  <Link href="/admin/bookings" className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
                      <CalendarCheck size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">All Bookings & Payments</p>
                      <p className="text-xs text-brand-500">Platform-wide overview</p>
                    </div>
                  </Link>

                  <Link href="/admin/venues" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Manage Venues</p>
                      <p className="text-xs text-gray-400">Approve or suspend</p>
                    </div>
                  </Link>

                  <Link href="/admin/users" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                      <Users size={16} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Manage Users</p>
                      <p className="text-xs text-gray-400">View registered accounts</p>
                    </div>
                  </Link>
                </>
              )}

              {isOwner && (
                <>
                  <Link href="/owner/verifications" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center">
                      <ShieldCheck size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Verify Payments</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Approve & generate QR tickets</p>
                    </div>
                  </Link>

                  <Link href="/owner/bookings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <CalendarCheck size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Turf Bookings</p>
                      <p className="text-xs text-gray-400">Full booking list</p>
                    </div>
                  </Link>

                  <Link href="/owner/venues/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                      <PlusSquare size={16} className="text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Add new venue</p>
                      <p className="text-xs text-gray-400">List another turf</p>
                    </div>
                  </Link>
                </>
              )}

              {!isOwner && !isAdmin && (
                <>
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
                </>
              )}

              <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <BarChart2 size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Edit profile</p>
                  <p className="text-xs text-gray-400">Update name & phone</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
