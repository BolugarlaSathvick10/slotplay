/**
 * services/storage/StorageAdapter.ts
 *
 * Abstract storage interface.
 *
 * All upload/delete operations go through this interface. The concrete
 * implementation is resolved at startup based on STORAGE_PROVIDER:
 *
 *   'local'      → LocalStorageAdapter   (v1 default)
 *   'cloudinary' → CloudinaryStorageAdapter (v2, plug-in replacement)
 *
 * Adding a new provider (e.g. AWS S3) requires only:
 *   1. Create S3StorageAdapter implementing this interface
 *   2. Add 's3' to the STORAGE_PROVIDER enum in env.ts
 *   3. Register it in createStorageAdapter()
 *
 * No controller or route code needs to change.
 */

import { UploadCategory, UploadResult } from '@/types';

export abstract class StorageAdapter {
  /**
   * Persist an uploaded file and return its public URL and storage key.
   *
   * @param buffer    Raw file bytes (after Sharp processing)
   * @param filename  Original filename (sanitised before use)
   * @param mimeType  MIME type e.g. 'image/jpeg'
   * @param category  Logical folder / upload type
   */
  abstract upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    category: UploadCategory,
  ): Promise<UploadResult>;

  /**
   * Delete a previously uploaded file by its storage key.
   * Should NOT throw if the file does not exist (idempotent).
   *
   * @param key       The key returned by upload()
   * @param category  Must match the category used during upload
   */
  abstract delete(key: string, category: UploadCategory): Promise<void>;

  /**
   * Resolve a storage key to a public URL.
   * Useful when the URL needs to be re-derived (e.g. after domain change).
   */
  abstract getUrl(key: string, category: UploadCategory): string;
}
