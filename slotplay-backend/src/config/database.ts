/**
 * config/database.ts
 *
 * Sequelize instance configured for Neon PostgreSQL.
 *
 * Neon uses a WebSocket-based serverless driver in edge environments,
 * but standard pg works fine on Railway (Node.js). We use pg + SSL here.
 *
 * The Sequelize instance is a singleton — import from this file everywhere.
 */

import { Sequelize } from 'sequelize';
import { env } from './env';
import { logger } from './logger';

// ── Sequelize singleton ───────────────────────────────────────────────────────
export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: (sql: string) => {
    // Log queries only in development to avoid noise in production
    if (env.NODE_ENV === 'development') {
      logger.debug(sql);
    }
  },
  dialectOptions: {
    // Required for Neon PostgreSQL — connections use TLS
    ssl: {
      require: true,
      rejectUnauthorized: false, // Neon uses a trusted CA; set true with custom cert if needed
    },
  },
  pool: {
    max: 5,      // Neon serverless — keep pool small
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    // Use snake_case column names in the database (matches our schema)
    underscored: true,
    // Automatically add createdAt / updatedAt columns
    timestamps: true,
    // Do not auto-pluralise table names (we define them explicitly)
    freezeTableName: true,
  },
});

// ── Connection test helper ────────────────────────────────────────────────────
export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('✅  Neon PostgreSQL connection established');
  } catch (error) {
    logger.error('❌  Unable to connect to the database', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// ── Sync helper (dev only — use migrations in production) ─────────────────────
export async function syncDatabase(_force = false): Promise<void> {
  if (env.NODE_ENV === 'production') {
    logger.warn('syncDatabase called in production — skipped. Use migrations.');
    return;
  }
  // Never use alter:true — Sequelize generates invalid SQL for unique constraints on PostgreSQL.
  // Never use force:true in normal dev flow — it drops all tables and wipes seeded data.
  // sync() with no options is safe: creates missing tables, leaves existing ones untouched.
  await sequelize.sync({ force: false });
  logger.info('Database synced (missing tables created, existing tables untouched)');
}
