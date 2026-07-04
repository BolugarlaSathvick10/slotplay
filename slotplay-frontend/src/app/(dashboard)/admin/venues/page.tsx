/**
 * app/(dashboard)/admin/venues/page.tsx — Admin venue management
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin, Search, ToggleLeft, ToggleRight, Eye, Star } from 'lucide-react';

function useAdminVenues(page: number, search: string) {
  return useQuery({
    queryKey: ['admin-venues', page, search],
    queryFn: async () => {
      const { data } = await api.get('/api/venues', { params: { page, limit: 20, search: search || undefined } });
      return data.data;
    },
  });
}

export default function AdminVenuesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useAdminVenues(page, search);
  const venues     = data?.data      ?? [];
  const pagination = data?.pagination;

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/api/admin/venues/${id}`, { isActive });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-venues'] }); toast.success('Venue updated'); },
    onError: () => toast.error('Failed to update venue'),
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-7">All Venues</h1>

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search venues…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
        />
      </div>

      {isLoading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>}

      {venues.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {venues.map((v: any, i: number) => {
            const rating = v.averageRating ? parseFloat(v.averageRating).toFixed(1) : null;
            return (
              <div key={v.id} className={`flex items-center gap-4 px-5 py-4 ${i < venues.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${v.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{v.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={10} />{v.city}, {v.state}
                    {rating && <><span className="mx-1">·</span><Star size={10} className="fill-amber-400 text-amber-400" />{rating}</>}
                  </p>
                </div>
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400 flex-shrink-0">₹{v.pricePerHour}/hr</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/venues/${v.id}`} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors"><Eye size={15} /></Link>
                  <button
                    onClick={() => toggleActive.mutate({ id: v.id, isActive: !v.isActive })}
                    className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors"
                    title={v.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {v.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Prev</button>
          <span className="px-3 py-2 text-sm text-gray-500">{page} / {pagination.pages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= pagination.pages} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
