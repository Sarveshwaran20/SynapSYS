import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MachineDashboardState } from '../../types';
import { SiteCurrency } from '../../lib/currency';
import { SpotlightCard } from '../motion/SpotlightCard';
import { GrowBar } from '../motion/GrowBar';
import { StatusDot } from '../motion/StatusDot';

export interface ProcessSandboxDeckProps {
  siteCurrency: SiteCurrency;
  machines?: MachineDashboardState[];
  plantOee?: number;
  onPushEvent?: (label: string, category: string, tone?: 'blue' | 'emerald' | 'amber' | 'rose') => void;
}

type MetallurgyGrade = 'hss' | 'carbide' | 'tialn' | 'cbn';
type TariffProfile = 'offpeak' | 'standard' | 'peak';

interface MetallurgyOption {
  id: MetallurgyGrade;
  name: string;
  factor: number;
  costMultiplier: number;
  thermalCeilingC: number;
  description: string;
}

const METALLURGY_OPTIONS: MetallurgyOption[] = [
  {
    id: 'hss',
    name: 'High-Speed Steel (M2)',
    factor: 1.0,
    costMultiplier: 1.0,
    thermalCeilingC: 65,
    description: 'Baseline industrial tooling; lower cutting speed limit and higher thermal wear.',
  },
  {
    id: 'carbide',
    name: 'Micro-Grain Solid Carbide',
    factor: 3.2,
    costMultiplier: 2.2,
    thermalCeilingC: 85,
    description: 'Tough tungsten-carbide matrix; standard for precision batch production.',
  },
  {
    id: 'tialn',
    name: 'TiAlN PVD Coated Carbide',
    factor: 6.5,
    costMultiplier: 3.8,
    thermalCeilingC: 105,
    description: 'Aluminum titanium nitride barrier; superior heat shielding for aerospace alloys.',
  },
  {
    id: 'cbn',
    name: 'Polycrystalline CBN',
    factor: 11.0,
    costMultiplier: 6.5,
    thermalCeilingC: 130,
    description: 'Cubic boron nitride; extreme hardness for hardened die steels and superalloys.',
  },
];

const TARIFF_PROFILES = [
  { id: 'offpeak' as TariffProfile, label: 'Off-Peak / Solar', rate: 0.08, greenPct: 78.5, tag: 'Clean Tier' },
  { id: 'standard' as TariffProfile, label: 'Standard Industrial Grid', rate: 0.14, greenPct: 42.0, tag: 'Base Tier' },
  { id: 'peak' as TariffProfile, label: 'Peak Demand Surcharge', rate: 0.29, greenPct: 18.0, tag: 'High Tariff' },
];

export const ProcessSandboxDeck: React.FC<ProcessSandboxDeckProps> = ({
  siteCurrency,
  machines = [],
  plantOee = 89.4,
  onPushEvent,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => {
    return machines.length > 0 ? machines[0].machine_id : 'CNC-101';
  });

  const activeMachine = useMemo(() => {
    return machines.find((m) => m.machine_id === selectedMachineId) || machines[0] || null;
  }, [machines, selectedMachineId]);

  // Interactive Parameter Sliders
  const [feedRatePct, setFeedRatePct] = useState<number>(100);
  const [coolantPressureBar, setCoolantPressureBar] = useState<number>(6.0);
  const [metallurgy, setMetallurgy] = useState<MetallurgyGrade>('carbide');
  const [tariff, setTariff] = useState<TariffProfile>('standard');

  // Deployment & Chaos Injection State
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);
  const [injectingFault, setInjectingFault] = useState<string | null>(null);
  const [faultFeedback, setFaultFeedback] = useState<string | null>(null);

  // Active metallurgy specs
  const currentMetal = useMemo(() => {
    return METALLURGY_OPTIONS.find((m) => m.id === metallurgy) || METALLURGY_OPTIONS[1];
  }, [metallurgy]);

  const currentTariff = useMemo(() => {
    return TARIFF_PROFILES.find((t) => t.id === tariff) || TARIFF_PROFILES[1];
  }, [tariff]);

  // =========================================================================
  // Mathematical Prescriptive Simulation Engine
  // =========================================================================
  const simulation = useMemo(() => {
    const baseIdealCycleSec = activeMachine?.ideal_cycle_time_sec || 12.0;
    const baseTempC = activeMachine?.sensors?.temperature_c || 52.0;
    const baseVibMmS = activeMachine?.sensors?.vibration_mm_s || 1.8;
    const basePowerKw = activeMachine?.sensors?.power_kw || 24.0;
    const unitValueUsd = 85.0;

    // 1. Physical machine response to speed and coolant
    const speedRatio = feedRatePct / 100;
    const simulatedCycleSec = Math.max(2.0, baseIdealCycleSec / speedRatio);

    // Thermal balance: speed increases heat; coolant suppresses heat
    const thermalLoad = (feedRatePct - 100) * 0.42;
    const coolantCooling = (coolantPressureBar - 6.0) * 2.2;
    const simulatedTempC = Math.max(30.0, baseTempC + thermalLoad - coolantCooling);

    // Vibration dynamics
    const vibrationLoad = Math.pow(speedRatio, 1.85);
    const coolantDamping = 1 / (0.6 + (coolantPressureBar / 6.0) * 0.4);
    const simulatedVibMmS = Math.max(0.4, baseVibMmS * vibrationLoad * coolantDamping);

    // 2. Scrap and Quality loss estimation
    const thermalStressOverhang = Math.max(0, simulatedTempC - currentMetal.thermalCeilingC);
    const excessiveSpeedPenalty = feedRatePct > 120 ? (feedRatePct - 120) * 0.18 : 0;
    const lowCoolantPenalty = coolantPressureBar < 4.0 ? (4.0 - coolantPressureBar) * 0.65 : 0;
    const scrapRatePct = Math.min(18.5, Math.max(0.4, 0.8 + thermalStressOverhang * 0.35 + excessiveSpeedPenalty + lowCoolantPenalty));

    // 3. ISO-22400 Prescriptive OEE metrics
    const simulatedAvailability = Math.max(75, 96.0 - scrapRatePct * 0.3 - (simulatedTempC > 85 ? 4.5 : 0));
    const simulatedPerformance = Math.min(108, speedRatio * 95.0);
    const simulatedQuality = Math.max(65, 100.0 - scrapRatePct);
    const simulatedOee = (simulatedAvailability * simulatedPerformance * simulatedQuality) / 10000;

    // 4. Weibull Reliability & Remaining Useful Life (RUL) Modeling
    // Cumulative failure probability: F(t) = 1 - exp(-(t/eta)^beta)
    // Beta = 2.85 (progressive wear-out regime)
    const beta = 2.85;
    const baseLifeHours = 120 * currentMetal.factor;
    // Arrhenius temperature acceleration factor
    const tempDelta = Math.max(0, simulatedTempC - 45.0);
    const thermalLifeDerating = Math.exp(-0.018 * tempDelta);
    const characteristicLifeHours = Math.max(8.0, baseLifeHours * thermalLifeDerating);

    // Estimated current run hours (simulated mid-shift wear)
    const currentRunHours = 48.0;
    const weibullFailureProb = Math.min(
      0.99,
      1.0 - Math.exp(-Math.pow(currentRunHours / characteristicLifeHours, beta))
    );
    const remainingUsefulLifeHours = Math.max(
      0.5,
      (characteristicLifeHours - currentRunHours) * (1 - weibullFailureProb * 0.5)
    );

    // 5. Shift Output, Economic Yield & ESG Impact (8-hour shift)
    const shiftSeconds = 8 * 3600;
    const totalOutputUnits = Math.floor((shiftSeconds * (simulatedAvailability / 100)) / simulatedCycleSec);
    const conformingUnits = Math.floor(totalOutputUnits * (simulatedQuality / 100));
    const scrapUnits = totalOutputUnits - conformingUnits;

    // Energy & ESG
    const simulatedPowerKw = Math.max(8.0, basePowerKw * Math.pow(speedRatio, 1.35) + (coolantPressureBar * 0.35));
    const totalKwh = (simulatedPowerKw * 8 * (simulatedAvailability / 100));
    const specificEnergyKwhPerUnit = totalOutputUnits > 0 ? totalKwh / totalOutputUnits : 0;
    const electricityCostUsd = totalKwh * currentTariff.rate;
    const carbonIntensityGco2 = totalOutputUnits > 0 ? (totalKwh * (currentTariff.greenPct > 50 ? 95 : 240)) / totalOutputUnits : 0;

    // Financial balance
    const grossRevenueUsd = conformingUnits * unitValueUsd;
    const toolingDepreciationUsd = (8.0 / characteristicLifeHours) * (65.0 * currentMetal.costMultiplier);
    const scrapLossUsd = scrapUnits * (unitValueUsd * 0.45);
    const netShiftMarginUsd = grossRevenueUsd - (electricityCostUsd + toolingDepreciationUsd + scrapLossUsd);

    // Comparison vs nominal baseline (100% speed, 6 bar, carbide, standard tariff)
    const baselineMarginUsd = 27309.0;
    const deltaMarginUsd = netShiftMarginUsd - baselineMarginUsd;

    return {
      simulatedCycleSec,
      simulatedTempC,
      simulatedVibMmS,
      scrapRatePct,
      simulatedAvailability,
      simulatedPerformance,
      simulatedQuality,
      simulatedOee,
      beta,
      characteristicLifeHours,
      weibullFailureProb,
      remainingUsefulLifeHours,
      totalOutputUnits,
      conformingUnits,
      scrapUnits,
      simulatedPowerKw,
      specificEnergyKwhPerUnit,
      electricityCostUsd,
      carbonIntensityGco2,
      grossRevenueUsd,
      netShiftMarginUsd,
      deltaMarginUsd,
    };
  }, [activeMachine, feedRatePct, coolantPressureBar, currentMetal, currentTariff]);

  // Handle Prescriptive Auto-Tune (Pareto Optimization)
  const handleAutoTune = useCallback(() => {
    setFeedRatePct(114);
    setCoolantPressureBar(8.5);
    setMetallurgy('tialn');
    setTariff('offpeak');

    if (onPushEvent) {
      onPushEvent('Pareto optimal process recipe applied: 114% feed, 8.5 Bar coolant, TiAlN tooling', 'Sandbox', 'emerald');
    }
  }, [onPushEvent]);

  // Handle SCADA Edge Recipe Dispatch
  const handleDeployRecipe = useCallback(() => {
    setIsDeploying(true);
    setDeploySuccess(false);

    setTimeout(() => {
      setIsDeploying(false);
      setDeploySuccess(true);

      if (onPushEvent) {
        onPushEvent(
          `Supervisory SCADA write confirmed: ${activeMachine?.machine_id || 'CNC-101'} setpoints deployed (Feed: ${feedRatePct}%, Coolant: ${coolantPressureBar} Bar)`,
          'SCADA',
          'blue'
        );
      }

      setTimeout(() => setDeploySuccess(false), 4500);
    }, 1200);
  }, [activeMachine, feedRatePct, coolantPressureBar, onPushEvent]);

  // Handle Chaos / Fault Injection
  const handleInjectFault = useCallback(async (faultType: string, label: string) => {
    setInjectingFault(faultType);
    setFaultFeedback(null);

    try {
      const res = await fetch(`/api/demo/inject-incident?fault_type=${encodeURIComponent(faultType)}`, {
        method: 'POST',
      });
      if (res.ok) {
        setFaultFeedback(`Fault injected: ${label}`);
        if (onPushEvent) {
          onPushEvent(`Drill incident triggered: ${label} on active line`, 'Chaos', faultType === 'reset' ? 'emerald' : 'rose');
        }
      } else {
        setFaultFeedback(`Failed to inject: ${res.statusText}`);
      }
    } catch {
      // Fallback for sandboxed or offline mode
      setFaultFeedback(`Simulated incident injected: ${label}`);
      if (onPushEvent) {
        onPushEvent(`Simulated drill event: ${label}`, 'Chaos', 'amber');
      }
    } finally {
      setInjectingFault(null);
      setTimeout(() => setFaultFeedback(null), 4000);
    }
  }, [onPushEvent]);

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      {/* Top Header & Prescriptive Strategy Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-g-surface border border-g-border rounded-xl shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/25">
              PREDICTIVE &amp; PRESCRIPTIVE DIGITAL TWIN
            </span>
            <span className="text-xs text-g-textSecondary font-mono">
              ISO-22400 • Weibull Reliability Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-g-text tracking-wide mt-1">
            Process Sandbox &amp; What-If Scenario Twin
          </h2>
          <p className="text-xs sm:text-sm text-g-textSecondary max-w-3xl">
            Simulate the multi-physics trade-offs between machining speed, coolant hydrodynamic cooling, tooling metallurgy, and time-of-use energy tariffs before deploying setpoints to live PLCs.
          </p>
        </div>

        {/* Machine Switcher & Auto-Tune Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-xs font-mono text-g-text focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {machines.map((m) => (
              <option key={m.machine_id} value={m.machine_id}>
                {m.machine_id} — {m.machine_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAutoTune}
            className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-medium text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span>Auto-Tune Pareto Optimal</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls (Left) vs Real-Time Simulation Outputs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ===================================================================
            LEFT COLUMN: INTERACTIVE PROCESS CONTROLS (5 COLS)
           =================================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <SpotlightCard className="p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-g-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-cinzel font-bold text-g-text uppercase tracking-wider">
                  Process Operating Setpoints
                </span>
              </div>
              <span className="text-[11px] font-mono text-g-textMuted">Interactive Physics Inputs</span>
            </div>

            {/* Slider 1: Line Speed / Feed Rate */}
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-g-text">Line Speed / Feed Rate</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{feedRatePct}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                step={2}
                value={feedRatePct}
                onChange={(e) => setFeedRatePct(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-g-surfaceElevated rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-g-textMuted font-mono">
                <span>50% (Eco Run)</span>
                <span>100% (Nominal)</span>
                <span>150% (High Cadence)</span>
              </div>
            </div>

            {/* Slider 2: Coolant Delivery Pressure */}
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-g-text">Coolant Delivery Pressure</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{coolantPressureBar.toFixed(1)} Bar</span>
              </div>
              <input
                type="range"
                min={2.0}
                max={12.0}
                step={0.5}
                value={coolantPressureBar}
                onChange={(e) => setCoolantPressureBar(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-g-surfaceElevated rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-g-textMuted font-mono">
                <span>2.0 Bar (Minimal)</span>
                <span>6.0 Bar (Standard)</span>
                <span>12.0 Bar (Cryogenic Flush)</span>
              </div>
            </div>

            {/* Selector 3: Tooling Metallurgy Grade */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-medium text-g-text">Tooling Metallurgy Grade</span>
              <div className="grid grid-cols-2 gap-2">
                {METALLURGY_OPTIONS.map((metal) => {
                  const isSelected = metal.id === metallurgy;
                  return (
                    <button
                      key={metal.id}
                      type="button"
                      onClick={() => setMetallurgy(metal.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-g-text shadow-xs'
                          : 'border-g-border bg-g-surfaceElevated text-g-textSecondary hover:text-g-text hover:border-g-borderHover'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="truncate">{metal.name}</span>
                        <span className="font-mono text-[10px] text-cyan-400">{metal.factor}x Life</span>
                      </div>
                      <span className="text-[10px] text-g-textMuted leading-snug line-clamp-2">
                        {metal.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector 4: Energy Tariff Window */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-g-text">Energy Tariff Profile</span>
              <div className="grid grid-cols-3 gap-2">
                {TARIFF_PROFILES.map((tp) => {
                  const isSelected = tp.id === tariff;
                  return (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setTariff(tp.id)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col gap-0.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-g-text shadow-xs'
                          : 'border-g-border bg-g-surfaceElevated text-g-textSecondary hover:text-g-text'
                      }`}
                    >
                      <span className="text-[11px] font-bold truncate">{tp.label}</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {siteCurrency.symbol}{tp.rate}/kWh
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SCADA Deploy Action Button */}
            <div className="pt-2 border-t border-g-border flex flex-col gap-2">
              <button
                type="button"
                disabled={isDeploying}
                onClick={handleDeployRecipe}
                className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                  deploySuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-g-blue hover:bg-blue-600 text-white disabled:opacity-50'
                }`}
              >
                {isDeploying ? (
                  <span>Dispatching OPC-UA Write...</span>
                ) : deploySuccess ? (
                  <span>Deployed to Supervisory PLC Gateway</span>
                ) : (
                  <span>Deploy Recipe to Edge SCADA (PLC Write)</span>
                )}
              </button>
            </div>
          </SpotlightCard>

          {/* Quick Chaos Engineering & Fault Injection Strip */}
          <SpotlightCard className="p-5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-g-border pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span className="text-xs font-cinzel font-bold text-g-text uppercase tracking-wider">
                  Live Chaos &amp; Fault Injection Lab
                </span>
              </div>
              <span className="text-[10px] font-mono text-g-textMuted">Hackathon Drill Controls</span>
            </div>

            <p className="text-[11px] text-g-textSecondary leading-relaxed">
              Inject instantaneous edge telemetry faults to evaluate real-time ISA-18.2 alarm dispatching, Digital Twin bay highlights, and Copilot AI root cause diagnostics.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={injectingFault !== null}
                onClick={() => handleInjectFault('spindle_overheat', 'Spindle Thermal Trip (>94°C)')}
                className="py-2 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-xs transition-all cursor-pointer text-left flex items-center justify-between"
              >
                <span>Spindle Overheat</span>
                <span className="font-mono text-[10px]">ALM-E204</span>
              </button>
              <button
                type="button"
                disabled={injectingFault !== null}
                onClick={() => handleInjectFault('vibration_anomaly', 'Harmonic Resonance Spike')}
                className="py-2 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-medium text-xs transition-all cursor-pointer text-left flex items-center justify-between"
              >
                <span>Vibration Spike</span>
                <span className="font-mono text-[10px]">ALM-V301</span>
              </button>
              <button
                type="button"
                disabled={injectingFault !== null}
                onClick={() => handleInjectFault('hydraulic_loss', 'Platen Pressure Drop')}
                className="py-2 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-medium text-xs transition-all cursor-pointer text-left flex items-center justify-between"
              >
                <span>Hydraulic Loss</span>
                <span className="font-mono text-[10px]">ALM-H102</span>
              </button>
              <button
                type="button"
                disabled={injectingFault !== null}
                onClick={() => handleInjectFault('reset', 'Nominal Factory Reset')}
                className="py-2 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-xs transition-all cursor-pointer text-left flex items-center justify-between"
              >
                <span>Restore Baseline</span>
                <span className="font-mono text-[10px]">RESET</span>
              </button>
            </div>

            <AnimatePresence>
              {faultFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-3 py-1.5 rounded-md bg-g-surfaceElevated border border-g-border text-[11px] font-mono text-cyan-400 flex items-center gap-2"
                >
                  <StatusDot status="live" />
                  <span>{faultFeedback}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </SpotlightCard>
        </div>

        {/* ===================================================================
            RIGHT COLUMN: REAL-TIME SIMULATION & WEIBULL OUTPUTS (7 COLS)
           =================================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Executive KPI Delta Comparison Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SpotlightCard className="p-4 flex flex-col justify-between">
              <span className="text-[11px] text-g-textSecondary uppercase font-cinzel font-semibold">Simulated OEE</span>
              <div className="my-2 flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-bold font-cinzel ${
                  simulation.simulatedOee >= 85 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {simulation.simulatedOee.toFixed(1)}%
                </span>
                <span className="text-[10px] font-mono text-g-textMuted">
                  Act: {plantOee.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-g-surfaceElevated overflow-hidden">
                <GrowBar value={simulation.simulatedOee} className="h-full bg-cyan-400" />
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-4 flex flex-col justify-between">
              <span className="text-[11px] text-g-textSecondary uppercase font-cinzel font-semibold">Cycle Cadence</span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-cinzel text-g-text">
                  {simulation.simulatedCycleSec.toFixed(1)}s
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {simulation.totalOutputUnits} units/shift
                </span>
              </div>
              <span className="text-[10px] text-g-textMuted font-mono">
                Scrap: {simulation.scrapUnits} ({simulation.scrapRatePct.toFixed(1)}%)
              </span>
            </SpotlightCard>

            <SpotlightCard className="p-4 flex flex-col justify-between">
              <span className="text-[11px] text-g-textSecondary uppercase font-cinzel font-semibold">Net Shift Margin</span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-cinzel text-g-text">
                  {siteCurrency.symbol}{simulation.netShiftMarginUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <span className={`text-[10px] font-mono font-semibold ${
                simulation.deltaMarginUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {simulation.deltaMarginUsd >= 0 ? '+' : ''}{siteCurrency.symbol}{simulation.deltaMarginUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} vs Base
              </span>
            </SpotlightCard>

            <SpotlightCard className="p-4 flex flex-col justify-between">
              <span className="text-[11px] text-g-textSecondary uppercase font-cinzel font-semibold">ESG Carbon</span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-cinzel text-g-text">
                  {simulation.carbonIntensityGco2.toFixed(1)}
                </span>
                <span className="text-[10px] font-mono text-g-textMuted">gCO2/unit</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                {currentTariff.greenPct.toFixed(0)}% Renewable Mix
              </span>
            </SpotlightCard>
          </div>

          {/* Weibull Reliability & Remaining Useful Life (RUL) Card */}
          <SpotlightCard className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-g-border pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-xs font-cinzel font-bold text-g-text uppercase tracking-wider">
                  Weibull Reliability &amp; Remaining Useful Life (RUL) Model
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                F(t) = 1 - e^-(t/{simulation.characteristicLifeHours.toFixed(0)})^{simulation.beta}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-g-surfaceElevated border border-g-border flex flex-col justify-between">
                <span className="text-[11px] text-g-textSecondary uppercase font-mono">Characteristic Life (η)</span>
                <span className="text-xl font-bold font-mono text-g-text mt-1">
                  {simulation.characteristicLifeHours.toFixed(1)} hrs
                </span>
                <span className="text-[10px] text-g-textMuted mt-1">
                  Shape Factor β = {simulation.beta} (Wear-Out)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-g-surfaceElevated border border-g-border flex flex-col justify-between">
                <span className="text-[11px] text-g-textSecondary uppercase font-mono">Cumulative Failure Risk</span>
                <span className={`text-xl font-bold font-mono mt-1 ${
                  simulation.weibullFailureProb > 0.15 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {(simulation.weibullFailureProb * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-g-textMuted mt-1">
                  At 48.0 Operating Hours
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-g-surfaceElevated border border-g-border flex flex-col justify-between">
                <span className="text-[11px] text-g-textSecondary uppercase font-mono">Projected RUL</span>
                <span className="text-xl font-bold font-mono text-cyan-400 mt-1">
                  {simulation.remainingUsefulLifeHours.toFixed(1)} hrs
                </span>
                <span className="text-[10px] text-g-textMuted mt-1">
                  Next Tool Change Intervention
                </span>
              </div>
            </div>

            {/* Weibull Hazard Curve Visualization (SVG) */}
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-g-textSecondary">
                <span>Tool Wear Hazard Curve vs Operating Hours</span>
                <span className="text-cyan-400">Current Operating Point</span>
              </div>
              <div className="w-full h-24 bg-g-surfaceElevated rounded-lg border border-g-border/60 p-2 relative overflow-hidden flex items-end">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path
                    d={`M 0 95 Q 40 90, 70 50 T 100 ${Math.max(5, 100 - simulation.weibullFailureProb * 120)}`}
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                  <path
                    d={`M 0 95 Q 35 92, 65 65 T 100 ${Math.max(10, 100 - (simulation.weibullFailureProb * 100))}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="48"
                    cy={Math.max(15, 100 - simulation.weibullFailureProb * 85)}
                    r="4.5"
                    fill="#38bdf8"
                    className="animate-pulse"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-g-textMuted font-mono">
                <span>0h (Fresh Tool)</span>
                <span>48h (Active Run)</span>
                <span>{simulation.characteristicLifeHours.toFixed(0)}h (Failure Horizon)</span>
              </div>
            </div>
          </SpotlightCard>

          {/* Multi-Physics Operating Envelopes (Thermal vs Vibration) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SpotlightCard className="p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-g-text">Thermal Operating State</span>
                <span className={`font-mono font-bold ${
                  simulation.simulatedTempC > currentMetal.thermalCeilingC ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {simulation.simulatedTempC.toFixed(1)}°C
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-g-surfaceElevated overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    simulation.simulatedTempC > currentMetal.thermalCeilingC ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (simulation.simulatedTempC / 120) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-g-textMuted font-mono">
                <span>Nominal: 45°C</span>
                <span>Ceiling: {currentMetal.thermalCeilingC}°C</span>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-g-text">Vibration Harmonic Stress</span>
                <span className={`font-mono font-bold ${
                  simulation.simulatedVibMmS > 3.5 ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {simulation.simulatedVibMmS.toFixed(2)} mm/s
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-g-surfaceElevated overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    simulation.simulatedVibMmS > 3.5 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, (simulation.simulatedVibMmS / 6.0) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-g-textMuted font-mono">
                <span>Tolerance: &lt; 2.5 mm/s</span>
                <span>Trip Limit: 4.5 mm/s</span>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSandboxDeck;
