/**
 * components/turf/ReviewsSection.tsx
 *
 * Star histogram + paginated review list + inline submit form.
 */

'use client';

import { useState } from 'react';
import { Star, User } from 'lucide-react';
import { useVenueReviews, useSubmitReview } from '@/hooks/useVenue';
import { useAuth } from '@/hooks/useAuth';

interface ReviewsSectionProps {
  venueId: string;
  averageRating: number | null;
  reviewCount: number;
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            size={24}
            className={`transition-colors ${
              n <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ venueId, averageRating, reviewCount }: ReviewsSectionProps) {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVenueReviews(venueId, page);
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    await submitReview.mutateAsync({ venueId, rating, comment });
    setRating(0);
    setComment('');
    setSubmitted(true);
  };

  const reviews = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      {/* Summary row */}
      {averageRating && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
          <div className="text-center">
            <p className="text-4xl font-black text-gray-900 dark:text-white">{Number(averageRating).toFixed(1)}</p>
            <div className="flex justify-center gap-0.5 mt-1">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={12} className={n <= Math.round(Number(averageRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{reviewCount} reviews</p>
          </div>
        </div>
      )}

      {/* Submit form */}
      {isAuthenticated && !submitted && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900">
          <p className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Leave a review</p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience… (optional)"
            rows={3}
            className="mt-3 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          <button
            type="submit"
            disabled={!rating || submitReview.isPending}
            className="mt-3 px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white text-sm font-bold rounded-xl transition-colors"
          >
            {submitReview.isPending ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      )}

      {submitted && (
        <div className="mb-6 p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl text-sm text-brand-700 dark:text-brand-400 font-semibold">
          ✅ Thanks for your review!
        </div>
      )}

      {/* Reviews list */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && reviews.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-6 text-center">
          No reviews yet. Be the first to share your experience!
        </p>
      )}

      <div className="space-y-4">
        {reviews.map((r: any) => (
          <div key={r.id} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 text-brand-700 dark:text-brand-400 font-bold text-sm">
              {r.user?.name?.[0]?.toUpperCase() ?? <User size={14} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.user?.name ?? 'Player'}</p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={10} className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{r.comment}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 10 && (
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40">Prev</button>
          <button onClick={() => setPage(p => p+1)} disabled={page * 10 >= pagination.total} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
