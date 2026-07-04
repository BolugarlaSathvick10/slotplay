/**
 * components/venue/ReviewsList.tsx
 */

'use client';

import { Review } from '@/types';
import { Star, User } from 'lucide-react';
import { useVenueReviews } from '@/hooks/useVenue';
import { useState } from 'react';

interface ReviewsListProps {
  venueId: string;
}

export function ReviewsList({ venueId }: ReviewsListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useVenueReviews(venueId, page);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
        Failed to load reviews
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No reviews yet. Be the first to review!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {data.data.map((review: Review) => (
          <div
            key={review.id}
            className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  {(review.user as any)?.avatarUrl ? (
                    <img
                      src={(review.user as any).avatarUrl}
                      alt={(review.user as any)?.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <User size={20} className="text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {(review.user as any)?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(review.createdAt as string).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                  />
                ))}
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pagination.total > 10 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {Math.ceil(data.pagination.total / 10)}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(data.pagination.total / 10)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
