import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface IncidentMarker {
  id: string;
  timeOffsetSec: number; // e.g. -1800 for 30 mins ago
  label: string;
  severity: 'Critical' | 'Warning' | 'Info';
  machineId: string;
}

export interface ChronosTimelineScrubberProps {
  timeOffsetSec: number; // 0 for Live, negative for past
  maxPastSeconds?: number; // default 3600 (1 hour)
  onChangeTimeOffset: (offset: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: 1 | 2 | 5 | 10;
  onChangePlaybackSpeed: (speed: 1 | 2 | 5 | 10) => void;
  incidents?: IncidentMarker[];
  onSelectIncident?: (incident: IncidentMarker) => void;
}

export const ChronosTimelineScrubber: React.FC<ChronosTimelineScrubberProps> = React.memo(
  ({
    timeOffsetSec,
    maxPastSeconds = 3600,
    onChangeTimeOffset,
    isPlaying,
    onTogglePlay,
    playbackSpeed,
    onChangePlaybackSpeed,
    incidents = [],
    onSelectIncident,
  }) => {
    const shouldReduce = useReducedMotion();
    const trackRef = useRef<HTMLDivElement>(null);

    // Auto-advance timeline when playing
    useEffect(() => {
      if (!isPlaying) return;
      const interval = window.setInterval(() => {
        onChangeTimeOffset(
          timeOffsetSec >= 0
            ? -maxPastSeconds
            : Math.min(0, timeOffsetSec + 1 * playbackSpeed)
        );
      }, 1000 / playbackSpeed);
      return () => window.clearInterval(interval);
    }, [isPlaying, timeOffsetSec, maxPastSeconds, playbackSpeed, onChangeTimeOffset]);

    const isLive = timeOffsetSec >= 0;
    const progressPct = ((maxPastSeconds + timeOffsetSec) / maxPastSeconds) * 100;

    const formatOffset = (sec: number) => {
      if (sec >= 0) return 'LIVE NOW';
      const abs = Math.abs(sec);
      const m = Math.floor(abs / 60);
      const s = abs % 60;
      return `-${m}m ${s < 10 ? '0' : ''}${s}s`;
    };

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetSec = Math.round(ratio * maxPastSeconds - maxPastSeconds);
      onChangeTimeOffset(targetSec >= -5 ? 0 : targetSec);
    };

    return (
      <div
        className="relative w-full rounded-xl bg-g-surface/95 border border-g-border shadow-lg backdrop-blur-md p-4 sm:p-5 flex flex-col gap-3.5 transition-all overflow-hidden"
        style={{
          boxShadow: !isLive
            ? '0 0 24px -4px rgba(6, 182, 212, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 4px 20px -2px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Holographic Rewind Scanline when viewing the past */}
        {!isLive && !shouldReduce && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            className="pointer-events-none absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent skew-x-12"
            aria-hidden="true"
          />
        )}

        {/* Top Header: Controls & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full relative flex items-center justify-center">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isLive ? 'bg-emerald-500' : 'bg-cyan-400'
                }`}
              />
              {!shouldReduce && (
                <span
                  className={`absolute w-4 h-4 rounded-full animate-ping opacity-75 ${
                    isLive ? 'bg-emerald-500' : 'bg-cyan-400'
                  }`}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-cinzel font-bold text-sm text-g-text tracking-wide uppercase">
                Chronos Engine
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  isLive
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-semibold'
                    : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 font-semibold'
                }`}
              >
                {isLive ? 'REAL-TIME TELEMETRY' : `TEMPORAL REPLAY (${formatOffset(timeOffsetSec)})`}
              </span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center rounded-lg bg-g-surfaceElevated border border-g-border p-0.5 text-xs font-mono">
              {([1, 2, 5, 10] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onChangePlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-g-blue text-white shadow-sm'
                      : 'text-g-textSecondary hover:text-g-text'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={onTogglePlay}
              className={`h-8 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
                  : 'bg-g-surfaceElevated border-g-border text-g-text hover:bg-g-surfaceSubtle'
              }`}
            >
              {isPlaying ? (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Replay</span>
                </>
              )}
            </button>

            {/* Jump to Live Button */}
            {!isLive && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                type="button"
                onClick={() => onChangeTimeOffset(0)}
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Jump to Live</span>
                <span>→</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Timeline Slider Track */}
        <div className="relative pt-2 pb-1">
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="relative h-3 w-full bg-g-surfaceElevated rounded-full border border-g-border/80 cursor-pointer overflow-hidden group/track"
          >
            {/* Played progress fill */}
            <div
              className={`h-full rounded-full transition-all ${
                isLive
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />

            {/* Incident Markers on Timeline */}
            {incidents.map((inc) => {
              const markerPos = ((maxPastSeconds + inc.timeOffsetSec) / maxPastSeconds) * 100;
              if (markerPos < 0 || markerPos > 100) return null;
              const isCrit = inc.severity === 'Critical';
              return (
                <div
                  key={inc.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeTimeOffset(inc.timeOffsetSec);
                    onSelectIncident?.(inc);
                  }}
                  className="absolute top-0 bottom-0 w-2 -ml-1 cursor-pointer z-10 group/marker"
                  style={{ left: `${markerPos}%` }}
                >
                  <span
                    className={`block w-2 h-full rounded-full ${
                      isCrit ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <div className="pointer-events-none opacity-0 group-hover/marker:opacity-100 transition-opacity absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 px-2 py-1 rounded bg-g-surfaceElevated border border-g-border text-[11px] font-mono text-g-text shadow-md">
                    {inc.label} ({formatOffset(inc.timeOffsetSec)})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Scrubber Head Cursor */}
          <div
            className="absolute top-1 -ml-2 pointer-events-none transition-all"
            style={{ left: `${progressPct}%` }}
          >
            <div
              className={`w-4 h-5 rounded-md border shadow-md flex items-center justify-center ${
                isLive
                  ? 'bg-emerald-500 border-white text-white'
                  : 'bg-cyan-400 border-cyan-200 text-black'
              }`}
            >
              <div className="w-1 h-2 rounded bg-black/40" />
            </div>
          </div>
        </div>

        {/* Bottom Time Range Labels & Quick Jump Incident Bookmarks */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-g-textMuted">
          <span>-60 minutes</span>

          {/* Incident Quick Jump Chips */}
          {incidents.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[10px] uppercase text-g-textSecondary">Incidents:</span>
              {incidents.slice(0, 3).map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => {
                    onChangeTimeOffset(inc.timeOffsetSec);
                    onSelectIncident?.(inc);
                  }}
                  className="px-2 py-0.5 rounded bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-[10px] text-g-text transition-colors cursor-pointer"
                >
                  {inc.label} ({formatOffset(inc.timeOffsetSec)})
                </button>
              ))}
            </div>
          )}

          <span className={isLive ? 'text-emerald-400 font-semibold' : ''}>
            {isLive ? 'NOW (T-0)' : formatOffset(timeOffsetSec)}
          </span>
        </div>
      </div>
    );
  }
);

ChronosTimelineScrubber.displayName = 'ChronosTimelineScrubber';
