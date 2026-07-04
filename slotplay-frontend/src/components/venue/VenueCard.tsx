/**
 * components/venue/VenueCard.tsx
 *
 * Polished card with green price-ribbon, rating, sport chips, and list-mode variant.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';

interface VenueCardProps {
  venue: any;
  listMode?: boolean;
}

export function VenueCard({ venue, listMode = false }: VenueCardProps) {
  const img   = venue.images?.[0]?.url || '/placeholder-turf.jpg';
  const rating = venue.averageRating ? parseFloat(venue.averageRating).toFixed(1) : null;

  if (listMode) {
    return (
      <Link href={`/venues/${venue.id}`}>
        <div className="group flex gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all">
          <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
            <Image src={img} alt={venue.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="128px" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">{venue.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} />{venue.city}{venue.state ? `, ${venue.state}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-black text-brand-600 dark:text-brand-400">₹{venue.pricePerHour}</p>
                <p className="text-[10px] text-gray-400">/hour</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {rating && (
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Star size={11} className="fill-amber-400 text-amber-400" />{rating}
                  <span className="text-gray-400 font-normal">({venue.reviewCount})</span>
                </span>
              )}
              {venue.sports?.slice(0, 2).map((s: any) => (
                <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-semibold">{s.name}</span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/venues/${venue.id}`}>
      <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-xl transition-all cursor-pointer">

        {/* Image */}
        <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <Image
            src={img}
            alt={venue.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Price ribbon */}
          <div className="absolute top-3 right-3 bg-brand-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
            ₹{venue.pricePerHour}<span className="font-normal opacity-80">/hr</span>
          </div>
          {/* Distance badge */}
          {venue.distance && (
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
              {venue.distance} km
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 dark:text-white truncate mb-0.5">{venue.name}</h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-3">
            <MapPin size={11} className="flex-shrink-0" />
            {venue.city}{venue.state ? `, ${venue.state}` : ''}
          </p>

          {/* Sport chips */}
          {venue.sports?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {venue.sports.slice(0, 2).map((s: any) => (
                <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-semibold">
                  {s.name}
                </span>
              ))}
              {venue.sports.length > 2 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-semibold">
                  +{venue.sports.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            {rating ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                {rating}
                <span className="text-gray-400 font-normal">({venue.reviewCount})</span>
              </span>
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
              Book now →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
