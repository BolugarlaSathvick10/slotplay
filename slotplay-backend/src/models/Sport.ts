/**
 * models/Sport.ts
 *
 * Lookup table for supported sport types.
 * Seeded at startup: Cricket, Football, Badminton, Tennis, etc.
 * Adding a new sport requires only a new seed row — no schema changes.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface SportAttributes {
  id: number;
  name: string;
  iconUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SportCreationAttributes = Optional<
  SportAttributes,
  'id' | 'iconUrl'
>;

export class Sport
  extends Model<SportAttributes, SportCreationAttributes>
  implements SportAttributes
{
  declare id: number;
  declare name: string;
  declare iconUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Sport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    iconUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'icon_url',
    },
  },
  {
    sequelize,
    tableName: 'sports',
    timestamps: true,
  },
);
