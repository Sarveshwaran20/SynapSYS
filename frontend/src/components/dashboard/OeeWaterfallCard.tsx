import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ease } from '../../lib/motion';
import { AnimatedNumber, SpotlightCard } from '../motion';
import { MachineDashboardState } from '../../types';

export interface OeeWaterfallCardProps {
  machines: MachineDashboardState[];
  overallOeePct: number;
  netShiftValueUsd: number;
}

export const OeeWaterfallCard: React.FC<OeeWaterfallCardProps> = React.memo(
  ({ machines, overallOeePct, netShiftValueUsd }) => {
    const shouldReduce = useReducedMotion();
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const breakdown = useMemo(() => {
      const count = Math.max(1, machines.length);
      const avgAvail =
        (machines.reduce((s, m) => s + (m.oee_metrics?.availability || 0), 0) / count) * 100;
      const avgPerf =
        (machines.reduce((s, m) => s + (m.oee_metrics?.performance || 0), 0) / count) * 100;
      const avgQual =
        (machines.reduce((s, m) => s + (m.oee_metrics?.quality || 0), 0) / count) * 100;

      const availLoss = Math.max(0.4, 100 - avgAvail);
      const afterAvail = Math.max(10, 100 - availLoss);
      const perfLoss = Math.max(0.4, afterAvail * (1 - avgPerf / 100));
      const afterPerf = Math.max(10, afterAvail - perfLoss);
      const qualLoss = Math.max(0.2, afterPerf * (1 - avgQual / 100));

      const totalScrap = machines.reduce((s, m) => s + (m.scrap_count || 0), 0);
      const totalDownSec = machines.reduce((s, m) => s + (m.downtime_seconds || 0), 0);

      return [
        {
          key: 'avail',
          label: 'Availability Loss',
          lossPct: availLoss,
          color: '#F59E0B',
          detail: `${Math.round(totalDownSec / 60)}m unplanned & tooling stops`,
          valueUsd: Math.round((availLoss / 100) * Math.max(18000, netShiftValueUsd * 1.15)),
        },
        {
          key: 'perf',
          label: 'Performance Loss',
          lossPct: perfLoss,
          color: '#4C8DF6',
          detail: 'Micro-stops & cycle elongation delta',
          valueUsd: Math.round((perfLoss / 100) * Math.max(18000, netShiftValueUsd * 1.15)),
        },
        {
          key: 'qual',
          label: 'Quality Loss',
          lossPct: qualLoss,
          color: '#F43F5E',
          detail: `${totalScrap} non-conforming / startup rejects`,
          valueUsd: Math.round((qualLoss / 100) * Math.max(18000, netShiftValueUsd * 1.15)),
        },
      ];
    }, [machines, overallOeePct, netShiftValueUsd]);

    const activeSegment = breakdown.find((b) => b.key === hoveredKey) || null;
    const totalLossPct = breakdown.reduce((s, b) => s + b.lossPct, 0);

    return (
      <SpotlightCard
        surface={false}
        notch={false}
        className="bg-g-surfaceElevated border border-g-border rounded-xl p-5 flex flex-col gap-4 grid-container-surface"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-g-textMuted">
              ISO-22400 Waterfall Attribution
            </span>
            <h4 className="font-cinzel text-base font-semibold text-g-text mt-0.5">
              100% Theoretical →{' '}
              <span className="text-emerald-700 dark:text-emerald-400">
                <AnimatedNumber value={overallOeePct} decimals={1} suffix="% Net OEE" />
              </span>
            </h4>
          </div>

          <span className="text-xs font-mono text-g-textSecondary px-2.5 py-1 rounded bg-g-surface border border-g-border">
            {activeSegment
              ? `${activeSegment.label}: -${activeSegment.lossPct.toFixed(1)}% (~$${activeSegment.valueUsd.toLocaleString()})`
              : `Total Recoverable Opportunity: ${totalLossPct.toFixed(1)}%`}
          </span>
        </div>

        {/* Continuous Proportional Composition Rail */}
        <div
          className="h-7 rounded-lg bg-g-surface border border-g-border p-1 flex items-stretch gap-1 overflow-hidden"
          role="img"
          aria-label="OEE realized vs loss proportion bar"
        >
          <motion.div
            initial={shouldReduce ? false : { width: 0 }}
            animate={{ width: `${Math.max(12, Math.min(96, overallOeePct))}%` }}
            transition={{ duration: shouldReduce ? 0 : 0.55, ease }}
            className="h-full rounded-[4px] bg-emerald-500/85 flex items-center justify-center text-[11px] font-mono font-bold text-white px-2 truncate"
            title={`Net Realized OEE: ${overallOeePct.toFixed(1)}%`}
          >
            Realized {overallOeePct.toFixed(1)}%
          </motion.div>

          {breakdown.map((seg, idx) => (
            <motion.button
              key={seg.key}
              type="button"
              onMouseEnter={() => setHoveredKey(seg.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onFocus={() => setHoveredKey(seg.key)}
              onBlur={() => setHoveredKey(null)}
              initial={shouldReduce ? false : { opacity: 0, scaleX: 0 }}
              animate={{ opacity: hoveredKey && hoveredKey !== seg.key ? 0.45 : 1, scaleX: 1 }}
              transition={{ duration: shouldReduce ? 0 : 0.4, delay: idx * 0.06, ease }}
              style={{
                width: `${Math.max(3, seg.lossPct)}%`,
                backgroundColor: seg.color,
                originX: 0,
              }}
              className="h-full rounded-[4px] cursor-pointer focus:outline-none"
              title={`${seg.label}: -${seg.lossPct.toFixed(1)}% (${seg.detail})`}
            />
          ))}
        </div>

        {/* Legend Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          {breakdown.map((seg) => (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredKey(seg.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`p-3 rounded-lg bg-g-surface border transition-colors flex items-center justify-between gap-2 ${hoveredKey === seg.key ? 'border-g-blue/60' : 'border-g-border'
                }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <div className="min-w-0">
                  <span className="text-g-text font-semibold block truncate">{seg.label}</span>
                  <span className="text-[11px] text-g-textMuted block truncate">{seg.detail}</span>
                </div>
              </div>
              <span className="text-rose-700 dark:text-rose-400 font-bold shrink-0">
                -{seg.lossPct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </SpotlightCard>
    );
  }
);

OeeWaterfallCard.displayName = 'OeeWaterfallCard';
