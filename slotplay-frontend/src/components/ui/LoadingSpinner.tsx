'use client';
export function LoadingSpinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-12 h-12 border-3' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-brand-500 border-t-transparent rounded-full animate-spin`} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" label="Loading…" />
    </div>
  );
}
