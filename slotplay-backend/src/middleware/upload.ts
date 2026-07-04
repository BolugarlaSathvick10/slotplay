/**
 * middleware/upload.ts
 *
 * Multer + Sharp upload pipeline.
 *
 * Flow:
 *   HTTP multipart request
 *     → Multer (memory storage — files held as Buffer, never written to temp disk)
 *     → processUpload() helper (calls Sharp to resize/optimise)
 *     → StorageAdapter.upload() (local disk or Cloudinary)
 *
 * Security controls enforced here:
 *   - MIME type allowlist (images only)
 *   - File size cap (MAX_FILE_SIZE_MB from env)
 *   - Magic-byte validation via Sharp (rejects non-image payloads even if MIME is spoofed)
 *
 * Usage in routes:
 *   router.post('/venue/:id/images', upload.single('image'), venueController.uploadImage);
 *   router.post('/payments/submit',  upload.single('screenshot'), paymentController.submit);
 */

import multer, { FileFilterCallback } from 'multer';
import sharp from 'sharp';
import { Request } from 'express';
import path from 'path';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { storage } from '@/services/storage';
import { sanitiseFilename } from '@/utils/helpers';
import { UploadCategory, UploadResult } from '@/types';
import { logger } from '@/config/logger';

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Multer configuration (memory storage) ────────────────────────────────────
const multerFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `File type not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
        400,
        'INVALID_FILE_TYPE',
      ),
    );
  }
};

export const upload = multer({
  storage: multer.memoryStorage(), // keep files in RAM, not temp disk
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 10, // max files per request
  },
  fileFilter: multerFilter,
});

// ── Sharp processing options per category ─────────────────────────────────────
interface ProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const CATEGORY_OPTIONS: Record<UploadCategory, ProcessOptions> = {
  'venue-images': { width: 1200, height: 800, quality: 85, format: 'webp' },
  'avatars': { width: 300, height: 300, quality: 90, format: 'webp' },
  'upi-qr': { width: 400, height: 400, quality: 95, format: 'png' },
  'payment-screenshots': { width: 1000, quality: 80, format: 'webp' },
};

// ── Core processing function ──────────────────────────────────────────────────

/**
 * Process a Multer file through Sharp, then persist via the active StorageAdapter.
 *
 * @param file      Multer file object (buffer in memory)
 * @param category  Upload category — determines resize dimensions and folder
 * @returns         UploadResult with public URL and storage key
 */
export async function processUpload(
  file: Express.Multer.File,
  category: UploadCategory,
): Promise<UploadResult> {
  const options = CATEGORY_OPTIONS[category];
  const mimeType = `image/${options.format ?? 'webp'}`;

  let sharpInstance = sharp(file.buffer);

  // Security: let Sharp decode the image — will throw on non-image payloads
  try {
    await sharpInstance.metadata();
  } catch {
    throw new AppError('Uploaded file is not a valid image', 400, 'INVALID_IMAGE');
  }

  // Resize with cover strategy (crops to fill, never distorts)
  if (options.width || options.height) {
    sharpInstance = sharpInstance.resize(options.width, options.height, {
      fit: 'cover',
      withoutEnlargement: true, // never upscale small images
    });
  }

  // Convert and compress
  switch (options.format) {
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality: options.quality ?? 85 });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ quality: options.quality ?? 90 });
      break;
    case 'jpeg':
    default:
      sharpInstance = sharpInstance.jpeg({ quality: options.quality ?? 85 });
  }

  const processedBuffer = await sharpInstance.toBuffer();
  const originalName = sanitiseFilename(
    path.parse(file.originalname).name,
  );

  logger.debug(
    `[Upload] ${category}: ${file.size} bytes → ${processedBuffer.length} bytes (${mimeType})`,
  );

  return storage.upload(processedBuffer, originalName, mimeType, category);
}

/**
 * Process multiple uploaded files from a single request field.
 * Used for venue image galleries (up to 10 images).
 */
export async function processMultipleUploads(
  files: Express.Multer.File[],
  category: UploadCategory,
): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => processUpload(file, category)));
}
