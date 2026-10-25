/**
 * types/index.ts
 *
 * Frontend TypeScript types.
 * These mirror the backend domain types — kept separate to avoid
 * coupling the frontend build to the backend source.
 */

// ── Enums ─────────────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'owner' | 'admin';
export type VenueStatus = 'pending' | 'active' | 'suspended';
export type SlotStatus = 'available' | 'booked' | 'blocked';
export type BookingStatus =
  | 'pending_payment'
  | 'pending_verification'
  | 'confirmed'
  | 'rejected'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'rejected' | 'refunded';
export type VerificationStatus = 'submitted' | 'approved' | 'rejected';
export type NotificationType =
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'payment_submitted'
  | 'payment_approved'
  | 'payment_rejected'
  | 'slot_reminder'
  | 'general';

// ── Domain entities ───────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleId: number;
  role?: string;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface Sport {
  id: number;
  name: string;
  iconUrl?: string;
}

export interface Amenity {
  id: number;
  name: string;
  icon?: string;
}

export interface VenueImage {
  id: string;
  url: string;
  category: string;
}

export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  pricePerHour: number;
  phone: string;
  isActive: boolean;
  status?: string;
  averageRating?: number | string;
  reviewCount?: number;
  distance?: string;
  sports?: Sport[];
  images?: VenueImage[];
  amenities?: Amenity[];
  owner?: Partial<User>;
  reviews?: Review[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Slot {
  id: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: SlotStatus;
}

export interface Booking {
  id: string;
  userId: string;
  slotId: string;
  venueId: string;
  bookingRef: string;
  totalAmount: number;
  status: BookingStatus;
  qrCodeUrl?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  slot?: Slot;
  venue?: Venue;
  payment?: Payment;
  paymentVerification?: PaymentVerification;
  user?: Pick<User, 'id' | 'name' | 'avatarUrl' | 'email'>;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface PaymentVerification {
  id: string;
  paymentId: string;
  bookingId: string;
  utrNumber: string;
  screenshotUrl: string;
  status: VerificationStatus;
  reviewNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface OwnerUpiQr {
  id: string;
  ownerId: string;
  venueId: string;
  upiId: string;
  qrImageUrl: string;
  displayName: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  userId: string;
  venueId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  user?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
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
  code?: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Auth store ────────────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface OwnerStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingPayments: number;
  totalRevenue: number;
  totalVenues: number;
}

export interface AdminStats {
  totalUsers: number;
  totalVenues: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingVerifications: number;
  totalRevenue: number;
}

export interface AdminReports {
  users: number;
  venues: number;
  bookings: number;
  revenue: number;
  confirmedBookings?: number;
  pendingVerifications?: number;
  pendingPayments?: number;
  cancelledBookings?: number;
  rejectedBookings?: number;
  totalVenuesActive?: number;
  totalVenuesSuspended?: number;
}

