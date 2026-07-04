/**
 * app/layout.tsx
 *
 * Root layout — wraps the entire application with:
 *   - ThemeProvider (next-themes for dark/light mode)
 *   - QueryClientProvider (TanStack Query)
 *   - Toaster (react-hot-toast)
 *   - AuthHydrator (silently fetches /api/auth/me on mount)
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SlotPlay — Reserve Your Game',
    template: '%s | SlotPlay',
  },
  description: 'Book cricket turfs, football grounds and sports venues online. Real-time slot availability, UPI payments, digital QR tickets. Available across Hyderabad, Bangalore, Chennai, Mumbai.',
  keywords: ['sports booking', 'turf booking', 'cricket ground booking', 'slot booking', 'football turf', 'badminton court', 'sports venue', 'Hyderabad turf'],
  authors: [{ name: 'SlotPlay' }],
  creator: 'SlotPlay Technologies',
  metadataBase: new URL('https://slotplay.in'),
  openGraph: {
    type: 'website',
    siteName: 'SlotPlay',
    title: 'SlotPlay — Reserve Your Game',
    description: 'Real-time sports venue booking. Book turfs, grounds and courts in under 60 seconds.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'SlotPlay — Reserve Your Game' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlotPlay — Reserve Your Game',
    description: 'Real-time sports venue booking across India.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
