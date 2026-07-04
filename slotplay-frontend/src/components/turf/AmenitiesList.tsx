/**
 * components/turf/AmenitiesList.tsx
 */

'use client';

import { Wifi, ParkingCircle, Droplets, Zap, ShowerHead, Coffee, Car, Shield, Sun, Wind } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  wifi: Wifi, parking: ParkingCircle, water: Droplets, floodlights: Zap,
  showers: ShowerHead, cafeteria: Coffee, 'changing rooms': Car,
  security: Shield, 'natural turf': Sun, 'air conditioning': Wind,
};

function getIcon(name: string) {
  const key = name.toLowerCase();
  for (const [k, Icon] of Object.entries(ICON_MAP)) {
    if (key.includes(k)) return Icon;
  }
  return Zap; // fallback
}

export function AmenitiesList({ amenities }: { amenities: any[] }) {
  if (!amenities?.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {amenities.map((a: any) => {
        const Icon = getIcon(a.name);
        return (
          <div
            key={a.id}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className="text-brand-600 dark:text-brand-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.name}</span>
          </div>
        );
      })}
    </div>
  );
}
