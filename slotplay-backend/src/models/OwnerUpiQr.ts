/**
 * models/OwnerUpiQr.ts
 *
 * UPI payment QR codes uploaded by venue owners.
 * Displayed to users during the payment step.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';
import { NotificationType } from '@/types';

export interface OwnerUpiQrAttributes {
  id: string;
  ownerId: string;
  venueId: string;
  upiId: string;
  qrImageKey: string;
  qrImageUrl: string;
  displayName: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OwnerUpiQrCreationAttributes = Optional<
  OwnerUpiQrAttributes,
  'id' | 'isActive'
>;

export class OwnerUpiQr
  extends Model<OwnerUpiQrAttributes, OwnerUpiQrCreationAttributes>
  implements OwnerUpiQrAttributes
{
  declare id: string;
  declare ownerId: string;
  declare venueId: string;
  declare upiId: string;
  declare qrImageKey: string;
  declare qrImageUrl: string;
  declare displayName: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

OwnerUpiQr.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_id',
    },
    venueId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'venue_id',
    },
    upiId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'upi_id',
    },
    qrImageKey: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'qr_image_key',
    },
    qrImageUrl: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      field: 'qr_image_url',
    },
    displayName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'display_name',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'owner_upi_qr',
    timestamps: true,
    indexes: [{ fields: ['owner_id'] }, { fields: ['venue_id'] }],
  },
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * models/Review.ts
 *
 * A review can only be submitted once per booking (enforced by unique index).
 * avg_rating on Venue is updated via a service hook after insert/update.
 */

export interface ReviewAttributes {
  id: string;
  userId: string;
  venueId: string;
  bookingId: string;
  rating: number; // 1–5
  comment?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReviewCreationAttributes = Optional<
  ReviewAttributes,
  'id' | 'comment'
>;

export class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes
{
  declare id: string;
  declare userId: string;
  declare venueId: string;
  declare bookingId: string;
  declare rating: number;
  declare comment: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Review.init(
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
    venueId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'venue_id',
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'booking_id',
    },
    rating: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      { fields: ['venue_id'] },
      { fields: ['user_id'] },
      { unique: true, fields: ['booking_id'], name: 'reviews_booking_unique' },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * models/Notification.ts
 */

export interface NotificationAttributes {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'isRead' | 'metadata'
>;

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: string;
  declare userId: string;
  declare type: NotificationType;
  declare title: string;
  declare body: string;
  declare isRead: boolean;
  declare metadata: Record<string, unknown> | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
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
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    indexes: [{ fields: ['user_id', 'is_read'] }],
  },
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * models/AdminLog.ts
 *
 * Immutable audit trail for admin actions. Rows are never updated or deleted.
 */

export interface AdminLogAttributes {
  id: string;
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
}

export type AdminLogCreationAttributes = Optional<
  AdminLogAttributes,
  'id' | 'metadata'
>;

export class AdminLog
  extends Model<AdminLogAttributes, AdminLogCreationAttributes>
  implements AdminLogAttributes
{
  declare id: string;
  declare adminId: string;
  declare action: string;
  declare entity: string;
  declare entityId: string;
  declare metadata: Record<string, unknown> | null;
  declare readonly createdAt: Date;
}

AdminLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'admin_id',
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'entity_id',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'admin_logs',
    timestamps: true,
    updatedAt: false, // audit rows are immutable
    indexes: [{ fields: ['admin_id'] }, { fields: ['entity', 'entity_id'] }],
  },
);
