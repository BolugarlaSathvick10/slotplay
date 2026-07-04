/**
 * components/layout/Footer.tsx
 */

import Link from 'next/link';
import { MapPin, Twitter, Instagram, Youtube } from 'lucide-react';

const SPORTS = ['Cricket', 'Football', 'Badminton', 'Basketball', 'Tennis'];
const CITIES  = ['Hyderabad', 'Bangalore', 'Chennai', 'Mumbai', 'Pune'];

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">SP</span>
              </div>
              <span className="font-black text-white tracking-tight text-lg">
                Slot<span className="text-brand-500">Play</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              Reserve your game in seconds. Real-time slot booking for sports venues across India.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Browse by Sport */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Browse by Sport</h4>
            <ul className="space-y-2.5">
              {SPORTS.map(s => (
                <li key={s}>
                  <Link href={`/venues?search=${s.toLowerCase()}`} className="text-sm hover:text-white transition-colors">
                    {s} venues
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Browse by City */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Browse by City</h4>
            <ul className="space-y-2.5">
              {CITIES.map(c => (
                <li key={c}>
                  <Link href={`/venues?city=${c.toLowerCase()}`} className="text-sm hover:text-white transition-colors">
                    <MapPin size={12} className="inline mr-1 opacity-60" />
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2.5">
              {['About us', 'Careers', 'List your venue', 'Help center', 'Privacy policy', 'Terms of service'].map(l => (
                <li key={l}>
                  <Link href="#" className="text-sm hover:text-white transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs">© {new Date().getFullYear()} SlotPlay Technologies Pvt Ltd. All rights reserved.</p>
          <p className="text-xs flex items-center gap-1">
            Made with <span className="text-red-500">♥</span> for Indian sports
          </p>
        </div>
      </div>
    </footer>
  );
}
