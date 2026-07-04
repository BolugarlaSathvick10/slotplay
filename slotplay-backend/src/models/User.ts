/**
 * models/User.ts
 *
 * Core user entity. Passwords are hashed with bcrypt before being stored.
 * The `password_hash` field is explicitly excluded from default JSON output
 * via `toJSON()` to prevent accidental exposure in API responses.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  roleId: number;
  isVerified: boolean;
  avatarUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'isVerified' | 'phone' | 'avatarUrl'
>;

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare passwordHash: string;
  declare roleId: number;
  declare isVerified: boolean;
  declare avatarUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /** Strip sensitive fields when serialising to JSON */
  toJSON(): Omit<UserAttributes, 'passwordHash'> {
    const values = super.toJSON() as UserAttributes;
    const { passwordHash: _pw, ...safe } = values;
    return safe;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, // 'user'
      field: 'role_id',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_verified',
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_url',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['role_id'] },
    ],
  },
);
