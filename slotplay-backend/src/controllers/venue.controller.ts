/**
 * controllers/venue.controller.ts
 * HTTP layer — thin wrappers over VenueService and SlotService.
 */

import { Request, Response, NextFunction } from 'express';
import * as VenueService from '@/services/venue/VenueService';
import * as SlotService from '@/services/slot/SlotService';
import { sendSuccess, sendPaginated } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/helpers';
import { AppError } from '@/utils/AppError';

// ── GET /api/venues ───────────────────────────────────────────────────────────

export const listVenues = asyncHandler(async (req: Request, res: Response) => {
  const result = await VenueService.listVenues(req.query as any);
  sendPaginated(res, result.data, result.pagination, 'Venues retrieved successfully');
});

// ── GET /api/venues/:id ───────────────────────────────────────────────────────

export const getVenue = asyncHandler(async (req: Request, res: Response) => {
  const venue = await VenueService.getVenueDetail(req.params.id);
  sendSuccess(res, venue);
});

// ── GET /api/venues/:id/slots?date=YYYY-MM-DD ─────────────────────────────────

export const getSlots = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    throw new AppError('date query parameter is required (YYYY-MM-DD)', 400, 'MISSING_PARAM');
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError('date must be in YYYY-MM-DD format', 400, 'INVALID_DATE');
  }

  const slots = await SlotService.getSlotsByDate(id, date);
  sendSuccess(res, slots, 'Slots retrieved successfully');
});

// ── GET /api/venues/lists/sports ──────────────────────────────────────────────

export const getSports = asyncHandler(async (_req: Request, res: Response) => {
  const sports = await VenueService.getSports();
  sendSuccess(res, sports);
});

// ── GET /api/venues/lists/amenities ───────────────────────────────────────────

export const getAmenities = asyncHandler(async (_req: Request, res: Response) => {
  const amenities = await VenueService.getAmenities();
  sendSuccess(res, amenities);
});

// ── POST /api/venues (owner) ──────────────────────────────────────────────────

export const createVenue = asyncHandler(async (req: Request, res: Response) => {
  const venue = await VenueService.createVenue(req.session.userId!, req.body);
  sendSuccess(res, venue, 'Venue created successfully', 201);
});

// ── PUT /api/venues/:id (owner) ───────────────────────────────────────────────

export const updateVenue = asyncHandler(async (req: Request, res: Response) => {
  const venue = await VenueService.updateVenue(req.params.id, req.session.userId!, req.body);
  sendSuccess(res, venue, 'Venue updated successfully');
});
