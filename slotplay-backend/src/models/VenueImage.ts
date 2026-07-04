/**
 * models/VenueImage.ts
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface VenueImageAttributes {
  id: string;
  venueId: string;
  /** Relative path (local) or public_id (Cloudinary) */
  storageKey: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type VenueImageCreationAttributes = Optional<
  VenueImageAttributes,
  'id' | 'isPrimary' | 'sortOrder'
>;

export class VenueImage
  extends Model<VenueImageAttributes, VenueImageCreationAttributes>
  implements VenueImageAttributes
{
  declare id: string;
  declare venueId: string;
  declare storageKey: string;
  declare url: string;
  declare isPrimary: boolean;
  declare sortOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

VenueImage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    venueId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'venue_id',
    },
    storageKey: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'storage_key',
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_primary',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
  },
  {
    sequelize,
    tableName: 'venue_images',
    timestamps: true,
    indexes: [{ fields: ['venue_id'] }],
  },
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * models/Amenity.ts
 * Lookup table — Parking, Changing Room, Floodlights, etc.
 */

export interface AmenityAttributes {
  id: number;
  name: string;
  icon?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AmenityCreationAttributes = Optional<
  AmenityAttributes,
  'id' | 'icon'
>;

export class Amenity
  extends Model<AmenityAttributes, AmenityCreationAttributes>
  implements AmenityAttributes
{
  declare id: number;
  declare name: string;
  declare icon: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Amenity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'amenities',
    timestamps: true,
  },
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * models/VenueAmenity.ts
 * Junction table — many-to-many between Venue and Amenity.
 */

export interface VenueAmenityAttributes {
  venueId: string;
  amenityId: number;
}

export class VenueAmenity
  extends Model<VenueAmenityAttributes>
  implements VenueAmenityAttributes
{
  declare venueId: string;
  declare amenityId: number;
}

VenueAmenity.init(
  {
    venueId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: 'venue_id',
    },
    amenityId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'amenity_id',
    },
  },
  {
    sequelize,
    tableName: 'venue_amenities',
    timestamps: false,
  },
);
