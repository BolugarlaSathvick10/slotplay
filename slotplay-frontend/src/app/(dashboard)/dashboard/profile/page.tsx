/**
 * app/(dashboard)/dashboard/profile/page.tsx
 *
 * Edit profile: name, phone, avatar initial display.
 * Uses PUT /api/auth/me.
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Phone, Mail, Shield, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, hydrate } = useAuth();

  const [name, setName]   = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  // Change password state
  const [showPw, setShowPw]       = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw]   = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/auth/me', { name: name.trim(), phone: phone.trim() || undefined });
      await hydrate();
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8)    { toast.error('Password must be at least 8 characters'); return; }
    setSavingPw(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPw(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-7">My Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-black shadow-sm">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 capitalize">
            {user?.roleId === 2 ? 'Venue Owner' : user?.roleId === 3 ? 'Admin' : 'Player'}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={saveProfile} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-5 space-y-5">
        <h2 className="font-bold text-gray-900 dark:text-white">Personal info</h2>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Full name
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Email (cannot be changed)
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Phone number
          </label>
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {/* Change password */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-gray-400" />
            <h2 className="font-bold text-gray-900 dark:text-white">Security</h2>
          </div>
          <button
            onClick={() => setShowPw(!showPw)}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            {showPw ? 'Cancel' : 'Change password'}
          </button>
        </div>

        {!showPw && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Password last changed — keep your account secure.
          </p>
        )}

        {showPw && (
          <form onSubmit={savePassword} className="space-y-4">
            {[
              { label: 'Current password', value: currentPw, set: setCurrentPw },
              { label: 'New password',     value: newPw,     set: setNewPw },
              { label: 'Confirm new password', value: confirmPw, set: setConfirmPw },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={e => set(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={savingPw}
              className="px-5 py-2.5 bg-gray-900 dark:bg-white hover:opacity-90 text-white dark:text-gray-900 text-sm font-bold rounded-xl transition-opacity"
            >
              {savingPw ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
