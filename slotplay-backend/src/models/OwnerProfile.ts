/**
 * models/OwnerProfile.ts
 *
 * Extended profile for turf owners. Created when a user registers as an owner
 * and must be approved by an admin before their venues go live.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface OwnerProfileAttributes {
  id: string;
  userId: string;
  businessName: string;
  gstNumber?: string | null;
  isApproved: boolean;
  approvedAt?: Date | null;
  approvedBy?: string | null; // admin user id
  createdAt?: Date;
  updatedAt?: Date;
}

export type OwnerProfileCreationAttributes = Optional<
  OwnerProfileAttributes,
  'id' | 'isApproved' | 'gstNumber' | 'approvedAt' | 'approvedBy'
>;

export class OwnerProfile
  extends Model<OwnerProfileAttributes, OwnerProfileCreationAttributes>
  implements OwnerProfileAttributes
{
  declare id: string;
  declare userId: string;
  declare businessName: string;
  declare gstNumber: string | null;
  declare isApproved: boolean;
  declare approvedAt: Date | null;
  declare approvedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

OwnerProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // one profile per owner
      field: 'user_id',
    },
    businessName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'business_name',
    },
    gstNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'gst_number',
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_approved',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approved_by',
    },
  },
  {
    sequelize,
    tableName: 'owner_profiles',
    timestamps: true,
  },
);
