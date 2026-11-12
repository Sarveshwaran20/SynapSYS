import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MachineDashboardState } from '../../types';
import { ease } from '../../lib/motion';
import { GrowBar, StatusDot } from '../motion';
import { OeeRing } from './OeeRing';

export interface FloorDrawerProps {
  machine: MachineDashboardState | null;
  bayLabel?: string;
  cellName?: string;
  onClose: () => void;
  onOpenSupervisoryControl: (machine: MachineDashboardState) => void;
}

export const FloorDrawer: React.FC<FloorDrawerProps> = React.memo(
  ({ machine, bayLabel, cellName, onClose, onOpenSupervisoryControl }) => {
    const shouldReduce = useReducedMotion();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const mq = window.matchMedia('(max-width: 767px)');
      const sync = () => setIsMobile(mq.matches);
      sync();
      mq.addEventListener('change', sync);
      return () => mq.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
      if (!machine) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [machine, onClose]);

    const statusLabel = machine
      ? machine.status === 'Running'
        ? 'Running'
        : machine.status === 'Down'
        ? 'Fault'
        : 'Standby'
      : 'Standby';

    const dotVariant = machine
      ? machine.status === 'Running'
        ? 'running'
        : machine.status === 'Down'
        ? 'alarm'
        : 'standby'
      : 'standby';

    const panelInitial = shouldReduce
      ? { opacity: 1 }
      : isMobile
      ? { y: '100%' }
      : { x: '100%' };

    const panelAnimate = shouldReduce
      ? { opacity: 1 }
      : isMobile
      ? { y: 0 }
      : { x: 0 };

    const panelExit = shouldReduce
      ? { opacity: 0 }
      : isMobile
      ? { y: '100%' }
      : { x: '100%' };

    return (
      <AnimatePresence>
        {machine && (
          <>
            {/* Backdrop */}
            <motion.div
              key="floor-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-g-bg/70 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-in Drawer (320px Desktop Right / Bottom Sheet Mobile) */}
            <motion.aside
              key="floor-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label={`${machine.machine_name} telemetry inspection drawer`}
              initial={panelInitial}
              animate={panelAnimate}
              exit={panelExit}
              transition={{ duration: 0.3, ease }}
              className="fixed z-50 bg-g-surface border-g-border shadow-2xl flex flex-col inset-x-0 bottom-0 max-h-[85vh] rounded-t-[12px] border-t md:inset-y-0 md:left-auto md:right-0 md:w-[320px] md:max-h-none md:rounded-none md:border-t-0 md:border-l"
            >
              {/* Header */}
              <div className="p-6 border-b border-g-border flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {bayLabel && (
                      <span className="text-[12px] font-medium text-g-textMuted">
                        {bayLabel}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-g-textSecondary">
                      <StatusDot status={dotVariant} size="sm" />
                      <span>{statusLabel}</span>
                    </span>
                  </div>
                  <h3 className="text-[18px] font-cinzel font-semibold text-g-text leading-snug truncate">
                    {machine.machine_name}
                  </h3>
                  {cellName && (
                    <p className="text-[13px] text-g-textSecondary mt-0.5 truncate">
                      {cellName}
                    </p>
                  )}
                  <span className="inline-block mt-2 font-mono text-[12px] text-g-textSecondary bg-g-surfaceElevated border border-g-border px-2 py-0.5 rounded-[4px]">
                    {machine.machine_id}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close telemetry drawer"
                  className="flex-shrink-0 w-9 h-9 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle text-g-textSecondary hover:text-g-text flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* OEE Ring & A/P/Q Breakdown */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <OeeRing
                      value={machine.oee_metrics?.oee_percentage ?? 0}
                      size={96}
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-g-borderSubtle">
                    {[
                      {
                        label: 'Availability',
                        value: machine.oee_metrics?.availability ?? 0,
                        color: 'var(--g-blue)',
                      },
                      {
                        label: 'Performance',
                        value: machine.oee_metrics?.performance ?? 0,
                        color: 'var(--g-green)',
                      },
                      {
                        label: 'Quality',
                        value: machine.oee_metrics?.quality ?? 0,
                        color: 'var(--g-blue)',
                      },
                    ].map((metric) => (
                      <div key={metric.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-g-textSecondary">
                            {metric.label}
                          </span>
                          <span className="font-semibold text-g-text tabular-nums">
                            {metric.value.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-g-surfaceElevated overflow-hidden">
                          <GrowBar
                            value={metric.value}
                            className="h-full rounded-full"
                            style={{ backgroundColor: metric.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Power & Thermal Telemetry */}
                <div className="pt-4 border-t border-g-borderSubtle grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[12px] text-g-textMuted">
                      Power
                    </span>
                    <span className="block text-[15px] font-semibold text-g-text tabular-nums mt-0.5">
                      {(machine.sensors?.power_kw ?? 0).toFixed(1)} kW
                    </span>
                  </div>
                  <div>
                    <span className="block text-[12px] text-g-textMuted">
                      Thermal
                    </span>
                    <span className="block text-[15px] font-semibold text-g-text tabular-nums mt-0.5">
                      {(machine.sensors?.temperature_c ?? 0).toFixed(1)} °C
                    </span>
                  </div>
                </div>

                {/* Current Work Order */}
                {machine.work_order && (
                  <div className="pt-4 border-t border-g-borderSubtle space-y-2">
                    <span className="block text-[12px] font-cinzel font-semibold uppercase tracking-[0.08em] text-g-textMuted">
                      Current work order
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-medium text-g-text bg-g-surfaceElevated border border-g-border px-2 py-0.5 rounded-[4px]">
                        {machine.work_order.order_id}
                      </span>
                      <span className="text-[12px] text-g-textSecondary tabular-nums">
                        {machine.work_order.batch_completed} /{' '}
                        {machine.work_order.batch_target} pcs
                      </span>
                    </div>
                    <p className="text-[13px] text-g-textSecondary truncate">
                      {machine.work_order.part_name}
                    </p>
                    <div className="w-full h-1 rounded-full bg-g-surfaceElevated overflow-hidden">
                      <GrowBar
                        value={
                          machine.work_order.batch_target > 0
                            ? (machine.work_order.batch_completed /
                                machine.work_order.batch_target) *
                              100
                            : 0
                        }
                        className="h-full rounded-full"
                        style={{ backgroundColor: 'var(--g-blue)' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Button */}
              <div className="p-6 border-t border-g-border">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSupervisoryControl(machine);
                  }}
                  className="twin-btn-primary-glow w-full h-10 px-4 rounded-[8px] bg-g-blue hover:bg-g-blueHover active:scale-[0.98] text-[14px] font-medium text-white inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
                >
                  <span>Open supervisory control</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }
);

FloorDrawer.displayName = 'FloorDrawer';

