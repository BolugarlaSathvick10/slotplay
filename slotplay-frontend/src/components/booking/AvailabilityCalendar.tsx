/**
 * components/booking/AvailabilityCalendar.tsx
 *
 * 7-day date strip + live slot grid with locking, validation, and booking creation.
 * Phase 7: booking engine.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueSlots } from '@/hooks/useVenue';
import { useCreateBooking } from '@/hooks/useBooking';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Lock, Check, AlertCircle, RefreshCw, Zap } from 'lucide-react';

import { formatTime } from '@/lib/utils';

interface AvailabilityCalendarProps {
  venueId: string;
  pricePerHour: number;
  ownerUpiId?: string;
}

function fmt(iso: string | Date, opts: Intl.DateTimeFormatOptions) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleTimeString('en-IN', opts);
}

function fmtTime(slot: any) {
  if (slot.startTime && slot.endTime) {
    return {
      start: formatTime(slot.startTime),
      end:   formatTime(slot.endTime),
    };
  }
  const start = slot.startDateTime
    ? new Date(slot.startDateTime)
    : new Date(`${slot.date}T${slot.startTime}:00`);
  const end = slot.endDateTime
    ? new Date(slot.endDateTime)
    : new Date(`${slot.date}T${slot.endTime}:00`);
  return {
    start: start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    end:   end.toLocaleTimeString('en-IN',   { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

function dateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AvailabilityCalendar({ venueId, pricePerHour, ownerUpiId }: AvailabilityCalendarProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const createBooking = useCreateBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Date selection ──────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<Date>(days[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Reset slot selection when date changes
  useEffect(() => { setSelectedSlotId(null); }, [selectedDate]);

  // ── Slots query (refetches every 60 s for live availability) ─
  const { data: slots = [], isLoading, error, refetch, isFetching } = useVenueSlots(venueId, selectedDate);

  useEffect(() => {
    const id = setInterval(() => refetch(), 60_000);
    return () => clearInterval(id);
  }, [refetch]);

  // ── Validation ──────────────────────────────────────────────
  const selectedSlot = (slots as any[]).find((s: any) => s.id === selectedSlotId);

  const handleBook = async () => {
    if (isSubmitting || createBooking.isPending) return;

    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/venues/${venueId}`);
      return;
    }
    if (!selectedSlotId) return;

    // Validate the slot is still available right before booking
    const fresh = (slots as any[]).find((s: any) => s.id === selectedSlotId);
    if (!fresh || !fresh.isAvailable) {
      alert('This slot is no longer available. Please choose another.');
      setSelectedSlotId(null);
      refetch();
      return;
    }

    setIsSubmitting(true);
    let booking;
    try {
      booking = await createBooking.mutateAsync({
        slotId: selectedSlotId,
        venueId,
      });
      // Redirect to checkout with booking context
      router.push(
        `/bookings/checkout?bookingId=${booking.id}&venueId=${venueId}&slotId=${selectedSlotId}&date=${dateKey(selectedDate)}`
      );
    } catch {
      // onError in useCreateBooking already shows a toast — nothing more to do here
    } finally {
      setIsSubmitting(false);
    }
  };

  const available = (slots as any[]).filter((s: any) => s.isAvailable).length;
  const total     = (slots as any[]).length;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 dark:text-white">Book a slot</p>
          {!isLoading && total > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="text-brand-600 dark:text-brand-400 font-semibold">{available}</span> of {total} slots open
            </p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          title="Refresh availability"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Date strip */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map((day) => {
            const isSelected = dateKey(day) === dateKey(selectedDate);
            const isToday    = dateKey(day) === dateKey(today);
            return (
              <button
                key={dateKey(day)}
                onClick={() => setSelectedDate(day)}
                className={`flex-shrink-0 flex flex-col items-center w-12 py-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-700'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase opacity-70">
                  {isToday ? 'Today' : day.toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
                <span className="text-lg font-black leading-tight">{day.getDate()}</span>
                <span className="text-[9px] opacity-60">{day.toLocaleDateString('en-IN', { month: 'short' })}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot grid */}
      <div className="px-4 py-4">

        {isLoading && (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={15} />
            Failed to load slots. <button onClick={() => refetch()} className="underline">Retry</button>
          </div>
        )}

        {!isLoading && !error && (slots as any[]).length === 0 && (
          <div className="text-center py-8">
            <Lock size={28} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No slots configured for this date.</p>
          </div>
        )}

        {!isLoading && !error && (slots as any[]).length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {(slots as any[]).map((slot: any) => {
              const isSelected  = selectedSlotId === slot.id;
              const isSelectedDateToday = dateKey(selectedDate) === dateKey(today);
              let isPast = false;
              if (dateKey(selectedDate) < dateKey(today)) {
                isPast = true;
              } else if (isSelectedDateToday && slot.startTime) {
                const [h, m] = slot.startTime.split(':').map(Number);
                const now = new Date();
                const slotDateObj = new Date(selectedDate);
                slotDateObj.setHours(h, m || 0, 0, 0);
                isPast = slotDateObj < now;
              }

              const slotPrice = slot.pricePerHour ?? slot.price;

              return (
                <button
                  key={slot.id}
                  onClick={() => slot.isAvailable && !isPast && setSelectedSlotId(isSelected ? null : slot.id)}
                  disabled={!slot.isAvailable || isPast}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                    isPast
                      ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-40 cursor-not-allowed'
                      : isSelected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm'
                        : slot.isAvailable
                          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer'
                          : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-50'
                  }`}
                >
                  {/* Selected check */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={11} className={`flex-shrink-0 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`} />
                    <span className={`text-xs font-bold font-mono ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {fmtTime(slot).start}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-1.5">
                    to {fmtTime(slot).end}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">₹{slotPrice}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isPast
                        ? 'text-gray-400'
                        : slot.isAvailable
                          ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30'
                          : 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                    }`}>
                      {isPast ? 'Past' : slot.isAvailable ? 'Open' : 'Booked'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Summary + CTA */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
          {selectedSlot ? (
            <div className="space-y-3">
              {/* Booking summary */}
              <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Time</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fmtTime(selectedSlot).start} – {fmtTime(selectedSlot).end}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total</span>
                  <span className="font-black text-brand-700 dark:text-brand-300 text-base">₹{selectedSlot.pricePerHour ?? selectedSlot.price}</span>
                </div>
              </div>

              {/* UPI hint */}
              {ownerUpiId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  You'll pay via UPI to <code className="font-mono text-gray-700 dark:text-gray-300">{ownerUpiId}</code>
                </p>
              )}

              <button
                onClick={handleBook}
                disabled={isSubmitting || createBooking.isPending}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm"
              >
                <Zap size={16} />
                {isSubmitting || createBooking.isPending
                  ? 'Creating booking…'
                  : isAuthenticated
                    ? 'Book this slot'
                    : 'Sign in to book'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
              ↑ Select a slot to see pricing and book
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
