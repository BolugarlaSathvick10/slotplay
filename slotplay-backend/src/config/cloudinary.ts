/**
 * config/cloudinary.ts
 *
 * Cloudinary SDK configuration.
 *
 * This file only configures the SDK. The actual upload/delete logic lives in
 * services/storage/CloudinaryStorage.ts which is activated when
 * STORAGE_PROVIDER=cloudinary.
 *
 * In v1 (STORAGE_PROVIDER=local), this file is imported but the SDK is never
 * called — so missing credentials won't cause startup failures.
 */

import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from './logger';

export function configureCloudinary(): void {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    if (env.STORAGE_PROVIDER === 'cloudinary') {
      logger.error(
        '❌  STORAGE_PROVIDER=cloudinary but Cloudinary credentials are missing.',
      );
      process.exit(1);
    }
    // v1: credentials absent but provider is local — log and continue
    logger.debug('Cloudinary credentials not set — using local storage');
    return;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  logger.info('Cloudinary configured');
}

export { cloudinary };
