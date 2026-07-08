import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table-row' | 'stat-card' | 'chart' | 'node-circle' | 'badge';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const base = 'animate-shimmer rounded bg-gradient-to-r from-[var(--skeleton-from)] via-[var(--skeleton-via)] to-[var(--skeleton-to)] bg-[length:200%_100%]';

  const variants: Record<string, string> = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'h-32 w-full rounded-2xl',
    'table-row': 'h-10 w-full rounded-lg',
    'stat-card': 'h-[120px] w-full rounded-2xl',
    chart: 'h-64 w-full rounded-xl',
    'node-circle': 'h-12 w-12 rounded-full',
    badge: 'h-5 w-14 rounded-full',
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="text" className="w-24 h-3" />
      <Skeleton variant="rectangular" className="w-8 h-8 rounded-lg" />
    </div>
    <Skeleton variant="text" className="w-32 h-8 mb-2" />
    <Skeleton variant="text" className="w-20 h-3" />
  </div>
);

export const StatsGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6"
        style={{ animationDelay: `${i * 0.05}s` }}
      >
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="rectangular" className="w-8 h-8 rounded-lg" />
        </div>
        <Skeleton variant="text" className="w-28 h-8 mb-2" />
        <Skeleton variant="text" className="w-16 h-3" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-2">
        <Skeleton variant="rectangular" className="w-4 h-4 rounded" />
        <Skeleton variant="text" className="w-32 h-4" />
      </div>
      <Skeleton variant="badge" />
    </div>
    <Skeleton variant="chart" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 py-4 border-b border-[var(--border)]">
    <Skeleton variant="text" className="w-16 h-4" />
    <Skeleton variant="text" className="w-24 h-4" />
    <Skeleton variant="text" className="w-24 h-4" />
    <Skeleton variant="text" className="w-16 h-4" />
    <Skeleton variant="text" className="w-12 h-4" />
    <Skeleton variant="text" className="w-20 h-4" />
    <Skeleton variant="rectangular" className="w-14 h-6 rounded-full" />
    <Skeleton variant="rectangular" className="w-16 h-6 rounded-lg ml-auto" />
  </div>
);

export const NodeGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
        style={{ animationDelay: `${i * 0.04}s` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Skeleton variant="node-circle" />
          <div className="flex-1">
            <Skeleton variant="text" className="w-24 h-3 mb-1" />
            <Skeleton variant="badge" className="w-16 h-4" />
          </div>
        </div>
        <Skeleton variant="text" className="w-32 h-3 mb-3" />
        <div className="flex gap-1">
          <Skeleton variant="badge" className="w-20 h-5" />
          <Skeleton variant="badge" className="w-20 h-5" />
        </div>
      </div>
    ))}
  </div>
);
