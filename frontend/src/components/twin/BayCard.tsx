import React from 'react';
import { MachineDashboardState } from '../../types';
import { GrowBar, StatusDot } from '../motion';
import { OeeRing } from './OeeRing';

export interface BayCardProps {
  bayLabel: string;
  cellName: string;
  machine: MachineDashboardState;
  onSelectDrawer: (machine: MachineDashboardState) => void;
  onInspectSupervisory: (machine: MachineDashboardState) => void;
  onOpenWorkOrder?: (orderId: string, machineId: string) => void;
  onOpenXRay?: (machine: MachineDashboardState) => void;
}

export const BayCard: React.FC<BayCardProps> = React.memo(
  ({
    bayLabel,
    cellName,
    machine,
    onSelectDrawer,
    onInspectSupervisory,
    onOpenWorkOrder,
    onOpenXRay,
  }) => {
    const isRunning = machine.status === 'Running';
    const isFault = machine.status === 'Down';
    const isStandby = machine.status === 'Idle';

    const statusLabel = isRunning
      ? 'Running'
      : isFault
      ? 'Fault'
      : 'Standby';

    const dotVariant = isRunning ? 'running' : isFault ? 'alarm' : 'standby';

    const badgeClasses = isRunning
      ? 'bg-g-greenLight text-g-green border-g-green/30'
      : isFault
      ? 'bg-g-redLight text-g-red border-g-red/30'
      : 'bg-g-yellowLight text-g-yellow border-g-yellow/30';

    const oeePct = machine.oee_metrics?.oee_percentage ?? 0;
    const powerKw = machine.sensors?.power_kw ?? 0;
    const tempC = machine.sensors?.temperature_c ?? 0;
    const woId = machine.work_order?.order_id ?? 'WO-UNASSIGNED';
    const batchCompleted = machine.work_order?.batch_completed ?? 0;
    const batchTarget = machine.work_order?.batch_target ?? 100;
    const batchPct =
      batchTarget > 0 ? Math.min(100, (batchCompleted / batchTarget) * 100) : 0;

    const progressFillColor = isFault
      ? 'var(--g-red)'
      : isRunning
      ? 'var(--g-blue)'
      : 'var(--g-yellow)';

    return (
      <article
        className={`relative h-full flex flex-col justify-between p-6 bg-g-surface border border-g-border rounded-[12px] hover:-translate-y-0.5 hover:border-g-blue/40 transition-all duration-200 focus-within:ring-2 focus-within:ring-g-blue focus-within:ring-offset-2 focus-within:ring-offset-g-bg ${
          isFault ? 'border-l-2 border-l-g-red' : ''
        } ${isStandby ? 'opacity-85' : ''}`}
      >
        {/* Top Row: Bay Number & Non-Overlapping Status Pill */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[12px] font-medium text-g-textMuted truncate">
              {bayLabel}
            </span>
            <span
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[12px] font-medium ${badgeClasses}`}
            >
              <StatusDot status={dotVariant} size="sm" />
              <span>{statusLabel}</span>
            </span>
          </div>

          {/* Primary Stretched Card Action (opens telemetry side drawer) */}
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onSelectDrawer(machine)}
              aria-label={`Inspect ${machine.machine_name} in ${bayLabel} (${machine.machine_id}) telemetry drawer`}
              className="group/title text-left w-full min-w-0 focus:outline-none after:content-[''] after:absolute after:inset-0 after:z-0 after:rounded-[12px] cursor-pointer"
            >
              <h4
                className="text-[16px] font-semibold text-g-text truncate leading-snug"
                title={machine.machine_name}
              >
                {machine.machine_name}
              </h4>
              <span
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover/title:opacity-100 group-focus-visible/title:opacity-100 transition-opacity duration-150 absolute left-6 right-6 top-16 z-30 px-2.5 py-1.5 rounded-[4px] bg-g-surfaceElevated border border-g-border text-[12px] font-medium text-g-text shadow-md"
              >
                {machine.machine_name}
              </span>
            </button>

            <p className="text-[13px] text-g-textSecondary truncate mt-0.5">
              {cellName}
            </p>

            <div className="mt-2.5">
              <span className="inline-block font-mono text-[12px] font-medium text-g-textSecondary bg-g-surfaceElevated border border-g-border px-2 py-0.5 rounded-[4px]">
                {machine.machine_id}
              </span>
            </div>
          </div>

          {/* Center OEE Donut Ring */}
          <div className="flex justify-center py-2">
            <OeeRing value={oeePct} size={96} />
          </div>

          {/* Stats Row: Two Clean Columns Divided Only by Hairline */}
          <div className="border-t border-g-borderSubtle pt-3.5 grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[12px] text-g-textMuted">Power</span>
              <span className="block text-[14px] font-semibold text-g-text tabular-nums mt-0.5">
                {powerKw.toFixed(1)} kW
              </span>
            </div>
            <div>
              <span className="block text-[12px] text-g-textMuted">Thermal</span>
              <span className="block text-[14px] font-semibold text-g-text tabular-nums mt-0.5">
                {tempC.toFixed(1)} °C
              </span>
            </div>
          </div>

          {/* Work Order Progress */}
          <div className="border-t border-g-borderSubtle pt-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2 min-w-0">
              {onOpenWorkOrder ? (
                <button
                  type="button"
                  onClick={() => onOpenWorkOrder(woId, machine.machine_id)}
                  className="relative z-10 font-mono text-[12px] font-medium text-g-blue hover:underline truncate cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue rounded-[4px]"
                  aria-label={`View work order ${woId}`}
                >
                  {woId}
                </button>
              ) : (
                <span className="font-mono text-[12px] font-medium text-g-textSecondary truncate">
                  {woId}
                </span>
              )}
              <span className="flex-shrink-0 text-[12px] text-g-textSecondary tabular-nums">
                {batchCompleted} / {batchTarget} pcs
              </span>
            </div>

            <div className="w-full h-1 rounded-full bg-g-surfaceElevated overflow-hidden">
              <GrowBar
                value={batchPct}
                className="h-full rounded-full"
                style={{ backgroundColor: progressFillColor }}
              />
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-4 mt-4 border-t border-g-borderSubtle relative z-10 flex items-center gap-2">
          {onOpenXRay && (
            <button
              type="button"
              onClick={() => onOpenXRay(machine)}
              title="Open 2.5D Animated X-Ray Spatial Lens"
              aria-label={`Open X-Ray Lens for ${machine.machine_name}`}
              className="h-10 px-3 rounded-[8px] border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-[0.98] text-cyan-300 text-[13px] font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18M3 12h18" />
              </svg>
              <span>X-Ray</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onInspectSupervisory(machine)}
            aria-label={`Open supervisory control for ${machine.machine_name} (${machine.machine_id})`}
            className="flex-1 h-10 px-3 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle active:scale-[0.98] text-[13px] font-medium text-g-text inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue truncate"
          >
            <span>Control</span>
            <svg
              className="w-4 h-4 text-g-textSecondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>
      </article>
    );
  }
);

BayCard.displayName = 'BayCard';

