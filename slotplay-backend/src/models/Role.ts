/**
 * models/Role.ts
 *
 * Lookup table for user roles.
 * Seeded at startup: id=1 user, id=2 owner, id=3 admin
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';
import { UserRole } from '@/types';

export interface RoleAttributes {
  id: number;
  name: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RoleCreationAttributes = Optional<RoleAttributes, 'id'>;

export class Role
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes
{
  declare id: number;
  declare name: UserRole;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: true,
  },
);
