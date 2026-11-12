import React from 'react';
import { Skeleton } from './Skeleton';

export interface ChunkFallbackProps {
  label?: string;
  minHeight?: number;
  className?: string;
}

export const ChunkRouteFallback: React.FC<ChunkFallbackProps> = React.memo(
  ({ label = 'Loading module chunk...', className = '' }) => (
    <div
      role="status"
      aria-live="polite"
      className={`min-h-screen w-full bg-g-bg text-g-text flex flex-col items-center justify-center px-6 py-12 ${className}`}
    >
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-g-blue animate-pulse" />
            <span className="font-cinzel text-sm font-semibold tracking-wider text-g-text">
              SYNAPSYS
            </span>
          </div>
          <span className="text-[11px] font-mono text-g-textMuted">{label}</span>
        </div>
        <Skeleton className="h-24 w-full rounded-xl bg-g-surface border border-g-border" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-lg bg-g-surface border border-g-border" />
          <Skeleton className="h-16 rounded-lg bg-g-surface border border-g-border" />
        </div>
      </div>
    </div>
  )
);

ChunkRouteFallback.displayName = 'ChunkRouteFallback';

export const ChunkSectionFallback: React.FC<ChunkFallbackProps> = React.memo(
  ({ label = 'Streaming section chunk...', minHeight = 220, className = '' }) => (
    <div
      role="status"
      aria-live="polite"
      style={{ minHeight }}
      className={`w-full rounded-xl bg-g-surface border border-g-border p-5 sm:p-6 flex flex-col justify-between gap-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-g-blue/80 animate-pulse" />
          <span className="text-xs font-mono text-g-textMuted">{label}</span>
        </div>
        <Skeleton className="h-5 w-24 rounded bg-g-surfaceElevated" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
        <Skeleton className="h-28 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle" />
        <Skeleton className="h-28 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle hidden sm:block" />
        <Skeleton className="h-28 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle hidden sm:block" />
      </div>
    </div>
  )
);

ChunkSectionFallback.displayName = 'ChunkSectionFallback';

export const ChunkPanelFallback: React.FC<ChunkFallbackProps> = React.memo(
  ({ label = 'Loading SCADA module...', minHeight = 320, className = '' }) => (
    <div
      role="status"
      aria-live="polite"
      style={{ minHeight }}
      className={`w-full rounded-xl bg-g-surface border border-g-border p-6 flex flex-col gap-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-g-blue animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-g-textSecondary">
            {label}
          </span>
        </div>
        <Skeleton className="h-6 w-28 rounded-md bg-g-surfaceElevated" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-20 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle" />
        <Skeleton className="h-20 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle" />
        <Skeleton className="h-20 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle hidden lg:block" />
        <Skeleton className="h-20 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle hidden lg:block" />
      </div>
      <Skeleton className="flex-1 min-h-[140px] rounded-lg bg-g-surfaceElevated border border-g-borderSubtle" />
    </div>
  )
);

ChunkPanelFallback.displayName = 'ChunkPanelFallback';

