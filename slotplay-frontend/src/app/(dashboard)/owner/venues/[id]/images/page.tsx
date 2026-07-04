/**
 * app/(dashboard)/owner/venues/[id]/images/page.tsx
 *
 * Venue image manager: upload, preview, reorder, set primary, delete.
 */

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Upload, Trash2, Star, StarOff, MoveUp, MoveDown,
  X, ChevronLeft, ImageIcon, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

const MAX_IMAGES = 8;
const MAX_MB = 5;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

interface VenueImage {
  id: string;
  url: string;
  storageKey: string;
  isPrimary: boolean;
  sortOrder: number;
}

function useVenueImages(venueId: string) {
  return useQuery({
    queryKey: ['venue-images', venueId],
    queryFn: async () => {
      const { data } = await api.get(`/api/venues/${venueId}`);
      const images = (data.data.images ?? []) as VenueImage[];
      return images.sort((a, b) => a.sortOrder - b.sortOrder);
    },
    staleTime: 30_000,
  });
}

export default function VenueImagesPage({ params }: { params: { id: string } }) {
  const venueId = params.id;
  const qc = useQueryClient();
  const { data: images = [], isLoading } = useVenueImages(venueId);

  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['venue-images', venueId] });

  // ── File validation ───────────────────────────────────────────────────────
  function validateFile(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) return 'Only JPEG, PNG, and WebP images are allowed.';
    if (file.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB}MB.`;
    return null;
  }

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const remaining = MAX_IMAGES - images.length - previews.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_IMAGES} images per venue`); return; }

    const toAdd = arr.slice(0, remaining);
    const errors: string[] = [];

    toAdd.forEach(file => {
      const err = validateFile(file);
      if (err) { errors.push(`${file.name}: ${err}`); return; }
      setPreviews(p => [...p, { file, url: URL.createObjectURL(file) }]);
    });

    if (errors.length) toast.error(errors[0]);
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [images.length, previews.length]);

  // ── Upload ────────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!previews.length) return;
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    previews.forEach(p => formData.append('images', p.file));

    try {
      await api.post(`/api/venues/${venueId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      toast.success(`${previews.length} image${previews.length > 1 ? 's' : ''} uploaded!`);
      previews.forEach(p => URL.revokeObjectURL(p.url));
      setPreviews([]);
      invalidate();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  const deleteImage = useMutation({
    mutationFn: (id: string) => api.delete(`/api/venues/${venueId}/images/${id}`),
    onSuccess: () => { toast.success('Image deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete image'),
  });

  const setPrimary = useMutation({
    mutationFn: (id: string) => api.patch(`/api/venues/${venueId}/images/${id}/primary`),
    onSuccess: () => { toast.success('Primary image updated'); invalidate(); },
    onError: () => toast.error('Failed to set primary'),
  });

  const reorder = useMutation({
    mutationFn: (order: string[]) => api.patch(`/api/venues/${venueId}/images/reorder`, { order }),
    onSuccess: () => { invalidate(); },
  });

  function moveImage(idx: number, dir: -1 | 1) {
    const newOrder = [...images];
    const target = idx + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    reorder.mutate(newOrder.map(i => i.id));
  }

  const totalSlots = images.length + previews.length;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <Link href="/owner/venues" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Venue Photos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{images.length} of {MAX_IMAGES} images uploaded</p>
        </div>
      </div>

      {/* Upload zone */}
      {totalSlots < MAX_IMAGES && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center mb-6 transition-colors ${
            dragOver
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600'
          }`}
        >
          <input
            id="img-upload"
            type="file"
            multiple
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
          <label htmlFor="img-upload" className="cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-4">
              <Upload size={24} className="text-brand-600 dark:text-brand-400" />
            </div>
            <p className="font-bold text-gray-900 dark:text-white mb-1">
              {dragOver ? 'Drop images here' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-sm text-gray-500">JPEG, PNG, WebP · max {MAX_MB}MB each · up to {MAX_IMAGES - images.length} more</p>
          </label>
        </div>
      )}

      {/* Pending previews */}
      {previews.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-gray-900 dark:text-white text-sm">
              Ready to upload ({previews.length})
            </p>
            <button onClick={() => { previews.forEach(p => URL.revokeObjectURL(p.url)); setPreviews([]); }}
              className="text-xs text-red-500 hover:underline">Clear all</button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {previews.map((p, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image src={p.url} alt="" fill className="object-cover" sizes="120px" />
                <button
                  onClick={() => { URL.revokeObjectURL(p.url); setPreviews(prev => prev.filter((_, idx) => idx !== i)); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <p className="absolute bottom-1 left-1.5 text-[9px] text-white bg-black/50 rounded px-1.5 py-0.5 font-medium truncate max-w-[90%]">
                  {(p.file.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            ))}
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading…</span><span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
            ) : (
              <><Upload size={16} /> Upload {previews.length} image{previews.length > 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      )}

      {/* Uploaded images */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-16 text-center">
          <ImageIcon size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-sm text-gray-500">No images yet. Upload some above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Uploaded images</p>
          {images.map((img, idx) => (
            <div key={img.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3">
              {/* Thumbnail */}
              <div className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {img.isPrimary && (
                    <span className="text-[10px] font-black bg-brand-600 text-white px-2 py-0.5 rounded-full">PRIMARY</span>
                  )}
                  <span className="text-xs text-gray-400">Image {idx + 1}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Move up */}
                <button
                  onClick={() => moveImage(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  <MoveUp size={15} />
                </button>
                {/* Move down */}
                <button
                  onClick={() => moveImage(idx, 1)}
                  disabled={idx === images.length - 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  <MoveDown size={15} />
                </button>
                {/* Set primary */}
                {!img.isPrimary && (
                  <button
                    onClick={() => setPrimary.mutate(img.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    title="Set as primary"
                  >
                    <StarOff size={15} />
                  </button>
                )}
                {img.isPrimary && (
                  <button className="p-1.5 rounded-lg text-amber-500 cursor-default" title="Primary image">
                    <Star size={15} className="fill-amber-400" />
                  </button>
                )}
                {/* Delete */}
                <button
                  onClick={() => { if (confirm('Delete this image?')) deleteImage.mutate(img.id); }}
                  disabled={deleteImage.isPending}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Limit warning */}
      {totalSlots >= MAX_IMAGES && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-700 dark:text-yellow-400">
          <AlertCircle size={15} className="flex-shrink-0" />
          Maximum {MAX_IMAGES} images reached. Delete existing images to upload new ones.
        </div>
      )}
    </div>
  );
}
