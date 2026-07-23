/**
 * config/session.ts
 *
 * express-session configuration.
 * Sessions are persisted to Neon PostgreSQL via connect-pg-simple.
 */

import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

// ── pg Pool for session store ─────────────────────────────────────────────────
const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  // Neon requires SSL — 'require' is a Neon-specific option not in the pg types,
  // so cast to any to avoid the TS2353 error while keeping the runtime behaviour
  ssl: { rejectUnauthorized: false } as any,
  max: 3,
});

pgPool.on('error', (err) => {
  logger.error('Session pg pool error', { error: err.message });
});

// ── Session store ─────────────────────────────────────────────────────────────
const PgStore = connectPgSimple(session);

const store = new PgStore({
  pool: pgPool,
  tableName: env.SESSION_TABLE_NAME,
  pruneSessionInterval: 60 * 60,
  createTableIfMissing: true,
});

store.on('error', (err: Error) => {
  logger.error('Session store error', { error: err.message });
});

// ── Session middleware factory ─────────────────────────────────────────────────
// express-session types expose RequestHandler via the session namespace
export function buildSessionMiddleware(): ReturnType<typeof session> {
  return session({
    store,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: 'slotplay.sid',
    cookie: {
      maxAge: env.SESSION_MAX_AGE_MS,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  });
}

// ── Type augmentation ─────────────────────────────────────────────────────────
declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: 'user' | 'owner' | 'admin';
    email: string;
  }
}
