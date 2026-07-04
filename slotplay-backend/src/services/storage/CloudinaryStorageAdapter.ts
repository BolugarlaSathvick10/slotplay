/**
 * services/storage/CloudinaryStorageAdapter.ts
 *
 * Cloudinary implementation of StorageAdapter.
 * Activated when STORAGE_PROVIDER=cloudinary in .env
 *
 * This is the v2 provider. In v1 (local), this class is imported by the
 * factory but never instantiated, so missing Cloudinary credentials
 * don't cause startup errors.
 */

import { StorageAdapter } from './StorageAdapter';
import { UploadCategory, UploadResult } from '@/types';
import { cloudinary } from '@/config/cloudinary';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';

// Map our categories to Cloudinary folder paths
const CATEGORY_TO_FOLDER: Record<UploadCategory, string> = {
  'venue-images': 'slotplay/venue-images',
  'avatars': 'slotplay/avatars',
  'upi-qr': 'slotplay/upi-qr',
  'payment-screenshots': 'slotplay/payment-screenshots',
};

export class CloudinaryStorageAdapter extends StorageAdapter {
  async upload(
    buffer: Buffer,
    _filename: string,
    mimeType: string,
    category: UploadCategory,
  ): Promise<UploadResult> {
    const folder = CATEGORY_TO_FOLDER[category];

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'image',
            format: 'webp', // normalise all uploads to WebP
            quality: 'auto:good',
          },
          (error, result) => {
            if (error || !result) {
              logger.error('[Cloudinary] Upload failed', { error });
              return reject(new AppError('Failed to upload file to Cloudinary', 500));
            }

            resolve({
              url: result.secure_url,
              key: result.public_id,
              mimeType,
              sizeBytes: result.bytes,
            });
          },
        )
        .end(buffer);
    });
  }

  async delete(key: string, _category: UploadCategory): Promise<void> {
    try {
      await cloudinary.uploader.destroy(key, { resource_type: 'image' });
      logger.debug(`[Cloudinary] Deleted: ${key}`);
    } catch (err) {
      logger.warn('[Cloudinary] Delete failed (non-fatal)', {
        key,
        error: (err as Error).message,
      });
    }
  }

  getUrl(key: string, _category: UploadCategory): string {
    // Reconstruct the Cloudinary secure URL from public_id
    return cloudinary.url(key, { secure: true, fetch_format: 'auto' });
  }
}
