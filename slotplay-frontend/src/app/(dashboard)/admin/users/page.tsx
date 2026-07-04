/**
 * app/(dashboard)/admin/users/page.tsx — Admin user management
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Search, Shield, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

const ROLE_LABELS: Record<number, string> = { 1: 'Player', 2: 'Owner', 3: 'Admin' };
const ROLE_COLORS: Record<number, string> = {
  1: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  2: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400',
  3: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};

function useAdminUsers(page: number, search: string) {
  return useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/users', { params: { page, limit: 20, search: search || undefined } });
      return data.data;
    },
  });
}

export default function AdminUsersPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useAdminUsers(page, search);
  const users      = data?.data      ?? [];
  const pagination = data?.pagination;

  const changeRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
      await api.patch(`/api/admin/users/${userId}/role`, { roleId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Role updated'); },
    onError: () => toast.error('Failed to update role'),
  });

  const toggleVerified = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      await api.patch(`/api/admin/users/${userId}/verify`, { isVerified });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination?.total ?? 0} total users</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <Shield size={15} className="text-red-600 dark:text-red-400" />
          <span className="text-sm font-bold text-red-700 dark:text-red-400">Admin</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
        />
      </div>

      {isLoading && <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>}

      {!isLoading && users.length === 0 && (
        <div className="py-20 text-center">
          <Users size={36} className="mx-auto text-gray-200 dark:text-gray-800 mb-3" />
          <p className="text-gray-500 text-sm">No users found.</p>
        </div>
      )}

      {/* Users table */}
      {users.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {users.map((u: any, i: number) => (
            <div key={u.id} className={`flex items-center gap-4 px-5 py-4 ${i < users.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {u.name?.[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>

              {/* Verified badge */}
              <button
                onClick={() => toggleVerified.mutate({ userId: u.id, isVerified: !u.isVerified })}
                title={u.isVerified ? 'Click to unverify' : 'Click to verify'}
                className="flex-shrink-0"
              >
                {u.isVerified
                  ? <CheckCircle size={18} className="text-green-500 hover:text-green-600 transition-colors" />
                  : <XCircle size={18} className="text-gray-300 hover:text-red-400 transition-colors" />
                }
              </button>

              {/* Role selector */}
              <div className="flex-shrink-0 relative">
                <select
                  value={u.roleId}
                  onChange={e => changeRole.mutate({ userId: u.id, roleId: Number(e.target.value) })}
                  className={`text-xs font-bold pl-2.5 pr-6 py-1.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer ${ROLE_COLORS[u.roleId] ?? ROLE_COLORS[1]}`}
                >
                  {Object.entries(ROLE_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Prev</button>
          <span className="px-3 py-2 text-sm text-gray-500">Page {page} / {pagination.pages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= pagination.pages} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
