/**
 * models/Venue.ts
 *
 * A sports venue registered by an owner.
 * Venues are pending approval by an admin before becoming publicly visible.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';
import { VenueStatus } from '@/types';

export interface VenueAttributes {
  id: string;
  ownerId: string;
  sportId: number;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  pricePerHour: number;
  phone?: string | null;
  status: VenueStatus;
  isVerified: boolean;
  avgRating: number;
  totalReviews: number;
  isActive?: boolean; // virtual helper — derived from status
  createdAt?: Date;
  updatedAt?: Date;
}

export type VenueCreationAttributes = Optional<
  VenueAttributes,
  | 'id'
  | 'description'
  | 'phone'
  | 'latitude'
  | 'longitude'
  | 'status'
  | 'isActive'
  | 'isVerified'
  | 'avgRating'
  | 'totalReviews'
>;

export class Venue
  extends Model<VenueAttributes, VenueCreationAttributes>
  implements VenueAttributes
{
  declare id: string;
  declare ownerId: string;
  declare sportId: number;
  declare name: string;
  declare description: string | null;
  declare address: string;
  declare city: string;
  declare state: string;
  declare pincode: string;
  declare latitude: number | null;
  declare longitude: number | null;
  declare pricePerHour: number;
  declare phone: string | null;
  declare status: VenueStatus;
  declare isVerified: boolean;
  declare avgRating: number;
  declare totalReviews: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Venue.init(
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
    sportId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sport_id',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    pricePerHour: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'price_per_hour',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(VenueStatus)),
      allowNull: false,
      defaultValue: VenueStatus.PENDING,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_verified',
    },
    avgRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'avg_rating',
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_reviews',
    },
  },
  {
    sequelize,
    tableName: 'venues',
    timestamps: true,
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['sport_id'] },
      { fields: ['city'] },
      { fields: ['status'] },
    ],
  },
);
