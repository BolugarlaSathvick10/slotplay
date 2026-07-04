/**
 * services/storage/LocalStorageAdapter.ts
 *
 * Stores uploaded files on the local filesystem under the UPLOAD_DIR
 * configured in .env (default: uploads/).
 *
 * Directory structure:
 *   uploads/
 *     venue-images/
 *     avatars/
 *     upi-qr/
 *     payment-screenshots/
 *
 * Files are served by Express static middleware at /uploads/...
 *
 * To migrate to Cloudinary in v2, swap this class for CloudinaryStorageAdapter
 * in the factory function below. Zero changes to controllers or routes.
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageAdapter } from './StorageAdapter';
import { UploadCategory, UploadResult } from '@/types';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

// Derive the extension from MIME type
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export class LocalStorageAdapter extends StorageAdapter {
  private baseDir: string;
  private baseUrl: string;

  constructor() {
    super();
    // Resolve relative to cwd so it works from any working directory
    this.baseDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
    // The Express static route exposes /uploads — strip the dir name prefix
    this.baseUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}`;
  }

  async upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    category: UploadCategory,
  ): Promise<UploadResult> {
    const ext = MIME_TO_EXT[mimeType] ?? path.extname(filename).slice(1) ?? 'bin';
    const uniqueName = `${uuidv4()}.${ext}`;
    const categoryDir = path.join(this.baseDir, category);
    const filePath = path.join(categoryDir, uniqueName);

    // Ensure category directory exists
    await fs.mkdir(categoryDir, { recursive: true });

    await fs.writeFile(filePath, buffer);

    const key = `${category}/${uniqueName}`;
    const url = this.getUrl(key, category);

    logger.debug(`[LocalStorage] Saved file: ${filePath}`);

    return {
      url,
      key,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  async delete(key: string, _category: UploadCategory): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    try {
      await fs.unlink(filePath);
      logger.debug(`[LocalStorage] Deleted file: ${filePath}`);
    } catch (err: unknown) {
      // ENOENT means the file is already gone — treat as success
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn(`[LocalStorage] Could not delete ${filePath}`, {
          error: (err as Error).message,
        });
      }
    }
  }

  getUrl(key: string, _category: UploadCategory): string {
    // key already includes the category prefix: "venue-images/uuid.jpg"
    return `/uploads/${key}`;
  }
}
