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
import { MapPin, PlusSquare, Edit, ToggleLeft, ToggleRight, Star, Eye, Camera, Calendar } from 'lucide-react';
import Image from 'next/image';

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%2316a34a'/%3E%3Crect x='200' y='100' width='400' height='250' rx='8' fill='%2315803d'/%3E%3Ccircle cx='400' cy='225' r='60' fill='none' stroke='%2386efac' stroke-width='4'/%3E%3Cline x1='200' y1='225' x2='600' y2='225' stroke='%2386efac' stroke-width='3'/%3E%3Ctext x='400' y='390' font-family='Arial' font-size='24' fill='%2386efac' text-anchor='middle'%3ESlotPlay%3C/text%3E%3C/svg%3E";

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owner-venues'] }); toast.success('Venue status updated'); },
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
          const imgUrl = v.images?.[0]?.url || v.previewImage || PLACEHOLDER_IMAGE;
          return (
            <div key={v.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              {/* Status bar */}
              <div className={`h-1.5 ${v.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`} />

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex gap-3 mb-3">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                    <Image
                      src={imgUrl}
                      alt={v.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{v.name}</h3>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${v.isActive ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} />{v.city}, {v.state}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-sm mb-4">
                  <span className="font-black text-brand-600 dark:text-brand-400">₹{v.pricePerHour}<span className="text-xs font-normal text-gray-400">/hr</span></span>
                  {rating && (
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-semibold text-xs">
                      <Star size={11} className="fill-amber-400 text-amber-400" />{rating}
                      <span className="text-gray-400 font-normal">({v.reviewCount})</span>
                    </span>
                  )}
                  {v.sports?.length > 0 && (
                    <span className="text-xs text-gray-400 truncate">{v.sports.map((s: any) => s.name).join(', ')}</span>
                  )}
                </div>

                {/* Actions Grid */}
                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/owner/slots?venueId=${v.id}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <Calendar size={13} /> Slots
                  </Link>
                  <Link
                    href={`/owner/venues/${v.id}/images`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors"
                  >
                    <Camera size={13} /> Photos
                  </Link>
                  <Link
                    href={`/owner/venues/${v.id}/edit`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-bold hover:bg-brand-100 transition-colors"
                  >
                    <Edit size={13} /> Edit
                  </Link>
                  <Link
                    href={`/venues/${v.id}`}
                    target="_blank"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Eye size={13} /> View
                  </Link>
                  <button
                    onClick={() => toggle.mutate({ id: v.id, isActive: !v.isActive })}
                    disabled={toggle.isPending}
                    className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={v.isActive ? 'Deactivate venue' : 'Activate venue'}
                  >
                    {v.isActive
                      ? <ToggleRight size={16} className="text-green-500" />
                      : <ToggleLeft size={16} className="text-gray-400" />
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
