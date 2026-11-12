import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ease } from '../../lib/motion';
import {
  AnimatedNumber,
  MotionSparklinePath,
  SlidingTabGroup,
  SlidingTabIndicator,
  StatusDot,
} from '../motion';

export interface DemoMachineRow {
  id: string;
  name: string;
  status: 'Running' | 'Standby' | 'Fault';
  metric: string;
  sparkPath: string;
}

export interface DemoPlantData {
  id: 'plant-a' | 'plant-b' | 'plant-c' | 'plant-d';
  label: string;
  subtitle: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  throughput: string;
  latency: string;
  machines: DemoMachineRow[];
}

export interface HeroPreviewProps {
  plants: DemoPlantData[];
  activePlantId: DemoPlantData['id'];
  onSelectPlant: (id: DemoPlantData['id']) => void;
  liveOeeOffset: number;
}

const MiniRing: React.FC<{ value: number }> = React.memo(({ value }) => {
  const safeVal = Math.max(0, Math.min(100, value));
  const ratio = safeVal / 100;
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { once: true, amount: 'some' });
  const shouldReduce = useReducedMotion();
  const [drawnOnce, setDrawnOnce] = useState(Boolean(shouldReduce));

  useEffect(() => {
    if (shouldReduce) setDrawnOnce(true);
  }, [shouldReduce]);

  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;

  const ringStroke =
    safeVal >= 85
      ? 'var(--g-green)'
      : safeVal >= 60
        ? 'var(--g-yellow)'
        : 'var(--g-red)';

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90 flex-shrink-0"
      aria-hidden="true"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--g-border)"
        strokeWidth={strokeWidth}
      />
      {shouldReduce ? (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringStroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${ratio} 1`}
        />
      ) : (
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringStroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: inView ? ratio : 0 }}
          transition={{ duration: drawnOnce ? 0.45 : 0.9, ease }}
          onAnimationComplete={() => {
            if (inView && !drawnOnce) setDrawnOnce(true);
          }}
        />
      )}
    </svg>
  );
});

MiniRing.displayName = 'MiniRing';

export const HeroPreview: React.FC<HeroPreviewProps> = React.memo(
  ({ plants, activePlantId, onSelectPlant, liveOeeOffset }) => {
    const shouldReduce = useReducedMotion();
    const activePlant =
      plants.find((p) => p.id === activePlantId) || plants[0];

    const displayedOee = Math.max(
      0,
      Math.min(100, Number((activePlant.oee + liveOeeOffset).toFixed(1)))
    );

    return (
      <div
        className="lp-notch-card p-6 bg-g-surface border border-g-border shadow-lg"
        aria-label="Live plant demo preview"
      >
        {/* Header & Segmented Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-g-borderSubtle">
          <div>
            <h2 className="text-[16px] font-cinzel font-semibold text-g-text leading-tight">
              Plant overview
            </h2>
            <p className="text-[13px] text-g-textSecondary mt-0.5">
              {activePlant.label} · {activePlant.subtitle}
            </p>
          </div>

          <SlidingTabGroup id="hero-demo-plants">
            <div
              role="tablist"
              aria-label="Demo plant switcher"
              className="inline-flex flex-wrap p-1 rounded-[4px] bg-g-surfaceElevated border border-g-border gap-0.5 max-w-full"
            >
              {plants.map((plant) => {
                const isActive = plant.id === activePlant.id;
                return (
                  <button
                    key={plant.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onSelectPlant(plant.id)}
                    className={`relative px-2.5 py-1 text-[12px] font-medium rounded-[4px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue ${isActive
                        ? 'text-g-text'
                        : 'text-g-textSecondary hover:text-g-text'
                      }`}
                  >
                    {isActive && (
                      <SlidingTabIndicator
                        layoutId="hero-demo-plants-indicator"
                        variant="pill"
                        className="bg-g-surface border border-g-border shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{plant.label}</span>
                  </button>
                );
              })}
            </div>
          </SlidingTabGroup>
        </div>

        {/* Big OEE Number + Donut Ring + Three A/P/Q Stats */}
        <div className="py-5 border-b border-g-borderSubtle space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[12px] uppercase tracking-[0.08em] text-g-textMuted block">
                Overall plant OEE
              </span>
              <div className="mt-1 flex items-baseline">
                <AnimatedNumber
                  value={displayedOee}
                  decimals={1}
                  suffix="%"
                  className="font-cinzel text-[48px] font-bold text-g-text leading-none tracking-tight"
                />
              </div>
            </div>

            <MiniRing value={displayedOee} />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-g-borderSubtle">
            <div>
              <span className="block text-[12px] text-g-textMuted">
                Availability
              </span>
              <span className="block text-[15px] font-semibold text-g-text tabular-nums mt-0.5">
                {activePlant.availability.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="block text-[12px] text-g-textMuted">
                Performance
              </span>
              <span className="block text-[15px] font-semibold text-g-text tabular-nums mt-0.5">
                {activePlant.performance.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="block text-[12px] text-g-textMuted">
                Quality
              </span>
              <span className="block text-[15px] font-semibold text-g-text tabular-nums mt-0.5">
                {activePlant.quality.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Aligned 4-Row Machine Table */}
        <div className="py-4 border-b border-g-borderSubtle">
          <div className="space-y-2.5" role="table" aria-label="Machine metrics">
            {activePlant.machines.map((row, idx) => {
              const dotVariant =
                row.status === 'Running'
                  ? 'running'
                  : row.status === 'Fault'
                    ? 'alarm'
                    : 'standby';

              const strokeVar =
                row.status === 'Fault'
                  ? 'var(--g-red)'
                  : row.status === 'Running'
                    ? 'var(--g-blue)'
                    : 'var(--g-text-muted)';

              return (
                <motion.div
                  key={`${activePlant.id}-${row.id}`}
                  initial={shouldReduce ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.24,
                    delay: shouldReduce ? 0 : idx * 0.045,
                    ease,
                  }}
                  role="row"
                  className="grid grid-cols-[minmax(0,1fr)_auto_64px] items-center gap-3 py-1 rounded-md px-1 -mx-1 hover:bg-g-surfaceElevated/60 transition-colors"
                >
                  <div role="cell" className="flex items-center gap-2 min-w-0">
                    <StatusDot status={dotVariant} size="sm" />
                    <span className="text-[14px] text-g-text truncate">
                      {row.name}
                    </span>
                  </div>

                  <div
                    role="cell"
                    className="text-[13px] font-medium text-g-textSecondary tabular-nums whitespace-nowrap"
                  >
                    {row.metric}
                  </div>

                  <div role="cell" className="flex justify-end">
                    <svg
                      width="64"
                      height="20"
                      viewBox="0 0 64 20"
                      aria-hidden="true"
                    >
                      <MotionSparklinePath
                        d={row.sparkPath}
                        stroke={strokeVar}
                        strokeWidth={1.6}
                      />
                    </svg>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Folded System Status Row */}
        <div className="py-3 border-b border-g-borderSubtle flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <span className="text-g-textMuted">System status</span>
          <span className="text-g-textSecondary tabular-nums">
            {activePlant.throughput} · {activePlant.latency}
          </span>
        </div>

        {/* Honest Simulated Footer */}
        <div className="pt-3 flex items-center justify-between gap-2">
          <span className="text-[12px] text-g-textMuted">Edge + Supabase Sync Ready</span>
          <span className="px-2 py-0.5 rounded-[4px] bg-g-surfaceElevated border border-g-border text-[12px] font-medium text-g-textSecondary">
            Simulated
          </span>
        </div>
      </div>
    );
  }
);

HeroPreview.displayName = 'HeroPreview';
