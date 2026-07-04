/**
 * routes/owner.routes.ts
 *
 * Owner-only routes: manage own venues, generate slot templates.
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { asyncHandler } from '@/utils/helpers';
import { Venue } from '@/models/Venue';
import { Slot } from '@/models/Slot';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

const router = Router();
router.use(requireAuth);

// ── GET /api/owner/venues — list venues owned by session user ─────────────────

router.get('/venues', asyncHandler(async (req, res) => {
  const venues = await Venue.findAll({
    where: { ownerId: req.session.userId! },
    include: ['sports', 'amenities', 'reviews'],
    order: [['createdAt', 'DESC']],
  });

  const enriched = venues.map(v => {
    const reviews = (v as any).reviews ?? [];
    const avgRating = reviews.length
      ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;
    return { ...v.toJSON(), averageRating: avgRating, reviewCount: reviews.length };
  });

  sendSuccess(res, enriched);
}));

// ── POST /api/owner/slots/generate — bulk slot generation ─────────────────────

router.post('/slots/generate', asyncHandler(async (req, res) => {
  const {
    venueId,
    fromDate,
    toDate,
    openHour = 6,
    closeHour = 22,
    slotDurationMinutes = 60,
    pricePerHour,
  } = req.body;

  if (!venueId || !fromDate || !toDate) {
    throw new AppError('venueId, fromDate, toDate required', 400, 'MISSING_PARAMS');
  }

  // Verify ownership
  const venue = await Venue.findByPk(venueId);
  if (!venue) throw AppError.notFound('Venue');
  if (venue.ownerId !== req.session.userId!) {
    throw new AppError('You do not own this venue', 403, 'FORBIDDEN');
  }

  const price = pricePerHour ?? venue.pricePerHour;
  const created: Slot[] = [];

  const start = new Date(fromDate);
  const end   = new Date(toDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const cursor = new Date(start);
  while (cursor <= end) {
    const day = new Date(cursor);

    // Generate slots for this day
    for (let h = openHour; h < closeHour; h += slotDurationMinutes / 60) {
      const slotStart = new Date(day);
      slotStart.setHours(Math.floor(h), (h % 1) * 60, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);

      if (slotEnd.getHours() > closeHour) break;

      // Check for duplicate
      const existing = await Slot.findOne({
        where: { venueId, date: slotStart.toISOString().split('T')[0], startTime: `${String(slotStart.getHours()).padStart(2,'0')}:${String(slotStart.getMinutes()).padStart(2,'0')}` },
      });
      if (existing) continue;

      // Format times as HH:MM strings for TIME columns
      const pad = (n: number) => String(n).padStart(2, '0');
      const dayStr    = slotStart.toISOString().split('T')[0];
      const startStr  = `${pad(slotStart.getHours())}:${pad(slotStart.getMinutes())}`;
      const endStr    = `${pad(slotEnd.getHours())}:${pad(slotEnd.getMinutes())}`;

      const slot = await Slot.create({
        venueId,
        date:      dayStr,
        startTime: startStr,
        endTime:   endStr,
        price:     price,
        status:    'available',
      });
      created.push(slot);
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  logger.info('[OwnerRoutes] Generated slots', { venueId, count: created.length });
  sendSuccess(res, created, `Generated ${created.length} slots`, 201);
}));

export { router as ownerRouter };
