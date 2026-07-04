/**
 * models/OtpToken.ts
 *
 * Stores one-time passwords for email verification and password reset.
 * Each row is single-use and time-limited. Old tokens for the same
 * user + purpose should be invalidated before issuing a new one.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';
import { OtpPurpose } from '@/types';

export interface OtpTokenAttributes {
  id: string;
  userId: string;
  otpCode: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  isUsed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OtpTokenCreationAttributes = Optional<
  OtpTokenAttributes,
  'id' | 'isUsed'
>;

export class OtpToken
  extends Model<OtpTokenAttributes, OtpTokenCreationAttributes>
  implements OtpTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare otpCode: string;
  declare purpose: OtpPurpose;
  declare expiresAt: Date;
  declare isUsed: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /** True if the token has not been used and has not expired */
  isValid(): boolean {
    return !this.isUsed && new Date() < this.expiresAt;
  }
}

OtpToken.init(
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
    otpCode: {
      type: DataTypes.STRING(6),
      allowNull: false,
      field: 'otp_code',
    },
    purpose: {
      type: DataTypes.ENUM(...Object.values(OtpPurpose)),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_used',
    },
  },
  {
    sequelize,
    tableName: 'otp_tokens',
    timestamps: true,
    indexes: [
      { fields: ['user_id', 'purpose'] },
      { fields: ['expires_at'] },
    ],
  },
);
