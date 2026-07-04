/**
 * config/session.ts
 *
 * express-session configuration.
 *
 * Sessions are persisted to the Neon PostgreSQL `sessions` table via
 * connect-pg-simple. This keeps the backend stateless (no in-process store)
 * and survives Railway restarts.
 *
 * Cookie settings follow security best practices:
 *   - httpOnly:   JS cannot access the cookie → mitigates XSS theft
 *   - secure:     Sent only over HTTPS in production
 *   - sameSite:   Strict → no cross-site request forgery
 */

import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

// ── pg Pool for session store ─────────────────────────────────────────────────
// Separate pool from Sequelize so session persistence works independently
const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false },
  max: 3, // Session store needs only a small pool
});

pgPool.on('error', (err) => {
  logger.error('Session pg pool error', { error: err.message });
});

// ── Session store ─────────────────────────────────────────────────────────────
const PgStore = connectPgSimple(session);

const store = new PgStore({
  pool: pgPool,
  tableName: env.SESSION_TABLE_NAME,
  // Purge expired sessions every hour
  pruneSessionInterval: 60 * 60,
  // Create the sessions table automatically if it doesn't exist
  createTableIfMissing: true,
});

store.on('error', (err: Error) => {
  logger.error('Session store error', { error: err.message });
});

// ── Session middleware factory ─────────────────────────────────────────────────
export function buildSessionMiddleware(): session.RequestHandler {
  return session({
    store,
    secret: env.SESSION_SECRET,
    resave: false,          // Don't resave if session wasn't modified
    saveUninitialized: false, // Don't save empty sessions (GDPR-friendly)
    rolling: true,          // Reset expiry on each request
    name: 'slotplay.sid',  // Custom cookie name — obscures the framework
    cookie: {
      maxAge: env.SESSION_MAX_AGE_MS,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      // domain intentionally omitted — defaults to request host
    },
  });
}

// ── Type augmentation ─────────────────────────────────────────────────────────
// Extend express-session's SessionData so req.session.userId is typed everywhere
declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: 'user' | 'owner' | 'admin';
    email: string;
  }
}
