import React from 'react';
import { Loader2 } from 'lucide-react';
import { CardSkeleton, TableRowSkeleton } from './Skeleton';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  variant?: 'spinner' | 'cards' | 'table';
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  fullScreen = false,
  variant = 'spinner',
}) => {
  if (variant === 'cards') {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <CardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
              <div className="h-4 w-32 rounded bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <TableRowSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)] transition-[background-color] duration-250'
    : 'flex min-h-[300px] w-full flex-col items-center justify-center text-[var(--text-primary)]';

  return (
    <div className={containerClasses} role="status" aria-label="Loading">
      <div className="flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
      </div>
      <p className="mt-4 font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase">
        {message}
      </p>
      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
};
