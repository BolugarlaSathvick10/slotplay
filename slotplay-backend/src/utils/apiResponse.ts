/**
 * utils/apiResponse.ts
 *
 * Standardised JSON response helpers.
 * All controllers use these instead of calling res.json() directly,
 * ensuring every response has a consistent envelope shape.
 *
 * Success envelope:  { success: true, data: T, message?: string }
 * Error envelope:    { success: false, message: string, code?: string, errors?: object }
 */

import { Response } from 'express';

// ── Success responses ─────────────────────────────────────────────────────────

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): void {
  const body: any = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * Send a paginated list response.
 * Controllers call: sendPaginated(res, data[], { page, limit, total, pages }, message?)
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number; pages: number },
  message?: string,
): void {
  const body: any = {
    success: true,
    data: {
      data,
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages,
    },
  };
  if (message) body.message = message;
  res.status(200).json(body);
}

// ── Error responses ───────────────────────────────────────────────────────────

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  errors?: Record<string, string[]>,
): void {
  const body: any = { success: false, message };
  if (code) body.code = code;
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
}
