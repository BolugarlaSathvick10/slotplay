/**
 * components/ui/EmptyState.tsx — reusable empty and error states
 */

'use client';

import Link from 'next/link';
import { LucideIcon, Inbox, AlertCircle, WifiOff, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">{description}</p>}
      {action && (
        action.href ? (
          <Link href={action.href} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">Something went wrong</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">{message ?? 'An unexpected error occurred. Please try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl transition-colors hover:opacity-90">
          Try again
        </button>
      )}
    </div>
  );
}

export function NoResultsState({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try adjusting your search or filters to find what you're looking for."
      action={onClear ? { label: 'Clear filters', onClick: onClear } : undefined}
    />
  );
}

export function OfflineState() {
  return (
    <EmptyState
      icon={WifiOff}
      title="You're offline"
      description="Check your internet connection and try again."
    />
  );
}
