import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { dur, ease } from '../../lib/motion';
import {
  MotionButton,
  SlidingTabGroup,
  SlidingTabIndicator,
  SpotlightCard,
  StatusDot,
} from '../motion';

export type ProductModuleId =
  | 'monitoring'
  | 'oee'
  | 'twin'
  | 'predictive'
  | 'workorders'
  | 'firebase';

interface ProductModuleDetail {
  id: ProductModuleId;
  badge: string;
  title: string;
  summary: string;
  specLabel: string;
  tags: string[];
  payloadPreview: string;
}

const MODULES: ProductModuleDetail[] = [
  {
    id: 'monitoring',
    badge: 'Live SCADA',
    title: 'Multi-Cell Telemetry Scope & Status Matrix',
    summary:
      'Stream sub-second cycle duration, thermal envelope, spindle RMS vibration, and power load across active cells with instant drill testing.',
    specLabel: 'IEC 62541 / 250Hz Edge Poll',
    tags: ['CNC-101 · 52.4°C', 'Vib · 1.42 mm/s', 'Power · 21.6 kW', 'Takt · 12.0s'],
    payloadPreview:
      '{ "machine_id": "CNC-101", "status": "Running", "cycle_sec": 12.1, "temp_c": 52.4 }',
  },
  {
    id: 'oee',
    badge: 'ISO-22400',
    title: 'Six Big Losses Waterfall & Shift ROI',
    summary:
      'Decompose Availability, Performance, and Quality losses down to exact equipment stoppage seconds and per-shift scrap margin impact.',
    specLabel: 'ISO-22400 Real-Time Formula',
    tags: ['Avail · 96.3%', 'Perf · 91.8%', 'Qual · 98.8%', 'Net Yield · $27.3k'],
    payloadPreview:
      '{ "oee_pct": 87.3, "failure_sec": 42, "minor_stops_sec": 18, "scrap_units": 4 }',
  },
  {
    id: 'twin',
    badge: 'Spatial Floor',
    title: 'Interactive Digital Twin Shop-Floor Map',
    summary:
      'Inspect physical bay coordinates, material conveyor transfer routes, and AGV loop traffic in a responsive spatial floorplan.',
    specLabel: 'Bay Topology & AGV Bus',
    tags: ['Bay 02 · Machining', 'Bay 04 · Polymer', 'AGV Loop · Nominal', '4 Cells Synced'],
    payloadPreview:
      '{ "bay": "Bay 02", "line": "Machining Cell A", "agv_state": "Conveying", "oee": 95.1 }',
  },
  {
    id: 'predictive',
    badge: 'Anomaly AI',
    title: 'Remaining Useful Life & Harmonic Diagnostics',
    summary:
      'Track rising bearing vibration harmonics and coolant thermal drift continuously to queue maintenance before unplanned line stops.',
    specLabel: 'RMS Harmonic Drift Model',
    tags: ['RUL · 320 hrs', 'Anomaly · 12.0%', 'Spindle Ceramic', 'Confidence · 99.4%'],
    payloadPreview:
      '{ "rul_hrs": 320, "anomaly_score": 12.0, "component": "High-Speed Spindle Bearings" }',
  },
  {
    id: 'workorders',
    badge: 'MES Batch',
    title: 'Order Routing Steps & First-Pass Yield',
    summary:
      'Tie every good and rejected cycle straight to customer part numbers, batch targets, CAD revision locks, and estimated completion.',
    specLabel: 'ISA-95 Work Order Execution',
    tags: ['WO-84920 · Aerospace', 'Batch · 82/250', 'FAI · Approved', 'Yield · 98.8%'],
    payloadPreview:
      '{ "order_id": "WO-84920", "part": "Impeller-7B", "completed": 82, "target": 250 }',
  },
  {
    id: 'firebase',
    badge: 'Cloud Sync',
    title: 'Firebase Cloud Firestore Multi-Tenant Bridge',
    summary:
      'Mirror multi-plant production sites, operator auth directory, telemetry logs, and alarm audits to Google Cloud Firestore with local SQLite fallback.',
    specLabel: 'Firestore Documents + Realtime',
    tags: ['users/{email}', 'production_sites/{id}', 'telemetry/{id}', 'alarm_events/{id}'],
    payloadPreview:
      '{ "collection": "telemetry", "machine_id": "CNC-101", "oee": 95.1, "status": "Running" }',
  },
];

export interface FeatureSpotlightDeckProps {
  activeId?: ProductModuleId;
  onSelectId?: (id: ProductModuleId) => void;
  onLaunchDemo: () => void;
}

export const FeatureSpotlightDeck: React.FC<FeatureSpotlightDeckProps> = React.memo(
  ({ activeId: controlledId, onSelectId, onLaunchDemo }) => {
    const shouldReduce = useReducedMotion();
    const [uncontrolledId, setUncontrolledId] = useState<ProductModuleId>('monitoring');
    const activeId = controlledId ?? uncontrolledId;
    const setActiveId = (id: ProductModuleId) => {
      if (onSelectId) onSelectId(id);
      else setUncontrolledId(id);
    };

    const current = MODULES.find((m) => m.id === activeId) || MODULES[0];

    return (
      <SpotlightCard
        surface={false}
        notch={false}
        className="lp-notch-card p-5 sm:p-6 bg-g-surface border border-g-border grid-container-surface mt-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-g-borderSubtle">
          <div className="flex items-center gap-2.5">
            <StatusDot status="live" />
            <span className="font-cinzel text-sm font-semibold text-g-text tracking-wide">
              Interactive Platform Architecture Preview
            </span>
          </div>

          <SlidingTabGroup id="lp-feature-spotlight">
            <div className="inline-flex flex-wrap gap-1 p-1 rounded-[6px] bg-g-surfaceElevated border border-g-border">
              {MODULES.map((m) => {
                const isSelected = m.id === current.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveId(m.id)}
                    className={`relative px-2.5 py-1 text-xs font-mono rounded-[4px] transition-colors cursor-pointer ${
                      isSelected ? 'text-g-text font-semibold' : 'text-g-textSecondary hover:text-g-text'
                    }`}
                  >
                    {isSelected && (
                      <SlidingTabIndicator
                        layoutId="lp-feature-spotlight-pill"
                        variant="pill"
                        className="bg-g-surface border border-g-border shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{m.badge}</span>
                  </button>
                );
              })}
            </div>
          </SlidingTabGroup>
        </div>

        <motion.div
          key={current.id}
          initial={shouldReduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.fast, ease }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-5 items-center"
        >
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-g-blueLight text-g-blue border border-g-blue/25 text-[11px] font-mono font-semibold">
                {current.specLabel}
              </span>
            </div>
            <h3 className="font-cinzel text-lg sm:text-xl font-bold text-g-text leading-snug">
              {current.title}
            </h3>
            <p className="text-sm text-g-textSecondary leading-relaxed max-w-[60ch]">
              {current.summary}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {current.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-g-surfaceElevated border border-g-border text-xs font-mono text-g-text"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between gap-3.5 p-4 rounded-xl bg-g-surfaceElevated border border-g-border">
            <div className="flex items-center justify-between text-[11px] font-mono text-g-textMuted">
              <span>SYNAPSYS STREAM FRAME</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">VERIFIED</span>
            </div>
            <code className="block p-3 rounded-lg bg-g-surface border border-g-border text-xs font-mono text-g-blue overflow-x-auto leading-relaxed">
              {current.payloadPreview}
            </code>
            <div className="flex justify-end">
              <MotionButton
                primary
                type="button"
                onClick={onLaunchDemo}
                className="px-4 py-2 rounded-[6px] bg-g-blue hover:bg-g-blueHover text-white text-xs font-semibold cursor-pointer"
              >
                Explore Module Live →
              </MotionButton>
            </div>
          </div>
        </motion.div>
      </SpotlightCard>
    );
  }
);

FeatureSpotlightDeck.displayName = 'FeatureSpotlightDeck';

