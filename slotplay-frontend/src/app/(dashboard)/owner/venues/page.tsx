/**
 * app/(dashboard)/owner/venues/page.tsx
 *
 * Owner: list their venues with status, edit link, and toggle active.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin, PlusSquare, Edit, ToggleLeft, ToggleRight, Star, Eye } from 'lucide-react';

function useOwnerVenues() {
  return useQuery({
    queryKey: ['owner-venues'],
    queryFn: async () => {
      const { data } = await api.get('/api/owner/venues');
      return data.data as any[];
    },
  });
}

function useToggleVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.put(`/api/venues/${id}`, { isActive });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owner-venues'] }); toast.success('Venue updated'); },
    onError: () => toast.error('Failed to update venue'),
  });
}

export default function OwnerVenuesPage() {
  const { data: venues = [], isLoading } = useOwnerVenues();
  const toggle = useToggleVenue();

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">My Venues</h1>
          <p className="text-sm text-gray-500 mt-0.5">{venues.length} venue{venues.length !== 1 ? 's' : ''} listed</p>
        </div>
        <Link
          href="/owner/venues/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          <PlusSquare size={16} /> Add venue
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && venues.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-20 text-center">
          <MapPin size={36} className="mx-auto text-gray-200 dark:text-gray-800 mb-3" />
          <p className="text-gray-500 mb-5 text-sm">You haven't listed any venues yet.</p>
          <Link href="/owner/venues/new" className="px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl">List your first venue</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {venues.map((v: any) => {
          const rating = v.averageRating ? parseFloat(v.averageRating).toFixed(1) : null;
          return (
            <div key={v.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Status bar */}
              <div className={`h-1 ${v.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{v.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} />{v.city}, {v.state}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.isActive ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {v.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm mb-4">
                  <span className="font-black text-brand-600 dark:text-brand-400">₹{v.pricePerHour}<span className="text-xs font-normal text-gray-400">/hr</span></span>
                  {rating && (
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-semibold text-xs">
                      <Star size={11} className="fill-amber-400 text-amber-400" />{rating}
                      <span className="text-gray-400 font-normal">({v.reviewCount})</span>
                    </span>
                  )}
                  {v.sports?.length > 0 && (
                    <span className="text-xs text-gray-400">{v.sports.map((s: any) => s.name).join(', ')}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/venues/${v.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Eye size={13} /> View
                  </Link>
                  <Link
                    href={`/owner/venues/${v.id}/edit`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:bg-brand-100 transition-colors"
                  >
                    <Edit size={13} /> Edit
                  </Link>
                  <button
                    onClick={() => toggle.mutate({ id: v.id, isActive: !v.isActive })}
                    disabled={toggle.isPending}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {v.isActive
                      ? <><ToggleRight size={15} className="text-green-500" /> Deactivate</>
                      : <><ToggleLeft size={15} className="text-gray-400" /> Activate</>
                    }
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
