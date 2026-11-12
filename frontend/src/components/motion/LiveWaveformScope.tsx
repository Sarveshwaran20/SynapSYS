import React, { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ease, useDocumentVisible } from '../../lib/motion';

export interface ScopeChannel {
  id: string;
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
  values: number[];
  threshold?: number;
}

export interface LiveWaveformScopeProps {
  channels: ScopeChannel[];
  title?: string;
  subtitle?: string;
  height?: number;
  sampleLabels?: string[];
  className?: string;
}

function resamplePoints(values: number[], targetCount: number): number[] {
  if (!values || values.length === 0) return Array(targetCount).fill(0);
  if (values.length === 1) return Array(targetCount).fill(values[0]);
  if (values.length === targetCount) return values;
  const out: number[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    const pos = (i / (targetCount - 1)) * (values.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(values.length - 1, Math.ceil(pos));
    const t = pos - lo;
    out.push(values[lo] * (1 - t) + values[hi] * t);
  }
  return out;
}

function buildSmoothSvgPath(
  points: { x: number; y: number }[],
  closed = false,
  height = 180
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = ((p0.x + p1.x) / 2).toFixed(1);
    const my = ((p0.y + p1.y) / 2).toFixed(1);
    if (i === 0) {
      d += ` L ${mx} ${my}`;
    } else {
      d += ` Q ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} ${mx} ${my}`;
    }
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  if (closed) {
    d += ` L ${last.x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
  }
  return d;
}

const SAMPLE_SLOTS = 24;
const VB_WIDTH = 640;
const VB_HEIGHT = 188;
const PAD_Y = 16;

export const LiveWaveformScope: React.FC<LiveWaveformScopeProps> = React.memo(
  ({
    channels,
    title = 'Live PLC Signal Oscilloscope',
    subtitle = 'Synchronized high-frequency sensor trace',
    height = 196,
    sampleLabels,
    className = '',
  }) => {
    const shouldReduce = useReducedMotion();
    const isDocVisible = useDocumentVisible();
    const svgWrapRef = useRef<HTMLDivElement>(null);
    const [focusedChannelId, setFocusedChannelId] = useState<string | null>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const prepared = useMemo(() => {
      const spanY = VB_HEIGHT - PAD_Y * 2;
      return channels.map((ch) => {
        const resampled = resamplePoints(ch.values, SAMPLE_SLOTS);
        const denom = Math.max(0.0001, ch.max - ch.min);
        const pts = resampled.map((val, idx) => {
          const norm = Math.max(0, Math.min(1, (val - ch.min) / denom));
          const x = (idx / (SAMPLE_SLOTS - 1)) * VB_WIDTH;
          const y = PAD_Y + (1 - norm) * spanY;
          return { x, y, raw: val };
        });
        const linePath = buildSmoothSvgPath(pts, false, VB_HEIGHT);
        const areaPath = buildSmoothSvgPath(pts, true, VB_HEIGHT);
        const lastRaw = ch.values[ch.values.length - 1] ?? 0;
        const thresholdY =
          typeof ch.threshold === 'number'
            ? PAD_Y +
              (1 - Math.max(0, Math.min(1, (ch.threshold - ch.min) / denom))) *
                spanY
            : null;
        return { ...ch, pts, linePath, areaPath, lastRaw, thresholdY };
      });
    }, [channels]);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!svgWrapRef.current) return;
      const rect = svgWrapRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const idx = Math.round(ratio * (SAMPLE_SLOTS - 1));
      setHoverIndex(idx);
    };

    const hoverX =
      hoverIndex !== null ? (hoverIndex / (SAMPLE_SLOTS - 1)) * VB_WIDTH : null;

    return (
      <div
        className={`rounded-xl bg-g-surfaceElevated border border-g-border p-4 sm:p-5 flex flex-col gap-3.5 grid-container-surface ${className}`}
      >
        {/* Scope Header + Interactive Channel Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  shouldReduce || !isDocVisible ? 'bg-g-blue' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <h4 className="font-cinzel text-sm sm:text-base font-semibold text-g-text tracking-wide">
                {title}
              </h4>
            </div>
            <p className="text-xs text-g-textSecondary font-sans mt-0.5">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFocusedChannelId(null)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors cursor-pointer ${
                focusedChannelId === null
                  ? 'bg-g-surface text-g-text border-g-blue/50 shadow-xs'
                  : 'bg-g-surface/50 text-g-textSecondary border-g-border hover:text-g-text'
              }`}
            >
              All ({prepared.length})
            </button>
            {prepared.map((ch) => {
              const isFocused = focusedChannelId === ch.id;
              const isDimmed = focusedChannelId !== null && !isFocused;
              const displayedVal =
                hoverIndex !== null && ch.pts[hoverIndex]
                  ? ch.pts[hoverIndex].raw
                  : ch.lastRaw;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() =>
                    setFocusedChannelId((prev) => (prev === ch.id ? null : ch.id))
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
                    isFocused
                      ? 'bg-g-surface text-g-text border-g-blue/60 shadow-xs'
                      : isDimmed
                      ? 'bg-g-surface/35 text-g-textMuted border-g-border opacity-65 hover:opacity-100'
                      : 'bg-g-surface/75 text-g-text border-g-border hover:border-g-blue/40'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: ch.color }}
                  />
                  <span>{ch.label}:</span>
                  <strong className="tabular-nums font-semibold">
                    {displayedVal.toFixed(ch.max <= 15 ? 2 : 1)} {ch.unit}
                  </strong>
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Waveform Reticle */}
        <div
          ref={svgWrapRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
          className="relative w-full rounded-lg border border-g-border bg-g-surface overflow-hidden scope-grid-bg select-none"
          style={{ height }}
        >
          {/* Ambient Moving Radar Scan Beam (Compositor-only transform) */}
          {!shouldReduce && isDocVisible && (
            <motion.div
              aria-hidden="true"
              animate={{ x: ['-15%', '115%'] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute inset-y-0 w-24 z-10 opacity-35"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--g-blue) 18%, transparent) 55%, transparent 100%)',
              }}
            />
          )}

          <svg
            viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
            preserveAspectRatio="none"
            className="w-full h-full block relative z-20"
            role="img"
            aria-label={title}
          >
            <defs>
              {prepared.map((ch) => (
                <linearGradient
                  key={`grad-${ch.id}`}
                  id={`scope-fill-${ch.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={ch.color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={ch.color} stopOpacity="0.01" />
                </linearGradient>
              ))}
            </defs>

            {/* Horizontal & Vertical Reticle Lines */}
            {[0.25, 0.5, 0.75].map((pct) => (
              <line
                key={`h-${pct}`}
                x1="0"
                y1={VB_HEIGHT * pct}
                x2={VB_WIDTH}
                y2={VB_HEIGHT * pct}
                stroke="var(--g-border)"
                strokeWidth="0.7"
                strokeDasharray="3 4"
                strokeOpacity="0.6"
              />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map((pct) => (
              <line
                key={`v-${pct}`}
                x1={VB_WIDTH * pct}
                y1="0"
                x2={VB_WIDTH * pct}
                y2={VB_HEIGHT}
                stroke="var(--g-border)"
                strokeWidth="0.6"
                strokeDasharray="2 5"
                strokeOpacity="0.45"
              />
            ))}

            {/* Optional Alarm Threshold Reference Lines */}
            {prepared.map(
              (ch) =>
                ch.thresholdY !== null &&
                (focusedChannelId === null || focusedChannelId === ch.id) && (
                  <line
                    key={`th-${ch.id}`}
                    x1="0"
                    y1={ch.thresholdY}
                    x2={VB_WIDTH}
                    y2={ch.thresholdY}
                    stroke={ch.color}
                    strokeWidth="0.9"
                    strokeDasharray="5 4"
                    strokeOpacity="0.5"
                  />
                )
            )}

            {/* Channel Curves + Translucent Areas */}
            {prepared.map((ch) => {
              const isVisible =
                focusedChannelId === null || focusedChannelId === ch.id;
              const strokeWidth = focusedChannelId === ch.id ? 2.8 : 2.1;
              const endPt = ch.pts[ch.pts.length - 1];
              const hoverPt =
                hoverIndex !== null ? ch.pts[hoverIndex] : null;
              const targetPt = hoverPt || endPt;

              return (
                <g
                  key={ch.id}
                  style={{
                    opacity: isVisible ? 1 : 0.14,
                    transition: 'opacity 0.22s ease',
                  }}
                >
                  {isVisible && (
                    <motion.path
                      d={ch.areaPath}
                      fill={`url(#scope-fill-${ch.id})`}
                      animate={{ d: ch.areaPath }}
                      transition={
                        shouldReduce
                          ? { duration: 0 }
                          : { duration: 0.45, ease }
                      }
                    />
                  )}
                  <motion.path
                    d={ch.linePath}
                    fill="none"
                    stroke={ch.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ d: ch.linePath }}
                    transition={
                      shouldReduce ? { duration: 0 } : { duration: 0.45, ease }
                    }
                  />
                  {targetPt && isVisible && (
                    <>
                      <circle
                        cx={targetPt.x}
                        cy={targetPt.y}
                        r={5.5}
                        fill={ch.color}
                        fillOpacity={0.22}
                      />
                      <circle
                        cx={targetPt.x}
                        cy={targetPt.y}
                        r={2.8}
                        fill={ch.color}
                        stroke="var(--g-surface)"
                        strokeWidth={1.2}
                      />
                    </>
                  )}
                </g>
              );
            })}

            {/* Interactive Hover Crosshair Line */}
            {hoverX !== null && (
              <line
                x1={hoverX}
                y1="0"
                x2={hoverX}
                y2={VB_HEIGHT}
                stroke="var(--g-text)"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
            )}
          </svg>

          {/* Bottom Time / Cursor Footer */}
          <div className="pointer-events-none absolute bottom-1.5 left-3 right-3 z-30 flex items-center justify-between text-[11px] font-mono text-g-textMuted">
            <span>{sampleLabels?.[0] || 'T-24s'}</span>
            <span>
              {hoverIndex !== null
                ? `Sample #${hoverIndex + 1} / ${SAMPLE_SLOTS}`
                : 'Hover trace to inspect samples'}
            </span>
            <span>{sampleLabels?.[1] || 'LIVE NOW'}</span>
          </div>
        </div>
      </div>
    );
  }
);

LiveWaveformScope.displayName = 'LiveWaveformScope';

