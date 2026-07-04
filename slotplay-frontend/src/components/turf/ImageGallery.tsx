/**
 * components/turf/ImageGallery.tsx
 *
 * Full-width gallery with thumbnail strip.
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{ id: string; url: string; category?: string }>;
  venueName: string;
}

export function ImageGallery({ images, venueName }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) {
    return (
      <div className="w-full h-72 sm:h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400">
        No photos yet
      </div>
    );
  }

  const prev = () => setActive(i => (i - 1 + images.length) % images.length);
  const next = () => setActive(i => (i + 1) % images.length);

  return (
    <>
      <div className="relative group">
        {/* Main image */}
        <div className="relative w-full h-72 sm:h-[420px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            key={active}
            src={images[active].url}
            alt={`${venueName} — photo ${active + 1}`}
            fill
            priority
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, 800px"
          />

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Counter + expand */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {images.length > 1 && (
              <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {active + 1} / {images.length}
              </span>
            )}
            <button
              onClick={() => setLightbox(true)}
              className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full"
            >
              <Expand size={14} />
            </button>
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActive(i)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  i === active ? 'border-brand-500 scale-105' : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold">✕</button>
          <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 text-white/70 hover:text-white">
            <ChevronLeft size={32} />
          </button>
          <div className="relative w-full max-w-4xl h-[80vh] mx-8">
            <Image src={images[active].url} alt="" fill className="object-contain" sizes="100vw" />
          </div>
          <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 text-white/70 hover:text-white">
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </>
  );
}
