/**
 * routes/admin.routes.ts
 * Admin-only endpoints: user management, venue control.
 */

import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { asyncHandler } from '@/utils/helpers';
import { User } from '@/models/User';
import { Venue } from '@/models/Venue';
import { Op } from 'sequelize';
import { sendSuccess, sendPaginated } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { VenueStatus } from '@/types';

const router = Router();

// Admin guard middleware
router.use(requireAuth);
router.use(asyncHandler(async (req, _res, next) => {
  const user = await User.findByPk(req.session.userId!);
  if (!user || user.roleId !== 3) throw new AppError('Admin access required', 403, 'FORBIDDEN');
  next();
}));

// ── GET /api/admin/users ──────────────────────────────────────────────────────

router.get('/users', asyncHandler(async (req, res) => {
  const page   = parseInt(req.query.page as string)  || 1;
  const limit  = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where[Op.or] = [
      { name:  { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ['id', 'name', 'email', 'phone', 'roleId', 'isVerified', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  sendPaginated(res, rows, { page, limit, total: count, pages: Math.ceil(count / limit) });
}));

// ── PATCH /api/admin/users/:id/role ──────────────────────────────────────────

router.patch('/users/:id/role', asyncHandler(async (req, res) => {
  const { roleId } = req.body;
  if (![1, 2, 3].includes(roleId)) throw new AppError('Invalid roleId', 400, 'BAD_REQUEST');

  const user = await User.findByPk(req.params.id);
  if (!user) throw AppError.notFound('User');

  await user.update({ roleId });
  sendSuccess(res, { id: user.id, roleId: user.roleId }, 'Role updated');
}));

// ── PATCH /api/admin/users/:id/verify ────────────────────────────────────────

router.patch('/users/:id/verify', asyncHandler(async (req, res) => {
  const { isVerified } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) throw AppError.notFound('User');

  await user.update({ isVerified });
  sendSuccess(res, { id: user.id, isVerified: user.isVerified }, 'User updated');
}));

// ── PATCH /api/admin/venues/:id ───────────────────────────────────────────────

router.patch('/venues/:id', asyncHandler(async (req, res) => {
  const venue = await Venue.findByPk(req.params.id);
  if (!venue) throw AppError.notFound('Venue');

  // Venue uses status enum, not an isActive boolean column
  const { isActive } = req.body;
  const status: VenueStatus = isActive ? VenueStatus.ACTIVE : VenueStatus.SUSPENDED;
  await venue.update({ status });
  sendSuccess(res, { id: venue.id, status: venue.status }, 'Venue updated');
}));

export { router as adminRouter };
