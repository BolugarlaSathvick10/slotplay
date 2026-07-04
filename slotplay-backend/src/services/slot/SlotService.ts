/**
 * services/slot/SlotService.ts
 *
 * Slot availability queries.
 * DB schema: date DATE, start_time TIME, end_time TIME, price DECIMAL, status VARCHAR
 */

import { Op } from 'sequelize';
import { Slot } from '@/models/Slot';
import { Booking } from '@/models/Booking';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

// ── Helper: parse a date into YYYY-MM-DD string ───────────────────────────────

function toDateStr(d: Date | string): string {
  if (typeof d === 'string') return d.split('T')[0];
  return d.toISOString().split('T')[0];
}

// ── Helper: combine date + time strings into a JS Date for the response ────────

function combineDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

// ── Get available slots for a venue on a specific date ────────────────────────

export interface SlotWithAvailability {
  id: string;
  date: string;
  startTime: string;         // HH:MM — raw TIME from DB
  endTime: string;           // HH:MM — raw TIME from DB
  startDateTime: Date;       // Combined for display
  endDateTime: Date;         // Combined for display
  pricePerHour: number;
  isAvailable: boolean;
  bookingStatus: string | null;
}

export async function getSlotsByDate(venueId: string, date: Date | string): Promise<SlotWithAvailability[]> {
  const dateStr = toDateStr(date);

  const slots = await Slot.findAll({
    where: { venueId, date: dateStr },
    include: [
      {
        model: Booking,
        as: 'booking',
        attributes: ['id', 'status'],
        required: false,
      },
    ],
    order: [['start_time', 'ASC']],
  });

  const result: SlotWithAvailability[] = slots.map((slot) => {
    const booking = (slot as any).booking;
    const isAvailable =
      slot.status === 'available' &&
      (!booking || !['confirmed', 'pending_payment', 'pending_verification'].includes(booking.status));

    return {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      startDateTime: combineDateTime(slot.date, slot.startTime),
      endDateTime: combineDateTime(slot.date, slot.endTime),
      pricePerHour: Number(slot.price),
      isAvailable,
      bookingStatus: booking?.status ?? null,
    };
  });

  logger.debug('[SlotService] Fetched slots', { venueId, date: dateStr, count: result.length });
  return result;
}

// ── Check if a specific slot is bookable ──────────────────────────────────────

export async function isSlotAvailable(slotId: string): Promise<boolean> {
  const slot = await Slot.findByPk(slotId, {
    include: [{ model: Booking, as: 'booking', attributes: ['id', 'status'], required: false }],
  });

  if (!slot) throw AppError.notFound('Slot');

  const booking = (slot as any).booking;
  return (
    slot.status === 'available' &&
    (!booking || !['confirmed', 'pending_payment', 'pending_verification'].includes(booking.status))
  );
}

// ── Get slot by ID (for booking creation) ────────────────────────────────────

export async function getSlotById(slotId: string): Promise<Slot> {
  const slot = await Slot.findByPk(slotId);
  if (!slot) throw AppError.notFound('Slot');
  return slot;
}

// ── Get slots across a date range (grouped by date) ──────────────────────────

export async function getSlotsByDateRange(
  venueId: string,
  startDate: Date,
  endDate: Date,
): Promise<Record<string, SlotWithAvailability[]>> {
  const startStr = toDateStr(startDate);
  const endStr   = toDateStr(endDate);

  const slots = await Slot.findAll({
    where: {
      venueId,
      date: { [Op.between]: [startStr, endStr] },
    },
    include: [
      { model: Booking, as: 'booking', attributes: ['id', 'status'], required: false },
    ],
    order: [['date', 'ASC'], ['start_time', 'ASC']],
  });

  const grouped: Record<string, SlotWithAvailability[]> = {};

  for (const slot of slots) {
    const booking = (slot as any).booking;
    const isAvailable =
      slot.status === 'available' &&
      (!booking || !['confirmed', 'pending_payment', 'pending_verification'].includes(booking.status));

    const entry: SlotWithAvailability = {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      startDateTime: combineDateTime(slot.date, slot.startTime),
      endDateTime: combineDateTime(slot.date, slot.endTime),
      pricePerHour: Number(slot.price),
      isAvailable,
      bookingStatus: booking?.status ?? null,
    };

    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(entry);
  }

  return grouped;
}
