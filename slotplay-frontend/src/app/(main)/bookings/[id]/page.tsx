/**
 * app/(main)/bookings/[id]/page.tsx — Booking Detail with QR ticket
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useBookingDetail, useCancelBooking } from '@/hooks/useBooking';
import { Check, Clock, XCircle, MapPin, Calendar, Download, ChevronLeft } from 'lucide-react';

const STATUS_UI = {
  pending_payment: { label: 'Awaiting Payment', Icon: Clock, bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', color: 'text-yellow-700 dark:text-yellow-400' },
  confirmed:       { label: 'Confirmed ✓',      Icon: Check, bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',   color: 'text-green-700 dark:text-green-400' },
  cancelled:       { label: 'Cancelled',         Icon: XCircle, bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',        color: 'text-gray-600 dark:text-gray-400' },
  rejected:        { label: 'Payment Rejected',  Icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',         color: 'text-red-700 dark:text-red-400' },
} as const;

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { data: booking, isLoading } = useBookingDetail(params.id);
  const cancel = useCancelBooking();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    if (booking?.status === 'confirmed' && canvasRef.current && !qrReady) {
      import('qrcode').then(QRCode => {
        QRCode.toCanvas(canvasRef.current!, JSON.stringify({
          ref: booking.bookingRef,
          venue: (booking.venue as any)?.name,
          slot: (booking.slot as any)?.startTime,
          amount: booking.totalAmount,
        }), { width: 180, color: { dark: '#166534', light: '#f0fdf4' } });
        setQrReady(true);
      });
    }
  }, [booking, qrReady]);

  const downloadTicket = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.download = `slotplay-ticket-${booking?.bookingRef}.png`;
    a.href = canvasRef.current.toDataURL();
    a.click();
  };

  if (isLoading) return (
    <div className="max-w-lg mx-auto px-4 py-8 animate-pulse space-y-4">
      {[60,120,200,80].map(h => <div key={h} style={{ height: h }} className="bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
    </div>
  );

  if (!booking) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 mb-4">Booking not found.</p>
      <Link href="/bookings" className="text-brand-600 hover:underline text-sm font-semibold">← My bookings</Link>
    </div>
  );

  const ui = STATUS_UI[booking.status as keyof typeof STATUS_UI] ?? STATUS_UI.cancelled;
  const { Icon } = ui;
  const venue = booking.venue as any;
  const slot  = booking.slot  as any;
  const pv    = booking.paymentVerification as any;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/bookings" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6">
        <ChevronLeft size={15} /> My bookings
      </Link>

      {/* Status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${ui.bg}`}>
        <Icon size={22} className={ui.color} />
        <div>
          <p className={`font-bold ${ui.color}`}>{ui.label}</p>
          <p className="text-xs text-gray-500 font-mono">{booking.bookingRef}</p>
        </div>
      </div>

      {/* QR ticket (confirmed only) */}
      {booking.status === 'confirmed' && (
        <div className="bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-900 rounded-2xl p-6 mb-6 text-center">
          <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-4">Your ticket</p>
          <canvas ref={canvasRef} className="mx-auto rounded-xl" />
          <p className="text-xs text-gray-500 mt-3 mb-4">Show this QR at the venue entrance</p>
          <button onClick={downloadTicket} className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-colors">
            <Download size={15} /> Download ticket
          </button>
        </div>
      )}

      {/* Details */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-4 space-y-3 text-sm">
        {venue && (
          <div className="flex gap-3">
            <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{venue.name}</p>
              <p className="text-gray-500">{venue.city}, {venue.state}</p>
            </div>
          </div>
        )}
        {slot && (
          <div className="flex gap-3">
            <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(slot.date || slot.startTime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-gray-500">
                {slot.startTime?.length <= 5 ? slot.startTime : new Date(slot.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} –{' '}
                {slot.endTime?.length <= 5 ? slot.endTime : new Date(slot.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between">
          <span className="text-gray-500">Amount</span>
          <span className="font-black text-gray-900 dark:text-white text-lg">₹{booking.totalAmount}</span>
        </div>
      </div>

      {/* Payment info */}
      {pv && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4 text-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Payment</p>
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">UTR</span>
            <code className="font-mono font-bold text-gray-900 dark:text-white">{pv.utrNumber}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{pv.status}</span>
          </div>
          {pv.reviewNote && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
              Rejection reason: {pv.reviewNote}
            </div>
          )}
        </div>
      )}

      {/* Cancel */}
      {booking.status === 'pending_payment' && (
        <button
          onClick={() => confirm('Cancel this booking?') && cancel.mutate(booking.id)}
          disabled={cancel.isPending}
          className="w-full py-3 rounded-xl border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          {cancel.isPending ? 'Cancelling…' : 'Cancel booking'}
        </button>
      )}

      {/* Retry payment */}
      {booking.status === 'rejected' && (
        <Link
          href={`/bookings/checkout?bookingId=${booking.id}`}
          className="block w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-center transition-colors"
        >
          Retry payment
        </Link>
      )}
    </div>
  );
}
