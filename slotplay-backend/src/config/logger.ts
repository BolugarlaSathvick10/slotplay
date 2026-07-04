/**
 * config/logger.ts
 *
 * Centralised Winston logger.
 * - Development: colourised console output
 * - Production:  JSON to stdout + rotating file (logs/error.log, logs/combined.log)
 *
 * Usage:
 *   import { logger } from '@/config/logger';
 *   logger.info('Server started', { port: 4000 });
 *   logger.error('Something failed', { error: err.message });
 */

import winston from 'winston';
import path from 'path';
import { env } from './env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Custom format for development console ─────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}]: ${stack ?? message}${metaStr}`;
  }),
);

// ── JSON format for production ────────────────────────────────────────────────
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

// ── Transports ────────────────────────────────────────────────────────────────
const transports: winston.transport[] = [];

if (env.NODE_ENV === 'development') {
  transports.push(new winston.transports.Console({ format: devFormat }));
} else {
  transports.push(
    new winston.transports.Console({ format: prodFormat }),
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: prodFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: prodFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  );
}

// ── Logger instance ───────────────────────────────────────────────────────────
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports,
  // Do not exit on handled exceptions
  exitOnError: false,
});

// ── Stream for Morgan HTTP logger ─────────────────────────────────────────────
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};
