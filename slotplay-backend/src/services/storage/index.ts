/**
 * services/storage/index.ts
 *
 * Factory that resolves the active StorageAdapter based on STORAGE_PROVIDER.
 *
 * Usage throughout the app:
 *   import { storage } from '@/services/storage';
 *   const result = await storage.upload(buffer, filename, mimeType, 'venue-images');
 */

import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { StorageAdapter } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { CloudinaryStorageAdapter } from './CloudinaryStorageAdapter';

function createStorageAdapter(): StorageAdapter {
  switch (env.STORAGE_PROVIDER) {
    case 'local':
      logger.info('📁  Storage provider: local disk');
      return new LocalStorageAdapter();

    case 'cloudinary':
      logger.info('☁️   Storage provider: Cloudinary');
      return new CloudinaryStorageAdapter();

    default:
      // TypeScript should catch invalid values at compile time via the env schema
      throw new Error(`Unknown STORAGE_PROVIDER: ${env.STORAGE_PROVIDER}`);
  }
}

// Singleton — created once at startup
export const storage = createStorageAdapter();

// Re-export the abstract class for type usage
export { StorageAdapter } from './StorageAdapter';
