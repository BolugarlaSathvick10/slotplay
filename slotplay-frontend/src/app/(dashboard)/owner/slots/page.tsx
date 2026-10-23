/**
 * app/(dashboard)/owner/slots/page.tsx
 *
 * Owner: Manage and generate slots for venues.
 * Features:
 *  - Pre-select venue via ?venueId= query parameter
 *  - Live schedule viewer for selected venue & date
 *  - Bulk slot generator with time range and pricing overrides
 *  - Formatted slot preview without Invalid Date errors
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useVenueSlots } from '@/hooks/useVenue';
import { formatTime } from '@/lib/utils';
import {
  Clock,
  PlusCircle,
  CheckCircle,
  Calendar,
  Layers,
  MapPin,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Camera,
  Check,
  Lock,
} from 'lucide-react';

function useOwnerVenues() {
  return useQuery({
    queryKey: ['owner-venues'],
    queryFn: async () => {
      const { data } = await api.get('/api/owner/venues');
      return data.data as any[];
    },
  });
}

function getTodayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ManageSlotsContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const venueIdFromQuery = searchParams.get('venueId') || '';

  const { data: venues = [], isLoading: isVenuesLoading } = useOwnerVenues();

  const [venueId, setVenueId] = useState(venueIdFromQuery);
  const [activeTab, setActiveTab] = useState<'schedule' | 'generate'>('schedule');

  // Generator form state
  const [fromDate, setFromDate] = useState(getTodayLocalDate());
  const [toDate, setToDate] = useState(getTodayLocalDate());
  const [openHour, setOpenHour] = useState(6);
  const [closeHour, setCloseHour] = useState(22);
  const [slotDuration, setSlotDuration] = useState(60);
  const [priceOverride, setPriceOverride] = useState('');
  const [generated, setGenerated] = useState<any[]>([]);

  // Schedule viewer state
  const [selectedDateStr, setSelectedDateStr] = useState(getTodayLocalDate());

  // Set default venueId if none selected yet and venues load
  useEffect(() => {
    if (!venueId && venueIdFromQuery) {
      setVenueId(venueIdFromQuery);
    } else if (!venueId && venues.length > 0) {
      setVenueId(venues[0].id);
    }
  }, [venueId, venueIdFromQuery, venues]);

  const selectedVenue = venues.find((v: any) => v.id === venueId);

  // Live slots for selected venue and date
  const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
  const {
    data: existingSlots = [],
    isLoading: isSlotsLoading,
    isFetching: isSlotsFetching,
    refetch: refetchSlots,
  } = useVenueSlots(venueId, selectedDateObj);

  const todayMin = getTodayLocalDate();

  const generate = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/owner/slots/generate', {
        venueId,
        fromDate,
        toDate,
        openHour,
        closeHour,
        slotDurationMinutes: slotDuration,
        pricePerHour: priceOverride ? parseFloat(priceOverride) : undefined,
      });
      return data.data;
    },
    onSuccess: (data) => {
      setGenerated(data);
      toast.success(`Generated ${data.length} slots successfully!`);
      // Invalidate slots cache so schedule viewer reflects new slots
      queryClient.invalidateQueries({ queryKey: ['venue-slots', venueId] });
      refetchSlots();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Failed to generate slots');
    },
  });

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) {
      toast.error('Please select a venue');
      return;
    }
    if (!fromDate || !toDate) {
      toast.error('Please select from and to dates');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error('From date cannot be after To date');
      return;
    }
    generate.mutate();
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDateStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    setSelectedDateStr(`${yr}-${mo}-${da}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    setSelectedDateStr(`${yr}-${mo}-${da}`);
  };

  const availableSlotsCount = (existingSlots as any[]).filter((s) => s.isAvailable).length;
  const totalSlotsCount = (existingSlots as any[]).length;

  return (
    <div className="max-w-4xl pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Manage Slots</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            View daily schedules and generate slots in bulk for your venues.
          </p>
        </div>

        {selectedVenue && (
          <div className="flex items-center gap-2">
            <Link
              href={`/owner/venues/${selectedVenue.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit size={13} /> Edit Venue
            </Link>
            <Link
              href={`/owner/venues/${selectedVenue.id}/images`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors"
            >
              <Camera size={13} /> Photos
            </Link>
            <Link
              href={`/venues/${selectedVenue.id}`}
              target="_blank"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink size={13} /> Public
            </Link>
          </div>
        )}
      </div>

      {/* Venue Selector */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6 shadow-sm">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Select Venue *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Choose a venue --</option>
              {venues.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.city}) — ₹{v.pricePerHour}/hr
                </option>
              ))}
            </select>
          </div>

          {selectedVenue && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-600 dark:text-gray-300">
              <MapPin size={14} className="text-brand-600 flex-shrink-0" />
              <span className="truncate">{selectedVenue.address || selectedVenue.city}</span>
              <span className="ml-auto font-bold text-brand-600 dark:text-brand-400">
                ₹{selectedVenue.pricePerHour}/hr
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'schedule'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Calendar size={16} /> Schedule & Live Slots
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'generate'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <PlusCircle size={16} /> Bulk Generate Slots
        </button>
      </div>

      {/* TAB 1: Live Schedule Viewer */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            {/* Date navigation bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 mb-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevDay}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="relative">
                  <input
                    type="date"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <button
                  onClick={handleNextDay}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                  title="Next Day"
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => setSelectedDateStr(getTodayLocalDate())}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">
                  {totalSlotsCount > 0 ? (
                    <>
                      <strong className="text-green-600">{availableSlotsCount}</strong> open /{' '}
                      <strong>{totalSlotsCount}</strong> total
                    </>
                  ) : (
                    '0 slots'
                  )}
                </span>

                <button
                  onClick={() => refetchSlots()}
                  disabled={isSlotsFetching}
                  className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  title="Refresh Slots"
                >
                  <RefreshCw size={15} className={isSlotsFetching ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Slots Grid */}
            {!venueId ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Please select a venue above to view its slots schedule.</p>
              </div>
            ) : isSlotsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : totalSlotsCount === 0 ? (
              <div className="text-center py-12">
                <Lock size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  No slots found for this date
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Default slots generate on first player lookup, or you can generate custom slots now.
                </p>
                <button
                  onClick={() => {
                    setFromDate(selectedDateStr);
                    setToDate(selectedDateStr);
                    setActiveTab('generate');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors"
                >
                  <PlusCircle size={14} /> Generate Slots for this Date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(existingSlots as any[]).map((s: any) => {
                  const startTimeDisplay = s.startTime?.length <= 5 ? formatTime(s.startTime) : s.startTime;
                  const endTimeDisplay = s.endTime?.length <= 5 ? formatTime(s.endTime) : s.endTime;
                  const price = s.pricePerHour ?? s.price;
                  const isAvailable = s.isAvailable;

                  return (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isAvailable
                          ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-400 shadow-sm'
                          : 'border-red-100 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-gray-900 dark:text-white">
                          {startTimeDisplay} – {endTimeDisplay}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isAvailable
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {isAvailable ? 'Open' : s.bookingStatus ? s.bookingStatus.replace(/_/g, ' ') : 'Booked'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          ₹{price}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">
                          {s.startTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Bulk Slot Generator */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <form
            onSubmit={handleGenerateSubmit}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5 shadow-sm"
          >
            <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PlusCircle size={16} className="text-brand-600" /> Slot Generation Parameters
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Automatically create consistent time slots for multiple days in advance.
              </p>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  From Date *
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                  min={todayMin}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  To Date *
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                  min={fromDate || todayMin}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>
            </div>

            {/* Operating hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Opening Time
                </label>
                <select
                  value={openHour}
                  onChange={(e) => setOpenHour(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {Array.from({ length: 18 }, (_, i) => i + 4).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00 ({formatTime(`${String(h).padStart(2, '0')}:00`)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Closing Time
                </label>
                <select
                  value={closeHour}
                  onChange={(e) => setCloseHour(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 6).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00 ({formatTime(`${String(h).padStart(2, '0')}:00`)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Slot duration + price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Slot Duration
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour (Standard)</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Custom Price / Hour (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={priceOverride}
                    onChange={(e) => setPriceOverride(e.target.value)}
                    placeholder={
                      selectedVenue
                        ? `Default: ₹${selectedVenue.pricePerHour}`
                        : 'Default from venue'
                    }
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Estimation banner */}
            {fromDate && toDate && openHour < closeHour && (
              <div className="p-3.5 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl text-xs text-brand-700 dark:text-brand-300 flex items-center gap-2">
                <Clock size={15} className="flex-shrink-0" />
                <span>
                  Will generate approximately{' '}
                  <strong>{Math.ceil(((closeHour - openHour) * 60) / slotDuration)}</strong> slots/day across{' '}
                  <strong>
                    {Math.max(
                      1,
                      Math.ceil(
                        (new Date(toDate + 'T00:00:00').getTime() -
                          new Date(fromDate + 'T00:00:00').getTime()) /
                          86400000
                      ) + 1
                    )}
                  </strong>{' '}
                  day(s). Existing bookings remain safe.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={generate.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              <PlusCircle size={16} />
              {generate.isPending ? 'Generating Slots…' : 'Generate Slots Now'}
            </button>
          </form>

          {/* Generated preview */}
          {generated.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600" />
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {generated.length} slots successfully created / verified
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDateStr(fromDate);
                    setActiveTab('schedule');
                  }}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  View in Schedule →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {generated.slice(0, 32).map((s: any) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60 text-xs flex flex-col gap-0.5"
                  >
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {s.date
                        ? new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {s.startTime} – {s.endTime}
                    </span>
                    <span className="text-brand-600 dark:text-brand-400 font-semibold text-[11px]">
                      ₹{s.price}
                    </span>
                  </div>
                ))}
                {generated.length > 32 && (
                  <div className="col-span-2 sm:col-span-4 text-center py-2 text-xs text-gray-400">
                    +{generated.length - 32} more slots generated
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ManageSlotsPage() {
  return (
    <Suspense fallback={<div className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
      <ManageSlotsContent />
    </Suspense>
  );
}
