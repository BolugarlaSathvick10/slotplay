/**
 * components/venue/SlotGrid.tsx
 */

'use client';

import { SlotResponse } from '@/lib/venue';
import { Check, Lock } from 'lucide-react';

import { formatTime } from '@/lib/utils';

interface SlotGridProps {
  slots: SlotResponse[];
  selectedSlotId?: string;
  onSlotSelect?: (slotId: string) => void;
  isLoading?: boolean;
}

export function SlotGrid({
  slots,
  selectedSlotId,
  onSlotSelect,
  isLoading,
}: SlotGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <Lock size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500 dark:text-gray-400">
          No slots available for this date
        </p>
      </div>
    );
  }

  const formatSlotTime = (slot: any, field: 'start' | 'end') => {
    const timeStr = field === 'start' ? slot.startTime : slot.endTime;
    if (timeStr) {
      return formatTime(timeStr);
    }
    const isoSrc = field === 'start' ? slot.startDateTime : slot.endDateTime;
    const d = isoSrc ? new Date(isoSrc) : new Date();
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.id}
          onClick={() => onSlotSelect?.(slot.id)}
          disabled={!slot.isAvailable}
          className={`p-3 rounded-lg border-2 transition-all ${
            selectedSlotId === slot.id
              ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
              : slot.isAvailable
                ? 'border-gray-200 dark:border-gray-700 hover:border-green-300 bg-white dark:bg-gray-900'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
          }`}
        >
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {formatSlotTime(slot, 'start')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            ₹{slot.pricePerHour ?? (slot as any).price}
          </div>
          <div className={`text-xs font-medium flex items-center gap-1 ${
            slot.isAvailable
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {slot.isAvailable ? (
              <>
                <Check size={12} />
                Available
              </>
            ) : (
              <>
                <Lock size={12} />
                Booked
              </>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
