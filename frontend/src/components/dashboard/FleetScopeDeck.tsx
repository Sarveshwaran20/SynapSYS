import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MachineDashboardState } from '../../types';
import { dur, ease, useDocumentVisible } from '../../lib/motion';
import {
  AnimatedNumber,
  GrowBar,
  LiveWaveformScope,
  MotionButton,
  RevealGroup,
  RevealItem,
  SlidingTabGroup,
  SlidingTabIndicator,
  SpotlightCard,
  StatusDot,
  type ScopeChannel,
} from '../motion';

export interface FleetScopeDeckProps {
  machines: MachineDashboardState[];
  focusMachineId?: string | null;
  onInspectMachine: (machine: MachineDashboardState) => void;
  onTriggerDrill: (faultType: string) => void;
  onClearAlarms: () => void;
}

function buildSensorHistory(
  center: number,
  amp: number,
  phase: number,
  minBound: number,
  cycleBias: number[] = []
): number[] {
  const out: number[] = [];
  for (let i = 0; i < 16; i += 1) {
    const cycOffset = cycleBias.length > 0 ? (cycleBias[i % cycleBias.length] - 1) * amp * 1.4 : 0;
    const ripple =
      Math.sin((i + phase) * 0.72) * amp * 0.65 +
      Math.cos((i + phase) * 1.45) * amp * 0.25;
    out.push(Math.max(minBound, Number((center + ripple + cycOffset).toFixed(2))));
  }
  return out;
}

export const FleetScopeDeck: React.FC<FleetScopeDeckProps> = React.memo(
  ({ machines, focusMachineId, onInspectMachine, onTriggerDrill, onClearAlarms }) => {
    const shouldReduce = useReducedMotion();
    const isDocVisible = useDocumentVisible();
    const [selectedId, setSelectedId] = useState<string>(
      () => focusMachineId || machines[0]?.machine_id || ''
    );
    const [tickPhase, setTickPhase] = useState(0);

    useEffect(() => {
      if (focusMachineId && machines.some((m) => m.machine_id === focusMachineId)) {
        setSelectedId(focusMachineId);
      }
    }, [focusMachineId, machines]);

    useEffect(() => {
      if (machines.length > 0 && !machines.some((m) => m.machine_id === selectedId)) {
        setSelectedId(machines[0].machine_id);
      }
    }, [machines, selectedId]);

    useEffect(() => {
      if (shouldReduce || !isDocVisible) return;
      const timer = window.setInterval(() => {
        setTickPhase((p) => (p + 1) % 60);
      }, 1400);
      return () => window.clearInterval(timer);
    }, [shouldReduce, isDocVisible]);

    const activeMachine = useMemo(
      () => machines.find((m) => m.machine_id === selectedId) || machines[0] || null,
      [machines, selectedId]
    );

    const channels = useMemo<ScopeChannel[]>(() => {
      if (!activeMachine) return [];
      const temp = activeMachine.sensors?.temperature_c ?? 52;
      const vib = activeMachine.sensors?.vibration_mm_s ?? 1.4;
      const power = activeMachine.sensors?.power_kw ?? 22;
      const ideal = Math.max(0.5, activeMachine.ideal_cycle_time_sec || 12);
      const cycleRatios = (activeMachine.recent_cycle_times || []).map((c) => c / ideal);
      const isFault = activeMachine.status === 'Down' || Boolean(activeMachine.active_alarm);

      return [
        {
          id: `${activeMachine.machine_id}-temp`,
          label: 'Thermal',
          unit: '°C',
          color: '#F59E0B',
          min: 30,
          max: 105,
          threshold: 82,
          values: buildSensorHistory(
            temp,
            isFault ? 2.6 : 1.15,
            tickPhase * 0.7,
            25,
            cycleRatios
          ),
        },
        {
          id: `${activeMachine.machine_id}-vib`,
          label: 'Vibration',
          unit: 'mm/s',
          color: '#4C8DF6',
          min: 0,
          max: 6.5,
          threshold: 3.8,
          values: buildSensorHistory(
            vib,
            isFault ? 0.52 : 0.2,
            tickPhase * 1.1,
            0.2,
            cycleRatios
          ),
        },
        {
          id: `${activeMachine.machine_id}-power`,
          label: 'Power',
          unit: 'kW',
          color: '#10B981',
          min: 0,
          max: 48,
          values: buildSensorHistory(
            power,
            isFault ? 1.8 : 1.1,
            tickPhase * 0.85,
            0.5,
            cycleRatios
          ),
        },
      ];
    }, [activeMachine, tickPhase]);

    if (!activeMachine) {
      return null;
    }

    const availPct = Math.round((activeMachine.oee_metrics?.availability || 0) * 100);
    const perfPct = Math.round((activeMachine.oee_metrics?.performance || 0) * 100);
    const qualPct = Math.round((activeMachine.oee_metrics?.quality || 0) * 100);
    const oeePct = activeMachine.oee_metrics?.oee_percentage || 0;
    const rulHours = activeMachine.predictive?.remaining_useful_life_hrs ?? 320;
    const anomalyPct = activeMachine.predictive?.anomaly_score ?? 12;
    const cycles = activeMachine.recent_cycle_times?.length
      ? activeMachine.recent_cycle_times
      : [12.1, 12.0, 12.2, 12.4, 12.1, 11.9, 12.0, 12.3];
    const maxCycle = Math.max(...cycles, activeMachine.ideal_cycle_time_sec * 1.3, 1);

    return (
      <div className="flex flex-col gap-5">
        {/* Asset Channel Selector Strip */}
        <div className="bg-g-surface border border-g-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 grid-container-surface">
          <div className="flex items-center gap-2.5">
            <StatusDot
              status={
                activeMachine.status === 'Down'
                  ? 'down'
                  : activeMachine.status === 'Idle'
                    ? 'standby'
                    : 'running'
              }
              size="md"
            />
            <div>
              <h4 className="font-cinzel text-sm sm:text-base font-semibold text-g-text leading-tight">
                {activeMachine.machine_id} · {activeMachine.machine_name}
              </h4>
              <p className="text-xs font-mono text-g-textSecondary mt-0.5">
                {activeMachine.location || 'Shop Floor'} · PLC:{' '}
                {activeMachine.plc_controller || 'OPC-UA Edge Node'}
              </p>
            </div>
          </div>

          <SlidingTabGroup id="fleet-scope-asset-tabs">
            <div className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-g-surfaceElevated border border-g-border">
              {machines.map((m) => {
                const isSelected = m.machine_id === activeMachine.machine_id;
                return (
                  <button
                    key={m.machine_id}
                    type="button"
                    onClick={() => setSelectedId(m.machine_id)}
                    className={`relative px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${isSelected
                        ? 'text-g-text font-semibold'
                        : 'text-g-textSecondary hover:text-g-text'
                      }`}
                  >
                    {isSelected && (
                      <SlidingTabIndicator
                        layoutId="fleet-scope-asset-pill"
                        variant="pill"
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${m.status === 'Down'
                            ? 'bg-rose-500'
                            : m.status === 'Idle'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                      />
                      <span>{m.machine_id}</span>
                      <span className="text-g-textMuted">
                        {(m.oee_metrics?.oee_percentage || 0).toFixed(0)}%
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </SlidingTabGroup>
        </div>

        {/* Synchronized Multi-Channel Signal Oscilloscope */}
        <motion.div
          key={activeMachine.machine_id}
          initial={shouldReduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.fast, ease }}
        >
          <LiveWaveformScope
            channels={channels}
            title={`Telemetry Oscilloscope · ${activeMachine.machine_id}`}
            subtitle={
              activeMachine.active_alarm
                ? `Active Excursion: ${activeMachine.active_alarm}`
                : 'Streaming spindle thermal envelope, RMS vibration harmonic & active kW load'
            }
            height={230}
            sampleLabels={['-16 SAMPLES', `CADENCE ${activeMachine.cycle_time_sec.toFixed(1)}s`]}
          />
        </motion.div>

        {/* Bottom 3-Column Correlation Grid */}
        <RevealGroup
          immediate
          staggerDelay={0.05}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          {/* Card 1: OEE Factor Triad */}
          <RevealItem variant="grid">
            <SpotlightCard className="p-5 h-full flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">
                    Efficiency Triad
                  </span>
                  <AnimatedNumber
                    value={oeePct}
                    decimals={1}
                    suffix="%"
                    className="font-cinzel text-2xl font-bold text-g-text mt-1 block"
                  />
                </div>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-g-surfaceElevated border border-g-border text-g-textSecondary">
                  {activeMachine.oee_metrics?.benchmark_status || 'Nominal'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-g-textSecondary">Availability</span>
                    <span className="text-g-text font-semibold">{availPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                    <GrowBar value={availPct} className="h-full rounded-full bg-amber-500" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-g-textSecondary">Performance</span>
                    <span className="text-g-text font-semibold">{perfPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                    <GrowBar value={perfPct} delay={0.05} className="h-full rounded-full bg-g-blue" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-g-textSecondary">Quality</span>
                    <span className="text-g-text font-semibold">{qualPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                    <GrowBar value={qualPct} delay={0.1} className="h-full rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </RevealItem>

          {/* Card 2: Cycle Time Jitter Spectrum */}
          <RevealItem variant="grid">
            <SpotlightCard className="p-5 h-full flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">
                    Cycle Jitter Spectrum
                  </span>
                  <p className="text-sm font-mono font-semibold text-g-text mt-1 tabular-nums">
                    {activeMachine.cycle_time_sec.toFixed(1)}s actual ·{' '}
                    <span className="text-g-textSecondary">
                      {activeMachine.ideal_cycle_time_sec.toFixed(1)}s ideal
                    </span>
                  </p>
                </div>
                <span className="text-xs font-mono text-g-blue">
                  Last {cycles.length} cycles
                </span>
              </div>

              <div
                className="flex items-end gap-1.5 h-24 pt-2 border-b border-g-border pb-1"
                aria-label="Recent cycle duration distribution bars"
              >
                {cycles.map((val, idx) => {
                  const pct = Math.max(0.18, Math.min(1, val / maxCycle));
                  const isElevated = val > activeMachine.ideal_cycle_time_sec * 1.12;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full gap-1"
                      title={`Cycle #${idx + 1}: ${val.toFixed(2)}s`}
                    >
                      <motion.div
                        initial={shouldReduce ? false : { scaleY: 0 }}
                        animate={{ scaleY: pct }}
                        transition={{
                          duration: shouldReduce ? 0 : 0.35,
                          delay: idx * 0.03,
                          ease,
                        }}
                        style={{ originY: 1 }}
                        className={`w-full h-full rounded-t-[3px] ${isElevated ? 'bg-amber-500/85' : 'bg-g-blue/80'
                          }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-g-textMuted">
                <span>Good: {activeMachine.good_count}</span>
                <span>Target: {activeMachine.target_output}</span>
              </div>
            </SpotlightCard>
          </RevealItem>

          {/* Card 3: Predictive RUL & Live Drill Bench */}
          <RevealItem variant="grid">
            <SpotlightCard className="p-5 h-full flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">
                    Remaining Useful Life
                  </span>
                  <AnimatedNumber
                    value={rulHours}
                    decimals={0}
                    suffix=" hrs"
                    className="font-cinzel text-2xl font-bold text-g-text mt-1 block"
                  />
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono border ${anomalyPct > 45
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                      : anomalyPct > 25
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                >
                  Anomaly {anomalyPct.toFixed(1)}%
                </span>
              </div>

              <div className="text-xs text-g-textSecondary space-y-2">
                <p>
                  Watch area:{' '}
                  <strong className="text-g-text font-medium">
                    {activeMachine.predictive?.component_at_risk || 'Spindle Assembly'}
                  </strong>
                </p>
                <div className="h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                  <GrowBar
                    value={Math.min(100, (rulHours / 500) * 100)}
                    className={`h-full rounded-full ${rulHours < 100 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-g-border">
                <MotionButton
                  onClick={() => onTriggerDrill('spindle_overheat')}
                  className="px-2.5 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-mono cursor-pointer"
                >
                  Test Thermal Spike
                </MotionButton>
                <MotionButton
                  onClick={onClearAlarms}
                  className="px-2.5 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono cursor-pointer"
                >
                  Restore Nominal
                </MotionButton>
                <MotionButton
                  primary
                  onClick={() => onInspectMachine(activeMachine)}
                  className="ml-auto px-3 py-1.5 rounded-md bg-g-blue hover:bg-g-blueHover text-white text-xs font-medium cursor-pointer"
                >
                  Inspect ↗
                </MotionButton>
              </div>
            </SpotlightCard>
          </RevealItem>
        </RevealGroup>
      </div>
    );
  }
);

FleetScopeDeck.displayName = 'FleetScopeDeck';

