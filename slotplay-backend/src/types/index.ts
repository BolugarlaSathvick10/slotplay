/**
 * types/index.ts
 *
 * Shared TypeScript types and enums used across the entire backend.
 * Centralising these avoids circular imports and ensures a single
 * source of truth for domain values.
 */

// ── Role ──────────────────────────────────────────────────────────────────────
export enum UserRole {
  USER = 'user',
  OWNER = 'owner',
  ADMIN = 'admin',
}

// ── Venue ─────────────────────────────────────────────────────────────────────
export enum VenueStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

// ── Slot ──────────────────────────────────────────────────────────────────────
export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
}

// ── Booking ───────────────────────────────────────────────────────────────────
export enum BookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING_VERIFICATION = 'pending_verification',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// ── Payment ───────────────────────────────────────────────────────────────────
export enum PaymentStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  UPI_MANUAL = 'upi_manual',
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
}

// ── Payment verification ──────────────────────────────────────────────────────
export enum VerificationStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ── OTP ───────────────────────────────────────────────────────────────────────
export enum OtpPurpose {
  VERIFY = 'verify',
  RESET = 'reset',
}

// ── Notification ──────────────────────────────────────────────────────────────
export enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_REJECTED = 'booking_rejected',
  PAYMENT_SUBMITTED = 'payment_submitted',
  PAYMENT_APPROVED = 'payment_approved',
  PAYMENT_REJECTED = 'payment_rejected',
  SLOT_REMINDER = 'slot_reminder',
  GENERAL = 'general',
}

// ── Storage ───────────────────────────────────────────────────────────────────
export type StorageProvider = 'local' | 'cloudinary';

export interface UploadResult {
  /** Public URL to the stored file */
  url: string;
  /** Unique identifier (relative path for local, public_id for Cloudinary) */
  key: string;
  /** MIME type */
  mimeType: string;
  /** Size in bytes */
  sizeBytes: number;
}

export type UploadCategory =
  | 'venue-images'
  | 'avatars'
  | 'upi-qr'
  | 'payment-screenshots';

// ── Payment provider ──────────────────────────────────────────────────────────
export interface CreateOrderInput {
  bookingId: string;
  amountInPaise: number; // smallest currency unit
  currency?: string;
  notes?: Record<string, string>;
}

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  /** Gateway-specific metadata */
  metadata?: Record<string, unknown>;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── API response envelope ─────────────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
