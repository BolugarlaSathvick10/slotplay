/**
 * routes/image.routes.ts
 *
 * Venue image CRUD for owners.
 * POST   /api/venues/:venueId/images        — upload (up to 8 images)
 * DELETE /api/venues/:venueId/images/:id    — delete
 * PATCH  /api/venues/:venueId/images/reorder — reorder
 * PATCH  /api/venues/:venueId/images/:id/primary — set primary
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { upload, processUpload } from '@/middleware/upload';
import { asyncHandler } from '@/utils/helpers';
import { Venue, VenueImage } from '@/models';
import { AppError } from '@/utils/AppError';
import { sendSuccess } from '@/utils/apiResponse';
import { logger } from '@/config/logger';

const router = Router({ mergeParams: true });
router.use(requireAuth);

// ── Ownership guard ───────────────────────────────────────────────────────────
async function assertOwner(venueId: string, userId: string) {
  const venue = await Venue.findByPk(venueId);
  if (!venue) throw AppError.notFound('Venue');
  if (venue.ownerId !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  return venue;
}

// ── POST /api/venues/:venueId/images ─────────────────────────────────────────
router.post(
  '/',
  upload.array('images', 8),
  asyncHandler(async (req, res) => {
    const { venueId } = req.params;
    await assertOwner(venueId, req.session.userId!);

    const files = req.files as Express.Multer.File[];
    if (!files?.length) throw new AppError('No files uploaded', 400, 'NO_FILES');

    // Check existing image count
    const existing = await VenueImage.count({ where: { venueId } });
    if (existing + files.length > 8) {
      throw new AppError(`Max 8 images per venue (currently ${existing})`, 400, 'TOO_MANY_IMAGES');
    }

    const hasPrimary = await VenueImage.findOne({ where: { venueId, isPrimary: true } });
    const nextSort = existing;

    const created: VenueImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await processUpload(files[i], 'venue-images');
      const img = await VenueImage.create({
        venueId,
        storageKey: result.storageKey,
        url: result.url,
        isPrimary: !hasPrimary && i === 0,
        sortOrder: nextSort + i,
      });
      created.push(img);
    }

    logger.info('[ImageRoutes] Uploaded images', { venueId, count: created.length });
    sendSuccess(res, created, `${created.length} image(s) uploaded`, 201);
  }),
);

// ── DELETE /api/venues/:venueId/images/:id ────────────────────────────────────
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { venueId, id } = req.params;
    await assertOwner(venueId, req.session.userId!);

    const image = await VenueImage.findOne({ where: { id, venueId } });
    if (!image) throw AppError.notFound('Image');

    // If deleting primary, promote next image
    if (image.isPrimary) {
      const next = await VenueImage.findOne({
        where: { venueId },
        order: [['sortOrder', 'ASC']],
      });
      if (next && next.id !== id) await next.update({ isPrimary: true });
    }

    await image.destroy();
    logger.info('[ImageRoutes] Deleted image', { venueId, id });
    sendSuccess(res, null, 'Image deleted');
  }),
);

// ── PATCH /api/venues/:venueId/images/reorder ────────────────────────────────
router.patch(
  '/reorder',
  asyncHandler(async (req, res) => {
    const { venueId } = req.params;
    await assertOwner(venueId, req.session.userId!);

    const { order } = req.body as { order: string[] };
    if (!Array.isArray(order)) throw new AppError('order must be an array of image IDs', 400, 'INVALID_BODY');

    await Promise.all(
      order.map((id, idx) =>
        VenueImage.update({ sortOrder: idx }, { where: { id, venueId } }),
      ),
    );

    sendSuccess(res, null, 'Images reordered');
  }),
);

// ── PATCH /api/venues/:venueId/images/:id/primary ────────────────────────────
router.patch(
  '/:id/primary',
  asyncHandler(async (req, res) => {
    const { venueId, id } = req.params;
    await assertOwner(venueId, req.session.userId!);

    // Clear existing primary
    await VenueImage.update({ isPrimary: false }, { where: { venueId } });
    await VenueImage.update({ isPrimary: true }, { where: { id, venueId } });

    sendSuccess(res, null, 'Primary image updated');
  }),
);

export { router as imageRouter };
