/**
 * app/(main)/venues/[id]/page.tsx — Turf Detail
 *
 * Phase 6: Gallery · Amenities · Pricing · Location · Reviews
 * Phase 7: AvailabilityCalendar (live slots, slot locking, booking creation)
 */

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useVenueDetail } from '@/hooks/useVenue';
import { ImageGallery } from '@/components/turf/ImageGallery';
import { AmenitiesList } from '@/components/turf/AmenitiesList';
import { ReviewsSection } from '@/components/turf/ReviewsSection';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { MapPin, Star, Phone, ChevronRight, Tag } from 'lucide-react';

function TurfDetailContent({ id }: { id: string }) {
  const { data: venue, isLoading, error } = useVenueDetail(id);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-64" />
        <div className="h-[420px] bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Venue not found or unavailable.</p>
        <Link href="/venues" className="text-brand-600 hover:underline text-sm font-semibold">← Back to browse</Link>
      </div>
    );
  }

  const rating  = venue.averageRating ? parseFloat(venue.averageRating as string) : null;
  const upiId   = (venue.owner as any)?.ownerProfile?.upiId;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight size={12} />
        <Link href="/venues" className="hover:text-brand-600">Venues</Link>
        <ChevronRight size={12} />
        <span className="text-gray-600 dark:text-gray-300 truncate max-w-[180px]">{venue.name}</span>
      </nav>

      {/* Image gallery */}
      <div className="mb-8">
        <ImageGallery images={venue.images ?? []} venueName={venue.name} />
      </div>

      {/* Page grid: main + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Main column ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-10">

          {/* Title + meta */}
          <div>
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex-1">
                {venue.name}
              </h1>
              {rating && (
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 flex-shrink-0">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-black text-gray-900 dark:text-white text-sm">{rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({venue.reviewCount})</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-brand-500" />
                {venue.address}, {venue.city}, {venue.state} — {venue.pincode}
              </span>
              {venue.phone && (
                <a href={`tel:${venue.phone}`} className="flex items-center gap-1 hover:text-brand-600">
                  <Phone size={14} />
                  {venue.phone}
                </a>
              )}
            </div>

            {/* Sport chips */}
            {Array.isArray(venue.sports) && venue.sports.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {venue.sports.map((s: any) => (
                  <span key={s.id} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 text-brand-700 dark:text-brand-400 text-xs font-bold">
                    {s.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {venue.description && (
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{venue.description}</p>
            )}
          </div>

          {/* Pricing */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag size={16} className="text-brand-600" /> Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl p-5">
                <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">Per hour</p>
                <p className="text-4xl font-black text-gray-900 dark:text-white">₹{venue.pricePerHour}</p>
                <p className="text-xs text-gray-500 mt-1">All slots priced equally</p>
              </div>
              {upiId && (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Payment via UPI</p>
                  <code className="text-base font-mono font-bold text-gray-900 dark:text-white">{upiId}</code>
                  <p className="text-xs text-gray-400 mt-1">Upload payment screenshot to confirm</p>
                </div>
              )}
            </div>
          </section>

          {/* Amenities */}
          {Array.isArray(venue.amenities) && venue.amenities.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Amenities</h2>
              <AmenitiesList amenities={venue.amenities} />
            </section>
          )}

          {/* Location map placeholder */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-brand-600" /> Location
            </h2>
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <iframe
                title="Venue location"
                width="100%"
                height="280"
                className="block"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${venue.longitude - 0.01}%2C${venue.latitude - 0.01}%2C${venue.longitude + 0.01}%2C${venue.latitude + 0.01}&layer=mapnik&marker=${venue.latitude}%2C${venue.longitude}`}
              />
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">{venue.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex-shrink-0 ml-3"
                >
                  Open in Maps →
                </a>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Reviews</h2>
            <ReviewsSection
              venueId={venue.id}
              averageRating={rating}
              reviewCount={venue.reviewCount ?? 0}
            />
          </section>
        </div>

        {/* ── Sidebar: booking engine ─────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <AvailabilityCalendar
              venueId={venue.id}
              pricePerHour={venue.pricePerHour}
              ownerUpiId={upiId}
            />

            {/* Owner card */}
            {venue.owner && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Managed by</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold">
                    {venue.owner.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{venue.owner.name}</p>
                    <p className="text-xs text-gray-400">{venue.owner.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TurfDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <TurfDetailContent id={params.id} />
    </Suspense>
  );
}
