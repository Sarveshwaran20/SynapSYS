import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { dur, ease, useDocumentVisible } from '../../lib/motion';
import {
  AnimatedNumber,
  GrowBar,
  LiveWaveformScope,
  MotionButton,
  Reveal,
  SlidingTabGroup,
  SlidingTabIndicator,
  SpotlightCard,
  type ScopeChannel,
} from '../motion';

type RegimeId = 'nominal' | 'overdrive' | 'wear' | 'fault';

interface RegimePreset {
  id: RegimeId;
  label: string;
  tag: string;
  severity: 'optimal' | 'watch' | 'critical';
  cadencePct: number;
  microStopMin: number;
  qualityPct: number;
  baseTemp: number;
  baseVib: number;
  basePower: number;
  recommendation: string;
}

const REGIMES: RegimePreset[] = [
  {
    id: 'nominal',
    label: 'Nominal Run',
    tag: 'ISO-22400 Optimal',
    severity: 'optimal',
    cadencePct: 96,
    microStopMin: 2.0,
    qualityPct: 99.1,
    baseTemp: 52.4,
    baseVib: 1.42,
    basePower: 21.8,
    recommendation:
      'Spindle harmonic profile nominal. No unplanned maintenance intervention queued; auto-logging 250Hz OPC-UA frames.',
  },
  {
    id: 'overdrive',
    label: 'High-Speed Boost',
    tag: 'Throughput Push',
    severity: 'watch',
    cadencePct: 100,
    microStopMin: 3.5,
    qualityPct: 97.6,
    baseTemp: 64.8,
    baseVib: 2.38,
    basePower: 31.4,
    recommendation:
      'Feed rate elevated +8% over baseline. Watch thermal duty cycle on Bay 02 spindle bearings during sustained peak runs.',
  },
  {
    id: 'wear',
    label: 'Bearing Wear Drift',
    tag: 'Predictive RUL Watch',
    severity: 'watch',
    cadencePct: 86,
    microStopMin: 7.5,
    qualityPct: 95.8,
    baseTemp: 68.5,
    baseVib: 4.18,
    basePower: 25.9,
    recommendation:
      'RMS vibration crossed 3.8 mm/s advisory floor. SynapSYS recommends scheduling preventive bearing swap at shift handover.',
  },
  {
    id: 'fault',
    label: 'Cooling Interlock',
    tag: 'ISA-18.2 P1 Alert',
    severity: 'critical',
    cadencePct: 68,
    microStopMin: 16.0,
    qualityPct: 93.4,
    baseTemp: 82.6,
    baseVib: 3.65,
    basePower: 18.2,
    recommendation:
      'Coolant flow delta triggered P1 thermal protection. Automatic spindle derating keeps tolerance intact while maintenance responds.',
  },
];

function generateWaveSeries(
  base: number,
  amp: number,
  phase: number,
  jitterScale: number
): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 16; i += 1) {
    const theta = (i + phase) * 0.65;
    const harmonic = Math.sin(theta) * amp + Math.cos(theta * 1.9) * (amp * jitterScale);
    arr.push(Number((base + harmonic).toFixed(2)));
  }
  return arr;
}

export interface TelemetrySandboxLabProps {
  onLaunchDemo: () => void;
}

export const TelemetrySandboxLab: React.FC<TelemetrySandboxLabProps> = React.memo(
  ({ onLaunchDemo }) => {
    const shouldReduce = useReducedMotion();
    const isDocVisible = useDocumentVisible();

    const [regimeId, setRegimeId] = useState<RegimeId>('nominal');
    const [cadencePct, setCadencePct] = useState<number>(REGIMES[0].cadencePct);
    const [microStopMin, setMicroStopMin] = useState<number>(REGIMES[0].microStopMin);
    const [qualityPct, setQualityPct] = useState<number>(REGIMES[0].qualityPct);
    const [phaseTick, setPhaseTick] = useState<number>(0);

    const activeRegime = useMemo(
      () => REGIMES.find((r) => r.id === regimeId) || REGIMES[0],
      [regimeId]
    );

    const applyRegime = (next: RegimePreset) => {
      setRegimeId(next.id);
      setCadencePct(next.cadencePct);
      setMicroStopMin(next.microStopMin);
      setQualityPct(next.qualityPct);
    };

    // Subtle live waveform oscillation paused off-screen or under reduced motion
    useEffect(() => {
      if (shouldReduce || !isDocVisible) return;
      const timer = window.setInterval(() => {
        setPhaseTick((p) => (p + 1) % 60);
      }, 1300);
      return () => window.clearInterval(timer);
    }, [shouldReduce, isDocVisible]);

    // Real-time ISO-22400 factor derivation
    const metrics = useMemo(() => {
      const availabilityPct = Math.max(45, Math.min(99.8, 100 - (microStopMin / 60) * 100));
      const performancePct = Math.max(50, Math.min(100, cadencePct));
      const qualPct = Math.max(80, Math.min(100, qualityPct));
      const oeePct =
        (availabilityPct / 100) * (performancePct / 100) * (qualPct / 100) * 100;
      const unitsPerShift = Math.round((oeePct / 100) * 1450);
      const netYieldUsd = Math.round(unitsPerShift * 42 - microStopMin * 180);

      const loadScale = 0.72 + (performancePct / 100) * 0.35;
      const thermalPressure = (100 - availabilityPct) * 0.48 + (performancePct - 85) * 0.22;

      return {
        availabilityPct,
        performancePct,
        qualityPct: qualPct,
        oeePct,
        unitsPerShift,
        netYieldUsd,
        tempCenter: Math.max(40, activeRegime.baseTemp + thermalPressure),
        vibCenter: Math.max(0.6, activeRegime.baseVib + microStopMin * 0.06),
        powerCenter: Math.max(10, activeRegime.basePower * loadScale),
      };
    }, [cadencePct, microStopMin, qualityPct, activeRegime]);

    const channels = useMemo<ScopeChannel[]>(() => {
      const vibAmp = activeRegime.id === 'wear' ? 0.55 : activeRegime.id === 'fault' ? 0.45 : 0.22;
      const tempAmp = activeRegime.id === 'fault' ? 2.4 : 1.1;
      const powerAmp = activeRegime.id === 'overdrive' ? 2.1 : 1.3;
      return [
        {
          id: 'temp',
          label: 'Thermal',
          unit: '°C',
          color: '#F59E0B',
          min: 35,
          max: 95,
          threshold: 78,
          values: generateWaveSeries(metrics.tempCenter, tempAmp, phaseTick * 0.7, 0.3),
        },
        {
          id: 'vib',
          label: 'Vibration',
          unit: 'mm/s',
          color: '#4C8DF6',
          min: 0,
          max: 6.0,
          threshold: 3.8,
          values: generateWaveSeries(metrics.vibCenter, vibAmp, phaseTick * 1.1, 0.55),
        },
        {
          id: 'power',
          label: 'Load',
          unit: 'kW',
          color: '#10B981',
          min: 8,
          max: 42,
          values: generateWaveSeries(metrics.powerCenter, powerAmp, phaseTick * 0.9, 0.4),
        },
      ];
    }, [metrics, phaseTick, activeRegime.id]);

    const severityStyle =
      metrics.oeePct >= 82
        ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
        : metrics.oeePct >= 68
        ? 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/35'
        : 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/35';

    const oeeRingColor =
      metrics.oeePct >= 82
        ? 'var(--g-green)'
        : metrics.oeePct >= 68
        ? 'var(--g-yellow)'
        : 'var(--g-red)';

    return (
      <SpotlightCard
        surface={false}
        notch={false}
        className="lp-notch-card p-5 sm:p-8 bg-g-surface border border-g-border shadow-sm grid-container-surface"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-g-border">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-[4px] bg-g-blueLight border border-g-blue/30 text-g-blue text-[11px] font-mono font-semibold uppercase tracking-wider">
                Interactive Telemetry Bench
              </span>
              <span className={`px-2.5 py-0.5 rounded-[4px] border text-[11px] font-mono font-medium ${severityStyle}`}>
                {activeRegime.tag}
              </span>
            </div>
            <h3 className="font-cinzel text-lg sm:text-xl font-bold text-g-text mt-2">
              Tune plant parameters &amp; inspect live PLC oscilloscope response
            </h3>
          </div>

          <SlidingTabGroup id="lp-sandbox-regimes">
            <div
              role="tablist"
              aria-label="Simulated machine operating regimes"
              className="inline-flex flex-wrap p-1 rounded-[6px] bg-g-surfaceElevated border border-g-border gap-0.5"
            >
              {REGIMES.map((regime) => {
                const isSelected = regime.id === regimeId;
                return (
                  <button
                    key={regime.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => applyRegime(regime)}
                    className={`relative px-3 py-1.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-g-text'
                        : 'text-g-textSecondary hover:text-g-text'
                    }`}
                  >
                    {isSelected && (
                      <SlidingTabIndicator
                        layoutId="lp-sandbox-regime-pill"
                        variant="pill"
                        className="bg-g-surface border border-g-border shadow-xs"
                      />
                    )}
                    <span className="relative z-10 whitespace-nowrap">{regime.label}</span>
                  </button>
                );
              })}
            </div>
          </SlidingTabGroup>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
          {/* Left Column: Sliders + Live ISO-22400 Cascade */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-5">
            <div className="p-4 sm:p-5 rounded-xl bg-g-surfaceElevated border border-g-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-g-textMuted block">
                    Simulated Shift OEE
                  </span>
                  <AnimatedNumber
                    value={metrics.oeePct}
                    decimals={1}
                    suffix="%"
                    className="font-cinzel text-3xl sm:text-4xl font-bold text-g-text leading-tight mt-0.5 block"
                  />
                </div>

                <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90 shrink-0" aria-hidden="true">
                  <circle cx="36" cy="36" r="29" fill="none" stroke="var(--g-border)" strokeWidth="6" />
                  <motion.circle
                    cx="36"
                    cy="36"
                    r="29"
                    fill="none"
                    stroke={oeeRingColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={false}
                    animate={{ pathLength: Math.max(0.05, Math.min(1, metrics.oeePct / 100)) }}
                    transition={shouldReduce ? { duration: 0 } : { duration: 0.45, ease }}
                  />
                </svg>
              </div>

              {/* A x P x Q Bars */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-g-borderSubtle text-xs font-mono">
                <div>
                  <span className="text-g-textMuted block">Availability</span>
                  <strong className="text-g-text text-sm tabular-nums">
                    {metrics.availabilityPct.toFixed(1)}%
                  </strong>
                  <div className="mt-1.5 h-1.5 rounded-full bg-g-surface overflow-hidden">
                    <GrowBar value={metrics.availabilityPct} className="h-full rounded-full bg-amber-500" />
                  </div>
                </div>
                <div>
                  <span className="text-g-textMuted block">Performance</span>
                  <strong className="text-g-text text-sm tabular-nums">
                    {metrics.performancePct.toFixed(0)}%
                  </strong>
                  <div className="mt-1.5 h-1.5 rounded-full bg-g-surface overflow-hidden">
                    <GrowBar value={metrics.performancePct} className="h-full rounded-full bg-g-blue" />
                  </div>
                </div>
                <div>
                  <span className="text-g-textMuted block">Quality</span>
                  <strong className="text-g-text text-sm tabular-nums">
                    {metrics.qualityPct.toFixed(1)}%
                  </strong>
                  <div className="mt-1.5 h-1.5 rounded-full bg-g-surface overflow-hidden">
                    <GrowBar value={metrics.qualityPct} className="h-full rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Parameter Controls */}
            <div className="p-4 sm:p-5 rounded-xl bg-g-surfaceElevated border border-g-border space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <label htmlFor="sim-cadence" className="text-g-textSecondary font-medium">
                    Line Cadence Speed
                  </label>
                  <span className="text-g-text font-semibold tabular-nums">{cadencePct}%</span>
                </div>
                <input
                  id="sim-cadence"
                  type="range"
                  min={55}
                  max={100}
                  step={1}
                  value={cadencePct}
                  onChange={(e) => setCadencePct(Number(e.target.value))}
                  className="w-full scada-slider"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <label htmlFor="sim-stops" className="text-g-textSecondary font-medium">
                    Unplanned Micro-Stops / hr
                  </label>
                  <span className="text-g-text font-semibold tabular-nums">
                    {microStopMin.toFixed(1)} min
                  </span>
                </div>
                <input
                  id="sim-stops"
                  type="range"
                  min={0}
                  max={22}
                  step={0.5}
                  value={microStopMin}
                  onChange={(e) => setMicroStopMin(Number(e.target.value))}
                  className="w-full scada-slider"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <label htmlFor="sim-quality" className="text-g-textSecondary font-medium">
                    First-Pass Yield
                  </label>
                  <span className="text-g-text font-semibold tabular-nums">
                    {qualityPct.toFixed(1)}%
                  </span>
                </div>
                <input
                  id="sim-quality"
                  type="range"
                  min={84}
                  max={100}
                  step={0.1}
                  value={qualityPct}
                  onChange={(e) => setQualityPct(Number(e.target.value))}
                  className="w-full scada-slider"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Multi-Channel Waveform Scope + Projected Financials + CTA */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            <LiveWaveformScope
              channels={channels}
              title="OPC-UA Harmonic & Thermal Oscilloscope"
              subtitle="Live 3-channel synthetic trace mapped to your active regime & sliders"
              height={224}
              sampleLabels={['-16s WINDOW', '250Hz POLL STREAM']}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-g-textMuted block">
                    Projected Conforming Output
                  </span>
                  <AnimatedNumber
                    value={metrics.unitsPerShift}
                    decimals={0}
                    suffix=" units"
                    className="font-cinzel text-xl font-bold text-g-text mt-0.5 block"
                  />
                </div>
                <span className="text-xs font-mono px-2 py-1 rounded bg-g-surface border border-g-border text-g-textSecondary">
                  8h Shift
                </span>
              </div>

              <div className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-g-textMuted block">
                    Estimated Shift Contribution
                  </span>
                  <AnimatedNumber
                    value={metrics.netYieldUsd}
                    decimals={0}
                    prefix="$"
                    className="font-cinzel text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block"
                  />
                </div>
                <span className="text-xs font-mono px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
                  Net ROI
                </span>
              </div>
            </div>

            <Reveal as="div" immediate>
              <motion.div
                key={activeRegime.id}
                initial={shouldReduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: dur.fast, ease }}
                className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                <div className="text-xs sm:text-[13px] text-g-textSecondary leading-relaxed font-sans">
                  <strong className="text-g-text font-semibold mr-1.5 font-mono uppercase text-[11px]">
                    Edge Guidance:
                  </strong>
                  {activeRegime.recommendation}
                </div>
                <MotionButton
                  primary
                  type="button"
                  onClick={onLaunchDemo}
                  className="shrink-0 px-4 py-2 rounded-[6px] bg-g-blue hover:bg-g-blueHover text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <span>Inspect Live Twin →</span>
                </MotionButton>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </SpotlightCard>
    );
  }
);

TelemetrySandboxLab.displayName = 'TelemetrySandboxLab';

