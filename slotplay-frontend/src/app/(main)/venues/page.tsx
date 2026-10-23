 'use client';

/**
 * app/(main)/venues/page.tsx — Browse Turfs
 *
 * Full listing with sidebar filters, grid/list toggle, search, sport chips, and pagination.
 */

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X, MapPin, LayoutGrid, List } from 'lucide-react';
import { useVenueList, useSports } from '@/hooks/useVenue';
import { VenueCard } from '@/components/venue/VenueCard';

/* ── Filter sidebar ── */
function FilterSidebar({
  sports,
  filters,
  onChange,
}: {
  sports: any[];
  filters: any;
  onChange: (k: string, v: any) => void;
}) {
  return (
    <aside className="space-y-6">
      {/* Sport */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Sport</p>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="sport"
              value=""
              checked={!filters.sportId}
              onChange={() => onChange('sportId', '')}
              className="accent-brand-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">All sports</span>
          </label>
          {sports.map((s: any) => (
            <label key={s.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="sport"
                value={s.id}
                checked={filters.sportId === String(s.id)}
                onChange={() => onChange('sportId', String(s.id))}
                className="accent-brand-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
          Max price: ₹{filters.maxPrice}/hr
        </p>
        <input
          type="range"
          min={100}
          max={5000}
          step={100}
          value={filters.maxPrice}
          onChange={e => onChange('maxPrice', Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>₹100</span><span>₹5,000</span>
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Sort by</p>
        {[
          { value: 'rating', label: 'Top rated' },
          { value: 'price',  label: 'Price: low to high' },
          { value: 'newest', label: 'Newest first' },
        ].map(o => (
          <label key={o.value} className="flex items-center gap-2.5 cursor-pointer mb-1.5">
            <input
              type="radio"
              name="sortBy"
              value={o.value}
              checked={filters.sortBy === o.value}
              onChange={() => onChange('sortBy', o.value)}
              className="accent-brand-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{o.label}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}

/* ── Main content ── */
function VenuesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: sports = [] } = useSports();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    sportId: searchParams.get('sportId') || '',
    sortBy: 'rating',
    maxPrice: 5000,
    city: searchParams.get('city') || '',
  });

  const setFilter = (k: string, v: any) => {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
  };

  const { data: venueData, isLoading, error, refetch } = useVenueList({
    page,
    limit: 8,
    search: search || undefined,
    city: filters.city || undefined,
    sportId: filters.sportId ? Number(filters.sportId) : undefined,
    sortBy: filters.sortBy as any,
  });

  const venues = (venueData?.data || []).filter((v: any) => v.pricePerHour <= filters.maxPrice);
  const pagination = venueData?.pagination;

  const activeCount = [filters.sportId, filters.city, filters.maxPrice < 5000].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
          Browse Turfs
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {isLoading ? 'Finding venues…' : `${venues.length} venues available`}
          {filters.city && <span> in <strong>{filters.city}</strong></span>}
        </p>
      </div>

      {/* Search + toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(inputValue); setPage(1); } }}
            placeholder="Search venues, areas…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
          />
        </div>

        {/* City input */}
        <div className="relative sm:w-48">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={filters.city}
            onChange={e => setFilter('city', e.target.value)}
            placeholder="City"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors flex-shrink-0 ${
            showFilters || activeCount
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeCount > 0 && (
            <span className="w-4 h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* View mode */}
        <div className="hidden sm:flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
          {(['grid', 'list'] as const).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`p-2.5 transition-colors ${viewMode === m ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {m === 'grid' ? <LayoutGrid size={16} /> : <List size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* Sport quick-chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('sportId', '')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            !filters.sportId
              ? 'bg-brand-600 text-white border-brand-600'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'
          }`}
        >
          All
        </button>
        {(sports as any[]).map((s: any) => (
          <button
            key={s.id}
            onClick={() => setFilter('sportId', String(s.id))}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filters.sportId === String(s.id)
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        {showFilters && (
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-gray-900 dark:text-white text-sm">Filters</p>
                <button
                  onClick={() => { setFilters({ sportId: '', sortBy: 'rating', maxPrice: 5000, city: '' }); setPage(1); }}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Clear all
                </button>
              </div>
              <FilterSidebar sports={sports as any[]} filters={filters} onChange={setFilter} />
            </div>
          </div>
        )}

        {/* Mobile filter drawer */}
        {showFilters && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-t-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-gray-900 dark:text-white">Filters</p>
              <button onClick={() => setShowFilters(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <FilterSidebar sports={sports as any[]} filters={filters} onChange={setFilter} />
            <button
              onClick={() => setShowFilters(false)}
              className="mt-6 w-full py-3 bg-brand-600 text-white font-bold rounded-xl"
            >
              Show results
            </button>
          </div>
        )}

        {/* Venue grid */}
        <div className="flex-1 min-w-0">
          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="py-20 text-center">
              <p className="text-red-600 dark:text-red-400 font-semibold mb-3">Failed to load venues. Try again.</p>
              <button
                onClick={() => refetch()}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                Retry Loading Venues
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && venues.length === 0 && (
            <div className="py-24 text-center">
              <MapPin size={48} className="mx-auto text-gray-200 dark:text-gray-800 mb-4" />
              <p className="text-gray-900 dark:text-white font-bold mb-2">No venues found</p>
              <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or expanding your search area.</p>
              <button
                onClick={() => { setFilters({ sportId: '', sortBy: 'rating', maxPrice: 5000, city: '' }); setInputValue(''); setSearch(''); }}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && venues.length > 0 && (
            <>
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'space-y-4'
              }>
                {venues.map((v: any) => (
                  <VenueCard key={v.id} venue={v} listMode={viewMode === 'list'} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:border-brand-400 transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                        n === page
                          ? 'bg-brand-600 text-white'
                          : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= pagination.pages}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:border-brand-400 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense>
      <VenuesContent />
    </Suspense>
  );
}
