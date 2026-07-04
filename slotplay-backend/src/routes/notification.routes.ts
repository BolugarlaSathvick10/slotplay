/**
 * routes/notification.routes.ts
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { asyncHandler } from '@/utils/helpers';
import * as NotificationService from '@/services/notification/NotificationService';
import { sendSuccess, sendPaginated } from '@/utils/apiResponse';

const router = Router();
router.use(requireAuth);

/** GET /api/notifications?page=1&limit=20&type=booking_confirmed */
router.get('/', asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const type  = req.query.type as string | undefined;
  const result = await NotificationService.getUserNotifications(req.session.userId!, page, limit, type);
  sendPaginated(res, result.data, {
    page, limit, total: result.pagination.total,
    pages: Math.ceil(result.pagination.total / limit),
  });
}));

/** POST /api/notifications/read-all */
router.post('/read-all', asyncHandler(async (req, res) => {
  await NotificationService.markAllAsRead(req.session.userId!);
  sendSuccess(res, null, 'All notifications marked as read');
}));

/** PATCH /api/notifications/:id/read */
router.patch('/:id/read', asyncHandler(async (req, res) => {
  await NotificationService.markAsRead(req.params.id);
  sendSuccess(res, null, 'Notification marked as read');
}));


/** DELETE /api/notifications/:id */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { Notification } = await import('@/models');
  const notif = await Notification.findOne({ where: { id: req.params.id, userId: req.session.userId! } });
  if (!notif) throw new (await import('@/utils/AppError')).AppError('Not found', 404, 'NOT_FOUND');
  await notif.destroy();
  sendSuccess(res, null, 'Notification deleted');
}));

/** GET /api/notifications — with optional type filter */
router.get('/filtered', asyncHandler(async (req, res) => {
  // Already handled by the main GET route via query param
  res.redirect('/api/notifications');
}));

export { router as notificationRouter };
