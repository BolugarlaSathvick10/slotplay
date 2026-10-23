/**
 * app/(dashboard)/owner/venues/[id]/edit/page.tsx
 *
 * Owner: Edit venue details, pricing, sports, amenities, and status.
 * Provides direct links to manage photos and slots.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useVenueDetail, useSports, useAmenities } from '@/hooks/useVenue';
import {
  ChevronLeft,
  Save,
  Camera,
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

interface FormState {
  name: string;
  description: string;
  pricePerHour: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isActive: boolean;
  sportIds: number[];
  amenityIds: number[];
}

export default function EditVenuePage({ params }: { params: { id: string } }) {
  const venueId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: venue, isLoading: isVenueLoading, error: venueError } = useVenueDetail(venueId);
  const { data: sports = [] } = useSports();
  const { data: amenities = [] } = useAmenities();

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    pricePerHour: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isActive: true,
    sportIds: [],
    amenityIds: [],
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Pre-populate form once venue data loads
  useEffect(() => {
    if (venue && !isInitialized) {
      setForm({
        name: venue.name || '',
        description: venue.description || '',
        pricePerHour: venue.pricePerHour ? String(venue.pricePerHour) : '',
        phone: venue.phone || '',
        address: venue.address || '',
        city: venue.city || '',
        state: venue.state || '',
        pincode: venue.pincode || '',
        isActive: venue.isActive ?? venue.status === 'active',
        sportIds: Array.isArray(venue.sports) ? venue.sports.map((s: any) => s.id) : [],
        amenityIds: Array.isArray(venue.amenities) ? venue.amenities.map((a: any) => a.id) : [],
      });
      setIsInitialized(true);
    }
  }, [venue, isInitialized]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        pricePerHour: parseFloat(form.pricePerHour),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        isActive: form.isActive,
        sportIds: form.sportIds,
        amenityIds: form.amenityIds,
      };

      const { data } = await api.put(`/api/venues/${venueId}`, payload);
      return data.data;
    },
    onSuccess: () => {
      toast.success('Venue details updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['venue-detail', venueId] });
      queryClient.invalidateQueries({ queryKey: ['owner-venues'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update venue');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.name.length < 3) {
      toast.error('Venue name must be at least 3 characters');
      return;
    }
    const price = parseFloat(form.pricePerHour);
    if (isNaN(price) || price < 100) {
      toast.error('Price per hour must be at least ₹100');
      return;
    }
    if (form.phone && form.phone.length !== 10) {
      toast.error('Contact phone must be 10 digits');
      return;
    }
    updateMutation.mutate();
  };

  const toggleSport = (sportId: number) => {
    setForm((prev) => ({
      ...prev,
      sportIds: prev.sportIds.includes(sportId)
        ? prev.sportIds.filter((id) => id !== sportId)
        : [...prev.sportIds, sportId],
    }));
  };

  const toggleAmenity = (amenityId: number) => {
    setForm((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(amenityId)
        ? prev.amenityIds.filter((id) => id !== amenityId)
        : [...prev.amenityIds, amenityId],
    }));
  };

  if (isVenueLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-48" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (venueError || !venue) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Venue Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">This venue may have been removed or you don't have permission to edit it.</p>
        <Link
          href="/owner/venues"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold"
        >
          <ChevronLeft size={16} /> Back to My Venues
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <Link
            href="/owner/venues"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            title="Back to Venues"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Edit Venue</h1>
            <p className="text-xs text-gray-500 mt-0.5">{venue.name}</p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/owner/venues/${venueId}/images`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <Camera size={14} /> Photos ({venue.images?.length || 0})
          </Link>
          <Link
            href={`/owner/slots?venueId=${venueId}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <Calendar size={14} /> Manage Slots
          </Link>
          <Link
            href={`/venues/${venueId}`}
            target="_blank"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ExternalLink size={13} /> View Public
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-brand-600" /> Basic Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Venue Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={3}
                maxLength={120}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                maxLength={1000}
                placeholder="Highlight turf features, pitch type, floodlights, etc."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {/* Sports selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Sports Supported *
              </label>
              <div className="flex flex-wrap gap-2">
                {sports.map((s: any) => {
                  const isChecked = form.sportIds.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSport(s.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        isChecked
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-300'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Contact */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-brand-600" /> Pricing & Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Price Per Hour (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  value={form.pricePerHour}
                  onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
                  required
                  min={100}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          {/* Active status switch */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Venue Status</p>
              <p className="text-xs text-gray-500">
                {form.isActive
                  ? 'Venue is active and bookable by players.'
                  : 'Venue is hidden/suspended from public listings.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                form.isActive
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
            >
              {form.isActive ? (
                <>
                  <ToggleRight size={18} className="text-green-600" /> Active
                </>
              ) : (
                <>
                  <ToggleLeft size={18} className="text-gray-400" /> Suspended
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 3: Location */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-brand-600" /> Location Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  value={form.pincode}
                  maxLength={6}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Amenities */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <CheckCircle size={16} className="text-brand-600" /> Amenities
          </h2>
          <p className="text-xs text-gray-500 mb-4">Select all facilities available at your venue.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {amenities.map((a: any) => {
              const isChecked = form.amenityIds.includes(a.id);
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => toggleAmenity(a.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    isChecked
                      ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                      isChecked
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isChecked ? '✓' : ''}
                  </div>
                  <span className="truncate">{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            href="/owner/venues"
            className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-bold shadow-md transition-colors"
          >
            <Save size={16} />
            {updateMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
