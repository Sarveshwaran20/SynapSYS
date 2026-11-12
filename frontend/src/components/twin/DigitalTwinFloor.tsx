import React, { useMemo, useState } from 'react';
import { MachineDashboardState } from '../../types';
import { RevealGroup, RevealItem } from '../motion';
import { BayCard } from './BayCard';
import { ExpansionCard } from './ExpansionCard';
import { Conveyor } from './Conveyor';
import { AgvTrack } from './AgvTrack';
import { FloorDrawer } from './FloorDrawer';

export interface DigitalTwinFloorProps {
  machines: MachineDashboardState[];
  siteName: string;
  siteLocation?: string;
  lastSync: string;
  onAddAsset: () => void;
  onInspectSupervisory: (machine: MachineDashboardState) => void;
  onOpenWorkOrder?: (orderId: string, machineId: string) => void;
}

interface ParsedBayEntry {
  machine: MachineDashboardState;
  bayLabel: string;
  cellName: string;
  sortKey: number;
  originalIndex: number;
}

function toSentenceCellName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'Production cell';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase().replace(/\b([a-z])$/i, (c) => c.toUpperCase());
}

function parseBayEntry(machine: MachineDashboardState, index: number): ParsedBayEntry {
  const fallbackBayNumber = index + 1;
  const fallbackLabel = `Bay ${String(fallbackBayNumber).padStart(2, '0')}`;
  const rawLocation = (machine.location || '').trim();

  const match = rawLocation.match(
    /^Bay\s+([A-Za-z0-9]+)(?:\s*(?:-|—|–|\/\/)\s*(.*))?$/i
  );

  if (match) {
    const token = match[1].trim();
    const numeric = /^\d+$/.test(token) ? parseInt(token, 10) : fallbackBayNumber + 100;
    const normalizedToken = /^\d+$/.test(token)
      ? token.padStart(2, '0')
      : token;
    const rest = match[2] ? toSentenceCellName(match[2]) : 'Production cell';
    return {
      machine,
      bayLabel: `Bay ${normalizedToken}`,
      cellName: rest,
      sortKey: numeric,
      originalIndex: index,
    };
  }

  return {
    machine,
    bayLabel: fallbackLabel,
    cellName: rawLocation ? toSentenceCellName(rawLocation) : 'Production cell',
    sortKey: fallbackBayNumber,
    originalIndex: index,
  };
}

export const DigitalTwinFloor: React.FC<DigitalTwinFloorProps> = ({
  machines,
  siteName,
  siteLocation,
  lastSync,
  onAddAsset,
  onInspectSupervisory,
  onOpenWorkOrder,
}) => {
  const [drawerMachineId, setDrawerMachineId] = useState<string | null>(null);

  const orderedBays = useMemo(() => {
    const parsed = machines.map((m, idx) => parseBayEntry(m, idx));
    return [...parsed].sort((a, b) =>
      a.sortKey !== b.sortKey ? a.sortKey - b.sortKey : a.originalIndex - b.originalIndex
    );
  }, [machines]);

  const productionBays = orderedBays.slice(0, 3);
  const assemblyBays = orderedBays.slice(3);

  const activeDrawerEntry = useMemo(
    () => orderedBays.find((entry) => entry.machine.machine_id === drawerMachineId) || null,
    [orderedBays, drawerMachineId]
  );

  const cleanSiteName = siteName.replace(/\s*\(Production Live\)/i, '');
  const anyTransferActive = productionBays.some((b) => b.machine.status === 'Running');

  return (
    <section
      aria-label="Digital twin spatial floor layout"
      className="w-full max-w-[1280px] mx-auto space-y-6"
    >
      {/* 1. Header Row */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-cinzel text-[24px] font-bold text-g-text tracking-wide leading-tight">
            Digital twin
          </h2>
          <p className="text-[14px] text-g-textSecondary mt-1">
            {cleanSiteName} live floor layout
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Legend */}
          <div
            className="flex flex-wrap items-center gap-4 text-[13px] text-g-textSecondary"
            aria-label="Floor status legend"
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--g-green)' }}
                aria-hidden="true"
              />
              <span>Running</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--g-yellow)' }}
                aria-hidden="true"
              />
              <span>Standby</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--g-red)' }}
                aria-hidden="true"
              />
              <span>Fault</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-4 h-1 rounded-full"
                style={{ backgroundColor: 'var(--g-blue)' }}
                aria-hidden="true"
              />
              <span>Conveyor</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onAddAsset}
            className="twin-btn-primary-glow h-10 px-4 rounded-[8px] bg-g-blue hover:bg-g-blueHover active:scale-[0.98] text-[14px] font-medium text-white inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <span>Add asset</span>
          </button>
        </div>
      </header>

      {/* 2. Slim Info Strip */}
      <div className="py-3 border-y border-g-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px] text-g-textSecondary">
        <p className="truncate">
          {machines.length} active {machines.length === 1 ? 'asset' : 'assets'} mapped to physical cells. Select a cell to inspect telemetry.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-g-textMuted flex-shrink-0">
          <span>{siteLocation ? `${cleanSiteName} · ${siteLocation}` : cleanSiteName}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">Last sync: {lastSync}</span>
        </div>
      </div>

      {/* 3. Main Floor Plan Panel */}
      <div className="relative bg-g-surface border border-g-border rounded-[12px] p-6 sm:p-8 twin-floor-grid grid-container-surface overflow-x-auto">
        {/* Continuous Closed Return Conveyor Loop on Desktop (never dangles) */}
        <div
          className="hidden lg:block pointer-events-none absolute inset-4 rounded-[12px] border border-dashed border-g-border opacity-60"
          aria-hidden="true"
        />

        <div className="relative z-10 w-full space-y-6">
          {/* Desktop Return Conveyor Badge Marker (clearly attached to closed loop) */}
          <div className="hidden lg:flex items-center justify-between">
            <h3 className="font-cinzel text-[12px] font-semibold uppercase tracking-[0.1em] text-g-textMuted">
              Production line
            </h3>
            <span
              tabIndex={0}
              className="group/ret relative inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-g-surfaceElevated border border-g-border text-[12px] text-g-textMuted focus:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: anyTransferActive
                    ? 'var(--g-blue)'
                    : 'var(--g-border)',
                }}
              />
              <span>Return conveyor loop</span>
              <span
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover/ret:opacity-100 group-focus-visible/ret:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-1.5 whitespace-nowrap z-30 px-2.5 py-1 rounded-[4px] bg-g-surfaceElevated border border-g-border text-[12px] text-g-text shadow-md"
              >
                Closed floor return path · {anyTransferActive ? 'Active' : 'Standby'}
              </span>
            </span>
          </div>

          <h3 className="lg:hidden font-cinzel text-[12px] font-semibold uppercase tracking-[0.1em] text-g-textMuted">
            Production line
          </h3>

          {/* Row 1: Production Line (Fluid 1/2/3 cols, 32px col gap, 40px row gap) */}
          <RevealGroup
            immediate
            staggerDelay={0.06}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 items-stretch"
          >
            {productionBays.map((entry, idx) => {
              const hasRightDesktop =
                idx < productionBays.length - 1 && idx % 3 < 2;
              const hasRightTablet =
                idx < productionBays.length - 1 && idx % 2 === 0;
              const nextBay = productionBays[idx + 1];
              const linkActive =
                entry.machine.status === 'Running' &&
                nextBay?.machine.status === 'Running';

              return (
                <RevealItem
                  key={entry.machine.machine_id}
                  variant="grid"
                  className="relative flex flex-col"
                >
                  <BayCard
                    bayLabel={entry.bayLabel}
                    cellName={entry.cellName}
                    machine={entry.machine}
                    onSelectDrawer={(m) => setDrawerMachineId(m.machine_id)}
                    onInspectSupervisory={onInspectSupervisory}
                    onOpenWorkOrder={onOpenWorkOrder}
                  />

                  {/* Horizontal Conveyor in Grid Gap (Desktop 3-col) */}
                  {hasRightDesktop && (
                    <div className="hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 -right-10 z-20">
                      <Conveyor
                        orientation="horizontal"
                        active={linkActive}
                        label={`${entry.bayLabel} to ${nextBay.bayLabel}`}
                        staggerDelay={idx * 0.45}
                      />
                    </div>
                  )}

                  {/* Horizontal Conveyor in Grid Gap (Tablet 2-col) */}
                  {hasRightTablet && (
                    <div className="hidden md:flex lg:hidden items-center justify-center absolute top-1/2 -translate-y-1/2 -right-10 z-20">
                      <Conveyor
                        orientation="horizontal"
                        active={linkActive}
                        label={`${entry.bayLabel} to ${nextBay.bayLabel}`}
                        staggerDelay={idx * 0.45}
                      />
                    </div>
                  )}
                </RevealItem>
              );
            })}
          </RevealGroup>

          {/* Labeled Slim 40px Aisle Strip + Vertical Step-Down Flow Connector */}
          <div className="relative h-10 flex items-center justify-center my-2">
            {/* Vertical Cross-Aisle Connector Centered Under Column 1 (Bay 01 -> Bay 04) */}
            {productionBays.length > 0 && assemblyBays.length > 0 && (
              <div
                className="hidden lg:flex items-center justify-center absolute top-0 bottom-0 -translate-x-1/2 z-20"
                style={{ left: 'calc((100% - 64px) / 6)' }}
              >
                <Conveyor
                  orientation="vertical"
                  active={
                    productionBays[0].machine.status === 'Running' &&
                    assemblyBays[0].machine.status === 'Running'
                  }
                  label={`${productionBays[0].bayLabel} to ${assemblyBays[0].bayLabel}`}
                  staggerDelay={0.9}
                />
              </div>
            )}

            <div className="relative w-full flex items-center justify-center">
              <div
                className="w-full border-t border-dashed border-g-border"
                aria-hidden="true"
              />
              <span className="px-4 bg-g-surface text-[12px] font-cinzel uppercase tracking-[0.1em] text-g-textMuted inline-flex items-center gap-2 whitespace-nowrap relative z-10">
                <span aria-hidden="true">→</span>
                <span>Logistics highway 01</span>
                <span aria-hidden="true">→</span>
              </span>
            </div>
          </div>

          {/* Zone 2: Assembly and Expansion */}
          <div>
            <h3 className="font-cinzel text-[12px] font-semibold uppercase tracking-[0.1em] text-g-textMuted mb-4">
              Assembly and expansion
            </h3>

            <RevealGroup
              immediate
              staggerDelay={0.06}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 items-stretch"
            >
              {assemblyBays.map((entry, idx) => {
                const isBeforeExpansion = idx === assemblyBays.length - 1;
                const nextEntry = assemblyBays[idx + 1];
                const hasRightDesktop =
                  (idx % 3 < 2) && (idx < assemblyBays.length - 1 || isBeforeExpansion);
                const hasRightTablet =
                  (idx % 2 === 0) && (idx < assemblyBays.length - 1 || isBeforeExpansion);

                const linkActive = nextEntry
                  ? entry.machine.status === 'Running' &&
                    nextEntry.machine.status === 'Running'
                  : false;

                return (
                  <RevealItem
                    key={entry.machine.machine_id}
                    variant="grid"
                    className="relative flex flex-col"
                  >
                    <BayCard
                      bayLabel={entry.bayLabel}
                      cellName={entry.cellName}
                      machine={entry.machine}
                      onSelectDrawer={(m) => setDrawerMachineId(m.machine_id)}
                      onInspectSupervisory={onInspectSupervisory}
                      onOpenWorkOrder={onOpenWorkOrder}
                    />

                    {hasRightDesktop && (
                      <div className="hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 -right-10 z-20">
                        <Conveyor
                          orientation="horizontal"
                          active={linkActive}
                          label={
                            nextEntry
                              ? `${entry.bayLabel} to ${nextEntry.bayLabel}`
                              : `${entry.bayLabel} to expansion slot`
                          }
                          staggerDelay={1.1}
                        />
                      </div>
                    )}

                    {hasRightTablet && (
                      <div className="hidden md:flex lg:hidden items-center justify-center absolute top-1/2 -translate-y-1/2 -right-10 z-20">
                        <Conveyor
                          orientation="horizontal"
                          active={linkActive}
                          label={
                            nextEntry
                              ? `${entry.bayLabel} to ${nextEntry.bayLabel}`
                              : `${entry.bayLabel} to expansion slot`
                          }
                          staggerDelay={1.1}
                        />
                      </div>
                    )}
                  </RevealItem>
                );
              })}

              {/* Expansion Slot Card */}
              <RevealItem className="flex flex-col">
                <ExpansionCard
                  bayLabel={`Bay ${String(orderedBays.length + 1).padStart(2, '0')}`}
                  onAddAsset={onAddAsset}
                />
              </RevealItem>
            </RevealGroup>
          </div>

          {/* Zone 3: Dedicated Autonomous Track Lane 02 */}
          <AgvTrack
            agvName="AGV-04 Fleet runner"
            voltage="48V"
            speed="0.8 m/s"
          />
        </div>
      </div>

      {/* 4. Slide-in Floor Telemetry Drawer */}
      <FloorDrawer
        machine={activeDrawerEntry?.machine || null}
        bayLabel={activeDrawerEntry?.bayLabel}
        cellName={activeDrawerEntry?.cellName}
        onClose={() => setDrawerMachineId(null)}
        onOpenSupervisoryControl={onInspectSupervisory}
      />
    </section>
  );
};
