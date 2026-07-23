/**
 * app/(dashboard)/owner/venues/new/page.tsx
 *
 * Owner: create a new venue.
 * Multi-step form: Basic info → Location → Sports & Amenities → Pricing → Done.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSports, useAmenities } from '@/hooks/useVenue';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, MapPin, Tag, Dumbbell, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = ['Basic info', 'Location', 'Sports & Amenities', 'Pricing'];

interface FormData {
  name: string; description: string;
  address: string; city: string; state: string; pincode: string;
  latitude: string; longitude: string;
  phone: string;
  sportIds: number[]; amenityIds: number[];
  pricePerHour: string;
}

const EMPTY: FormData = {
  name: '', description: '',
  address: '', city: '', state: '', pincode: '',
  latitude: '', longitude: '',
  phone: '',
  sportIds: [], amenityIds: [],
  pricePerHour: '',
};

export default function NewVenuePage() {
  const router = useRouter();
  const { data: sports  = [] } = useSports();
  const { data: amenities = [] } = useAmenities();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);

  const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleId = (key: 'sportIds' | 'amenityIds', id: number) => {
    set(key, form[key].includes(id) ? form[key].filter(x => x !== id) : [...form[key], id]);
  };

  const createVenue = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/venues', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        pricePerHour: parseFloat(form.pricePerHour),
      });
      return data.data;
    },
    onSuccess: (venue) => {
      toast.success('Venue created!');
      router.push(`/owner/venues`);
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to create venue'),
  });

  const isStepValid = () => {
    if (step === 0) return form.name.length >= 3;
    if (step === 1) return form.address && form.city && form.state && form.pincode && form.latitude && form.longitude;
    if (step === 2) return form.sportIds.length > 0;
    if (step === 3) return parseFloat(form.pricePerHour) >= 100 && form.phone.length === 10;
    return true;
  };

  const F = ({ label, value, onChange, placeholder, type = 'text', required = false }: any) => (
    <div>
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}{required && ' *'}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-7">
        <button onClick={() => router.push('/owner/venues')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Add New Venue</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black flex-shrink-0 transition-colors ${
              i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-5">{STEPS[step]}</h2>

        {/* Step 0: Basic info */}
        {step === 0 && (
          <div className="space-y-4">
            <F label="Venue name" value={form.name} onChange={(v: string) => set('name', v)} placeholder="e.g. Green Field Cricket Turf" required />
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe your venue, playing surface, etc."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-4">
            <F label="Address" value={form.address} onChange={(v: string) => set('address', v)} placeholder="Street address" required />
            <div className="grid grid-cols-2 gap-4">
              <F label="City" value={form.city} onChange={(v: string) => set('city', v)} placeholder="Hyderabad" required />
              <F label="State" value={form.state} onChange={(v: string) => set('state', v)} placeholder="Telangana" required />
            </div>
            <F label="Pincode" value={form.pincode} onChange={(v: string) => set('pincode', v)} placeholder="500001" required />
            <div className="grid grid-cols-2 gap-4">
              <F label="Latitude" value={form.latitude} onChange={(v: string) => set('latitude', v)} placeholder="17.3850" type="number" required />
              <F label="Longitude" value={form.longitude} onChange={(v: string) => set('longitude', v)} placeholder="78.4867" type="number" required />
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin size={11} /> Open Google Maps, right-click your venue location → copy coordinates
            </p>
          </div>
        )}

        {/* Step 2: Sports & Amenities */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sports offered *</p>
              <div className="grid grid-cols-2 gap-2">
                {(sports as any[]).map((s: any) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleId('sportIds', s.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.sportIds.includes(s.id)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                    }`}
                  >
                    {form.sportIds.includes(s.id) && <CheckCircle size={14} className="text-brand-600 flex-shrink-0" />}
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Amenities</p>
              <div className="grid grid-cols-2 gap-2">
                {(amenities as any[]).map((a: any) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleId('amenityIds', a.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.amenityIds.includes(a.id)
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {form.amenityIds.includes(a.id) && <CheckCircle size={13} className="text-green-600 flex-shrink-0" />}
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price per hour (₹) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  value={form.pricePerHour}
                  onChange={e => set('pricePerHour', e.target.value)}
                  placeholder="500"
                  min={100}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <F label="Contact phone" value={form.phone} onChange={(v: string) => set('phone', v)} placeholder="10-digit mobile" required />

            {/* Summary card */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm space-y-2">
              <p className="font-bold text-gray-900 dark:text-white mb-2">Summary</p>
              <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400">Name</span> {form.name}</p>
              <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400">City</span> {form.city}, {form.state}</p>
              <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400">Sports</span> {form.sportIds.length} selected</p>
              <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400">Price</span> ₹{form.pricePerHour}/hr</p>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-7">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={15} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!isStepValid()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => createVenue.mutate()}
              disabled={!isStepValid() || createVenue.isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {createVenue.isPending ? 'Creating…' : 'Create venue ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
