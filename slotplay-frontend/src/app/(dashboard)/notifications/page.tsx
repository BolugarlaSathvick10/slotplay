/**
 * app/(dashboard)/notifications/page.tsx
 *
 * Full notification center: history, read/unread, filter by type, delete.
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Bell, CheckCheck, Trash2, Filter,
  CheckCircle, XCircle, Clock, AlertCircle,
} from 'lucide-react';

type NotifType = 'all' | 'booking_confirmed' | 'payment_submitted' | 'payment_rejected';

const TYPE_CONFIG = {
  booking_confirmed: { label: 'Booking confirmed', icon: CheckCircle, dot: 'bg-green-500', iconColor: 'text-green-600' },
  payment_submitted: { label: 'Payment submitted', icon: Clock, dot: 'bg-yellow-500', iconColor: 'text-yellow-600' },
  payment_rejected:  { label: 'Payment rejected',  icon: XCircle,  dot: 'bg-red-500',    iconColor: 'text-red-600' },
  default:           { label: 'Notification',       icon: Bell,     dot: 'bg-gray-400',   iconColor: 'text-gray-500' },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
}

interface NotificationPageData {
  data: NotificationItem[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

function useNotifs(page: number, type: NotifType) {
  return useQuery({
    queryKey: ['notifs-center', page, type],
    queryFn: async (): Promise<NotificationPageData> => {
      const params: any = { page, limit: 20 };
      if (type !== 'all') params.type = type;
      const res = await api.get('/api/notifications', { params });
      const payload = res.data?.data ?? res.data;
      const items: NotificationItem[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      const totalPages = payload?.pages ?? payload?.pagination?.pages ?? (items.length > 0 ? 1 : 0);
      const totalCount = payload?.total ?? payload?.pagination?.total ?? items.length;

      return {
        data: items,
        page: payload?.page ?? page,
        limit: payload?.limit ?? 20,
        total: totalCount,
        pages: totalPages,
      };
    },
    refetchInterval: 30_000,
  });
}

export default function NotificationCenterPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<NotifType>('all');
  const qc = useQueryClient();

  const { data, isLoading } = useNotifs(page, type);
  const notifs = data?.data ?? [];

  const markAll = useMutation({
    mutationFn: () => api.post('/api/notifications/read-all'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifs-center'] }); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifs-center'] }); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const deleteOne = useMutation({
    mutationFn: (id: string) => api.delete(`/api/notifications/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifs-center'] }); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const unread = notifs.filter(n => !(n.isRead ?? n.read)).length;

  const TABS: { label: string; value: NotifType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Bookings', value: 'booking_confirmed' },
    { label: 'Payments', value: 'payment_submitted' },
    { label: 'Rejected', value: 'payment_rejected' },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Notifications</h1>
          {unread > 0 && <p className="text-sm text-gray-500 mt-0.5">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
          >
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setType(t.value); setPage(1); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              type === t.value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && notifs.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-20 text-center">
          <Bell size={36} className="mx-auto text-gray-200 dark:text-gray-800 mb-3" />
          <p className="text-gray-500 text-sm">No notifications{type !== 'all' ? ' of this type' : ''} yet.</p>
        </div>
      )}

      {/* Notification list */}
      {!isLoading && notifs.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {notifs.map((n: any) => {
            const cfg = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.default;
            const Icon = cfg.icon;
            const isRead = Boolean(n.isRead ?? n.read);
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-5 py-4 transition-colors ${
                  !isRead ? 'bg-brand-50/40 dark:bg-brand-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.iconColor}`}>
                  <Icon size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {!isRead && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />}
                    <p className={`text-sm font-semibold ${!isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {n.title}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{relativeTime(n.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!isRead && (
                    <button
                      onClick={() => markOne.mutate(n.id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteOne.mutate(n.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Prev</button>
          <span className="px-3 py-2 text-sm text-gray-500">Page {page} / {data.pages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= data.pages} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
