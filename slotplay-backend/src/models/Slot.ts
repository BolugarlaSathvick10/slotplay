/**
 * models/Slot.ts
 *
 * A materialised, bookable time slot for a specific date.
 * Generated nightly by the slot-generation cron from SlotTemplate rows.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';
import { SlotStatus } from '@/types';

export interface SlotAttributes {
  id: string;
  venueId: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  price: number;
  status: SlotStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SlotCreationAttributes = Optional<SlotAttributes, 'id' | 'status'>;

export class Slot
  extends Model<SlotAttributes, SlotCreationAttributes>
  implements SlotAttributes
{
  declare id: string;
  declare venueId: string;
  declare date: string;
  declare startTime: string;
  declare endTime: string;
  declare price: number;
  declare status: SlotStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Slot.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SlotStatus)),
      allowNull: false,
      defaultValue: SlotStatus.AVAILABLE,
    },
  },
  {
    sequelize,
    tableName: 'slots',
    timestamps: true,
    indexes: [
      { fields: ['venue_id', 'date'] },
      { fields: ['venue_id', 'status'] },
      // Prevent duplicate slots for the same venue / date / start time
      {
        unique: true,
        fields: ['venue_id', 'date', 'start_time'],
        name: 'slots_venue_date_start_unique',
      },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * models/SlotTemplate.ts
 *
 * Recurring weekly schedule defined by the owner.
 * The cron job reads these to generate Slot rows day-ahead.
 *
 * day_of_week: 0 = Sunday … 6 = Saturday (matches JavaScript Date.getDay())
 */

export interface SlotTemplateAttributes {
  id: string;
  venueId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  price: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SlotTemplateCreationAttributes = Optional<
  SlotTemplateAttributes,
  'id' | 'isActive'
>;

export class SlotTemplate
  extends Model<SlotTemplateAttributes, SlotTemplateCreationAttributes>
  implements SlotTemplateAttributes
{
  declare id: string;
  declare venueId: string;
  declare dayOfWeek: number;
  declare startTime: string;
  declare endTime: string;
  declare price: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SlotTemplate.init(
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
    dayOfWeek: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      validate: { min: 0, max: 6 },
      field: 'day_of_week',
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    tableName: 'slot_templates',
    timestamps: true,
    indexes: [{ fields: ['venue_id', 'day_of_week'] }],
  },
);
