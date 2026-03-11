import React from 'react';

/* ── Base block ─────────────────────────────────────────────────────────────── */

interface SkeletonProps {
  className?: string;
}

/** Pulsing rectangle – use className to set w / h / rounded. */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-white/[0.06] rounded ${className}`} />
);

/* ── Composed skeletons ─────────────────────────────────────────────────────── */

/** A single "card" shaped skeleton with optional children or auto-content. */
export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`card animate-pulse ${className}`}>
    <Skeleton className="h-3 w-24 rounded mb-4" />
    <Skeleton className="h-7 w-20 rounded mb-4" />
    {Array.from({ length: lines - 1 }).map((_, i) => (
      <Skeleton key={i} className={`h-2.5 rounded mt-2 ${i === 0 ? 'w-full' : 'w-3/4'}`} />
    ))}
  </div>
);

/** Row of N stat cards (used by Home, UserManagement). */
export const SkeletonStatRow: React.FC<{ count?: number; cols?: string }> = ({
  count = 4,
  cols = 'md:grid-cols-4',
}) => (
  <div className={`grid grid-cols-1 ${cols} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-2.5 w-20 rounded" />
        </div>
        <Skeleton className="h-7 w-16 rounded" />
      </div>
    ))}
  </div>
);

/** Grid of content cards (karts, modules). */
export const SkeletonCardGrid: React.FC<{ count?: number; cols?: string }> = ({
  count = 4,
  cols = 'md:grid-cols-2 lg:grid-cols-4',
}) => (
  <div>
    <Skeleton className="h-2.5 w-32 rounded mb-4" />
    <div className={`grid grid-cols-1 ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="flex justify-between items-start mb-3">
            <div>
              <Skeleton className="h-3.5 w-24 rounded mb-1.5" />
              <Skeleton className="h-2.5 w-16 rounded" />
            </div>
            <Skeleton className="w-2 h-2 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-2.5 w-12 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-16 h-1.5 rounded-full" />
                <Skeleton className="h-2.5 w-8 rounded" />
              </div>
            </div>
            <Skeleton className="h-2.5 w-28 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Table skeleton (used by UserManagement). */
export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6,
}) => (
  <div className="card overflow-hidden animate-pulse">
    <div className="border-b border-[#262626] px-4 py-3 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-2.5 w-20 rounded flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="px-4 py-4 flex gap-4 border-b border-[#262626] last:border-0">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton
            key={c}
            className={`h-3 rounded flex-1 ${c === 0 ? 'w-32' : 'w-20'}`}
          />
        ))}
      </div>
    ))}
  </div>
);

/** Form fields skeleton (used by Settings). */
export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 6 }) => (
  <div className="card animate-pulse space-y-6">
    <div className="flex items-center gap-2 mb-2">
      <Skeleton className="w-5 h-5 rounded" />
      <Skeleton className="h-4 w-40 rounded" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-2.5 w-20 rounded mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

/** Chart / visualization area skeleton. */
export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card animate-pulse flex flex-col items-center justify-center ${className}`}>
    <Skeleton className="w-12 h-12 rounded-full mb-4" />
    <Skeleton className="h-3 w-40 rounded mb-2" />
    <Skeleton className="h-2.5 w-28 rounded" />
  </div>
);

/** Sidebar panel skeleton (for Simulation left panel). */
export const SkeletonSidePanel: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="card">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-3 h-3 rounded" />
          <Skeleton className="h-2.5 w-28 rounded" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="border border-[#262626] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-2 w-10 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Skeleton className="h-7 rounded" />
                <Skeleton className="h-7 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/* ── Page-level skeletons ───────────────────────────────────────────────────── */

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <SkeletonStatRow />
    <SkeletonCardGrid count={4} />
    <SkeletonCardGrid count={3} cols="md:grid-cols-2 lg:grid-cols-3" />
  </div>
);

export const SettingsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <SkeletonForm fields={4} />
    <SkeletonForm fields={2} />
    <div className="card animate-pulse">
      <Skeleton className="h-4 w-48 rounded mb-4" />
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
    </div>
    <div className="flex justify-end gap-4">
      <Skeleton className="h-10 w-24 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
  </div>
);

