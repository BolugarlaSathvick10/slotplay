/**
 * models/Booking.ts
 *
 * A booking ties a user to a slot. Status progresses:
 *   pending_payment → pending_verification → confirmed
 *                                          → rejected
 *   pending_payment → cancelled  (user cancels before submitting payment)
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';
import { BookingStatus } from '@/types';

export interface BookingAttributes {
  id: string;
  userId: string;
  slotId: string;
  venueId: string;
  bookingRef: string; // human-readable unique ref e.g. SP-20240601-XXXX
  totalAmount: number;
  status: BookingStatus;
  qrCodeUrl?: string | null;
  confirmedAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BookingCreationAttributes = Optional<
  BookingAttributes,
  'id' | 'status' | 'qrCodeUrl' | 'confirmedAt' | 'cancelledAt'
>;

export class Booking
  extends Model<BookingAttributes, BookingCreationAttributes>
  implements BookingAttributes
{
  declare id: string;
  declare userId: string;
  declare slotId: string;
  declare venueId: string;
  declare bookingRef: string;
  declare totalAmount: number;
  declare status: BookingStatus;
  declare qrCodeUrl: string | null;
  declare confirmedAt: Date | null;
  declare cancelledAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Booking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    slotId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'slot_id',
    },
    venueId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'venue_id',
    },
    bookingRef: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: 'booking_ref',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BookingStatus)),
      allowNull: false,
      defaultValue: BookingStatus.PENDING_PAYMENT,
    },
    qrCodeUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'qr_code_url',
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'confirmed_at',
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at',
    },
  },
  {
    sequelize,
    tableName: 'bookings',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['venue_id'] },
      { fields: ['slot_id'] },
      { fields: ['status'] },
      { unique: true, fields: ['booking_ref'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * models/Payment.ts
 *
 * Financial record linked to a booking.
 * In v1 the method is always 'upi_manual'. The method field allows
 * future payment providers to be identified without schema changes.
 */

import { PaymentStatus, PaymentMethod } from '@/types';

export interface PaymentAttributes {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentCreationAttributes = Optional<
  PaymentAttributes,
  'id' | 'currency' | 'status'
>;

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  declare id: string;
  declare bookingId: string;
  declare userId: string;
  declare amount: number;
  declare currency: string;
  declare method: PaymentMethod;
  declare status: PaymentStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'booking_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'INR',
    },
    method: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
      defaultValue: PaymentMethod.UPI_MANUAL,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['booking_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * models/PaymentVerification.ts
 *
 * Stores the evidence submitted by the user (screenshot + UTR) and
 * the owner's review decision.
 */

import { VerificationStatus } from '@/types';

export interface PaymentVerificationAttributes {
  id: string;
  paymentId: string;
  bookingId: string;
  submittedBy: string; // user id
  utrNumber: string;
  screenshotKey: string; // storage key
  screenshotUrl: string;
  status: VerificationStatus;
  reviewedBy?: string | null; // owner user id
  reviewNote?: string | null;
  submittedAt?: Date;
  reviewedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentVerificationCreationAttributes = Optional<
  PaymentVerificationAttributes,
  'id' | 'status' | 'reviewedBy' | 'reviewNote' | 'reviewedAt' | 'submittedAt'
>;

export class PaymentVerification
  extends Model<
    PaymentVerificationAttributes,
    PaymentVerificationCreationAttributes
  >
  implements PaymentVerificationAttributes
{
  declare id: string;
  declare paymentId: string;
  declare bookingId: string;
  declare submittedBy: string;
  declare utrNumber: string;
  declare screenshotKey: string;
  declare screenshotUrl: string;
  declare status: VerificationStatus;
  declare reviewedBy: string | null;
  declare reviewNote: string | null;
  declare submittedAt: Date;
  declare reviewedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PaymentVerification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'payment_id',
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'booking_id',
    },
    submittedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'submitted_by',
    },
    utrNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'utr_number',
    },
    screenshotKey: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'screenshot_key',
    },
    screenshotUrl: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      field: 'screenshot_url',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(VerificationStatus)),
      allowNull: false,
      defaultValue: VerificationStatus.SUBMITTED,
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reviewed_by',
    },
    reviewNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_note',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'submitted_at',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
    },
  },
  {
    sequelize,
    tableName: 'payment_verifications',
    timestamps: true,
    indexes: [
      { fields: ['booking_id'] },
      { fields: ['payment_id'] },
      { fields: ['submitted_by'] },
      { fields: ['status'] },
    ],
  },
);
