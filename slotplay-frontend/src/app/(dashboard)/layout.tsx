/**
 * app/(dashboard)/layout.tsx
 *
 * Dashboard shell: fixed sidebar + topbar, role-aware nav items.
 * Wraps all /dashboard and /owner pages.
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  LayoutDashboard, User, CalendarCheck, MapPin, Bell,
  PlusSquare, Clock, BarChart2, Users, Shield,
  LogOut, ChevronRight, Bell, X, Menu,
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ── Nav definitions ───────────────────────────────────────────────────────────

const USER_NAV = [
  { label: 'Overview',     href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Profile',      href: '/dashboard/profile',   icon: User },
  { label: 'My Bookings',  href: '/dashboard/bookings',  icon: CalendarCheck },
  { label: 'Notifications',  href: '/notifications',        icon: Bell },
];

const OWNER_NAV = [
  { label: 'Overview',        href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Profile',         href: '/dashboard/profile',     icon: User },
  { label: 'My Bookings',     href: '/dashboard/bookings',    icon: CalendarCheck },
  { label: 'Notifications',    href: '/notifications',          icon: Bell },
  { label: 'My Venues',       href: '/owner/venues',          icon: MapPin },
  { label: 'Add Venue',       href: '/owner/venues/new',      icon: PlusSquare },
  { label: 'Manage Slots',    href: '/owner/slots',           icon: Clock },
  { label: 'Verify Payments', href: '/owner/verifications',   icon: BarChart2 },
];

const ADMIN_NAV = [
  { label: 'Overview',    href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Users',       href: '/admin/users',    icon: Users },
  { label: 'Venues',      href: '/admin/venues',   icon: MapPin },
  { label: 'Reports',     href: '/admin/reports',  icon: BarChart2 },
];

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon size={17} className="flex-shrink-0" />
      {label}
    </Link>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?returnUrl=/dashboard');
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isOwner = user.roleId === 2;
  const isAdmin = user.roleId === 3;
  const navItems = isAdmin ? ADMIN_NAV : isOwner ? OWNER_NAV : USER_NAV;

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100 dark:border-gray-800 mb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">SP</span>
          </div>
          <span className="font-black text-gray-900 dark:text-white tracking-tight">
            Slot<span className="text-brand-600">Play</span>
          </span>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 capitalize">{isAdmin ? 'Admin' : isOwner ? 'Venue Owner' : 'Player'}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.href} {...item} />)}
      </div>

      {/* Footer links */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronRight size={15} className="rotate-180" /> Back to site
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="font-black text-gray-900 dark:text-white">Menu</span>
              <button onClick={() => setSidebarOpen(false)}><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 h-14 flex items-center px-4 sm:px-6 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu size={20} />
          </button>

          {/* Breadcrumb area — filled by page via portal or title */}
          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
              {user.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
