/**
 * app/(dashboard)/owner/slots/page.tsx
 *
 * Owner: generate slot templates for a venue on a date range.
 * Calls POST /api/owner/slots/generate.
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Clock, PlusCircle, CheckCircle, Trash2 } from 'lucide-react';

function useOwnerVenues() {
  return useQuery({
    queryKey: ['owner-venues'],
    queryFn: async () => { const { data } = await api.get('/api/owner/venues'); return data.data as any[]; },
  });
}

export default function ManageSlotsPage() {
  const { data: venues = [] } = useOwnerVenues();
  const [venueId, setVenueId]       = useState('');
  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');
  const [openHour, setOpenHour]     = useState(6);
  const [closeHour, setCloseHour]   = useState(22);
  const [slotDuration, setSlotDuration] = useState(60);
  const [priceOverride, setPriceOverride] = useState('');
  const [generated, setGenerated]   = useState<any[]>([]);

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
    onSuccess: (data) => { setGenerated(data); toast.success(`Generated ${data.length} slots!`); },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to generate slots'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId || !fromDate || !toDate) { toast.error('Select venue and date range'); return; }
    generate.mutate();
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-1">Manage Slots</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">Generate hourly slots for your venues in bulk.</p>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5 mb-6">

        {/* Venue select */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Venue *</label>
          <select
            value={venueId}
            onChange={e => setVenueId(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select a venue</option>
            {venues.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">From date *</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">To date *</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} required
              min={fromDate || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Operating hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Opens at</label>
            <select value={openHour} onChange={e => setOpenHour(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {Array.from({ length: 18 }, (_, i) => i + 4).map(h => (
                <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Closes at</label>
            <select value={closeHour} onChange={e => setCloseHour(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {Array.from({ length: 20 }, (_, i) => i + 6).map(h => (
                <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
          </div>
        </div>

        {/* Slot duration + price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Slot duration</label>
            <select value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={30}>30 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price/hr override</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input type="number" value={priceOverride} onChange={e => setPriceOverride(e.target.value)}
                placeholder="Default from venue"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Preview count */}
        {fromDate && toDate && openHour < closeHour && (
          <div className="p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl text-sm text-brand-700 dark:text-brand-400">
            <Clock size={13} className="inline mr-1" />
            Will generate ~{Math.ceil((closeHour - openHour) * 60 / slotDuration)} slots/day × {
              Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1
            } days
          </div>
        )}

        <button
          type="submit"
          disabled={generate.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold rounded-xl transition-colors"
        >
          <PlusCircle size={16} />
          {generate.isPending ? 'Generating…' : 'Generate slots'}
        </button>
      </form>

      {/* Generated preview */}
      {generated.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-green-600" />
            <p className="font-bold text-gray-900 dark:text-white">{generated.length} slots created</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {generated.slice(0, 24).map((s: any) => (
              <div key={s.id} className="text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5 text-gray-600 dark:text-gray-400 font-mono">
                {new Date(s.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {' '}
                {new Date(s.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            ))}
            {generated.length > 24 && (
              <div className="text-xs text-gray-400 px-2 py-1.5">+{generated.length - 24} more…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
