/**
 * app/(auth)/layout.tsx
 *
 * Shared layout for all authentication pages.
 * Centered card layout with brand header.
 */

import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-green-700 dark:text-green-400 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-sm">
            SP
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">SlotPlay</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-400 dark:text-gray-600">
        © {new Date().getFullYear()} SlotPlay. Reserve Your Game.
      </footer>
    </div>
  );
}
