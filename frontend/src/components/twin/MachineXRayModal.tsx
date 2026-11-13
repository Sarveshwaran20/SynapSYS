import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MachineDashboardState } from '../../types';
import { dur, ease } from '../../lib/motion';

export interface MachineXRayModalProps {
  machine: MachineDashboardState | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MachineXRayModal: React.FC<MachineXRayModalProps> = React.memo(
  ({ machine, isOpen, onClose }) => {
    const shouldReduce = useReducedMotion();
    const [audioActive, setAudioActive] = useState<boolean>(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);

    // Audio Sonification using native Web Audio API
    useEffect(() => {
      if (!isOpen || !audioActive || !machine) {
        if (oscRef.current) {
          try {
            oscRef.current.stop();
            oscRef.current.disconnect();
          } catch {
            // ignore
          }
          oscRef.current = null;
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }
        return;
      }

      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Calculate frequency based on vibration and temp
        const baseFreq = machine.status === 'Running' ? 110 + (machine.sensors?.vibration_mm_s || 1) * 20 : 60;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        // Low volume subtle hum
        gain.gain.setValueAtTime(0.04, ctx.currentTime);

        // Low-pass filter for a smooth industrial motor timbre
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
      } catch {
        // audio context failed or blocked by policy
      }

      return () => {
        if (oscRef.current) {
          try {
            oscRef.current.stop();
            oscRef.current.disconnect();
          } catch {
            // ignore
          }
          oscRef.current = null;
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }
      };
    }, [isOpen, audioActive, machine]);

    if (!isOpen || !machine) return null;

    const isRunning = machine.status === 'Running';
    const isFault = machine.status === 'Down';
    const tempC = machine.sensors?.temperature_c || 45.0;
    const vibration = machine.sensors?.vibration_mm_s || 1.2;
    const powerKw = machine.sensors?.power_kw || 15.0;
    const anomalyScore = machine.predictive?.anomaly_score || 12;

    // Thermal color calculation
    const thermalColor =
      tempC > 70
        ? 'rgba(239, 68, 68, 0.7)' // Red
        : tempC > 50
        ? 'rgba(245, 158, 11, 0.7)' // Amber
        : 'rgba(6, 182, 212, 0.7)'; // Cyan

    // Simulated 16-band FFT Equalizer heights based on vibration
    const fftBars = Array.from({ length: 16 }, (_, i) => {
      const harmonic = Math.sin(i * 0.8 + vibration) * 0.4 + 0.6;
      const heightPct = isRunning ? Math.min(100, Math.max(15, harmonic * vibration * 35)) : 8;
      return heightPct;
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduce ? undefined : { opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: dur.base, ease }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-g-surface border border-g-border rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-textSecondary hover:text-g-text flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>

          {/* Modal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-g-border pb-4 pr-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  2.5D Spatial X-Ray Lens
                </span>
                <span className="font-mono text-xs text-g-textMuted">
                  {machine.machine_id}
                </span>
              </div>
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-g-text mt-1">
                {machine.machine_name}
              </h3>
            </div>

            {/* Audio Sonification Toggle */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setAudioActive(!audioActive)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  audioActive
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-g-surfaceElevated border-g-border text-g-textSecondary hover:text-g-text'
                }`}
              >
                <span>{audioActive ? '🔊 Acoustic Audio: ON' : '🔈 Acoustic Audio: OFF'}</span>
              </button>
            </div>
          </div>

          {/* 2.5D Isometric Cutaway Core & FFT Audio Waveform */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Cutaway Schematic (7 Cols) */}
            <div className="lg:col-span-7 rounded-xl bg-gradient-to-b from-g-surfaceElevated/80 to-g-surface/90 border border-g-border p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
              {/* Background Grid Pattern */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, var(--g-border) 1px, transparent 1px), linear-gradient(to bottom, var(--g-border) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Thermal Glow Fluid Field */}
              <div
                className="absolute w-64 h-64 rounded-full blur-3xl opacity-40 transition-colors duration-700 pointer-events-none"
                style={{ backgroundColor: thermalColor }}
              />

              {/* Kinetic Motor Spindle SVG */}
              <div className="relative z-10 flex flex-col items-center">
                <svg className="w-56 h-56" viewBox="0 0 200 200">
                  {/* Outer Stator Ring */}
                  <circle
                    cx="100"
                    cy="100"
                    r="88"
                    fill="none"
                    stroke="var(--g-border)"
                    strokeWidth="4"
                    strokeDasharray="6 4"
                  />

                  {/* Concentric Thermal Radiation Rings */}
                  <circle
                    cx="100"
                    cy="100"
                    r="72"
                    fill="none"
                    stroke={thermalColor}
                    strokeWidth="2.5"
                    opacity={isRunning ? 0.9 : 0.3}
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="56"
                    fill="none"
                    stroke="var(--g-borderSubtle)"
                    strokeWidth="1.5"
                  />

                  {/* Rotating Rotor Core */}
                  <motion.g
                    animate={
                      shouldReduce || !isRunning
                        ? undefined
                        : { rotate: 360 }
                    }
                    transition={{
                      duration: Math.max(0.6, 2.5 - vibration * 0.4),
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{ originX: '100px', originY: '100px' }}
                  >
                    {/* Rotor Blades */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                      <line
                        key={deg}
                        x1="100"
                        y1="100"
                        x2={100 + 44 * Math.cos((deg * Math.PI) / 180)}
                        y2={100 + 44 * Math.sin((deg * Math.PI) / 180)}
                        stroke={isFault ? '#ef4444' : isRunning ? '#38bdf8' : '#94a3b8'}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    ))}
                    {/* Inner Hub */}
                    <circle cx="100" cy="100" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
                    <circle cx="100" cy="100" r="6" fill="#38bdf8" />
                  </motion.g>
                </svg>

                <div className="mt-2 text-center">
                  <span className="font-mono text-xs font-semibold text-g-text block">
                    Kinetic Core Turbine · {isRunning ? 'Running (1,450 RPM)' : 'Standby (0 RPM)'}
                  </span>
                  <span className="text-[11px] font-mono text-g-textSecondary">
                    Thermal gradient: {tempC.toFixed(1)}°C · Vibration: {vibration.toFixed(2)} mm/s RMS
                  </span>
                </div>
              </div>

              {/* Bottom Real-time 16-Band Acoustic FFT Spectrum */}
              <div className="w-full mt-6 pt-4 border-t border-g-border/60 z-10">
                <div className="flex items-center justify-between text-[11px] font-mono text-g-textMuted mb-2">
                  <span>Acoustic FFT Harmonic Spectrum</span>
                  <span>10 Hz — 20 kHz</span>
                </div>
                <div className="h-14 flex items-end justify-between gap-1 px-1">
                  {fftBars.map((h, i) => (
                    <motion.div
                      key={i}
                      animate={shouldReduce ? undefined : { height: `${h}%` }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className={`flex-1 rounded-t transition-colors ${
                        i > 12 && isFault
                          ? 'bg-rose-500'
                          : i > 8
                          ? 'bg-cyan-400'
                          : 'bg-cyan-500'
                      }`}
                      style={{ minHeight: '4px' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Subsystem Health Cards (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Card 1: Bearing & Mechanical Assembly */}
              <div className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-g-text">Bearing Race & Spindle</span>
                  <span
                    className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                      anomalyScore > 40
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {anomalyScore > 40 ? 'Risk Detected' : 'Nominal'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="bg-g-surface p-2 rounded border border-g-border/50">
                    <span className="text-g-textMuted block text-[10px]">Lube Viscosity</span>
                    <span className="font-semibold text-g-text">ISO VG 46</span>
                  </div>
                  <div className="bg-g-surface p-2 rounded border border-g-border/50">
                    <span className="text-g-textMuted block text-[10px]">Predicted RUL</span>
                    <span className="font-semibold text-cyan-300">
                      {machine.predictive?.remaining_useful_life_hrs || 840}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Electromagnetic Drive Inverter */}
              <div className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-g-text">Electromagnetic Drive</span>
                  <span className="text-xs font-mono text-g-textSecondary">
                    {powerKw.toFixed(1)} kW demand
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="bg-g-surface p-2 rounded border border-g-border/50">
                    <span className="text-g-textMuted block text-[10px]">Coil Voltage</span>
                    <span className="font-semibold text-g-text">398.2 V</span>
                  </div>
                  <div className="bg-g-surface p-2 rounded border border-g-border/50">
                    <span className="text-g-textMuted block text-[10px]">Harmonic THD</span>
                    <span className="font-semibold text-g-text">1.8%</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Pneumatic & Hydraulic Line */}
              <div className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-g-text">Fluid Dynamics</span>
                  <span className="text-xs font-mono text-emerald-400">Stable Flow</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="bg-g-surface p-2 rounded border border-g-border/50">
                    <span className="text-g-textMuted block text-[10px]">Line Pressure</span>
                    <span className="font-semibold text-g-text">
                      {machine.sensors?.pressure_bar ? `${machine.sensors.pressure_bar.toFixed(1)} bar` : '6.2 bar'}
                    </span>
                  </div>
                  <div className="bg-g-surface p-2 rounded border border-g-border/50">
                    <span className="text-g-textMuted block text-[10px]">Coolant Flow</span>
                    <span className="font-semibold text-g-text">14.8 L/min</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Optical Encoder & Cadence */}
              <div className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-g-text">Precision Encoder</span>
                  <span className="text-xs font-mono text-cyan-400">±0.002 mm</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="bg-g-surface p-2 rounded border border-g-border/50">
                    <span className="text-g-textMuted block text-[10px]">Pulse Cadence</span>
                    <span className="font-semibold text-g-text">10,000 ppr</span>
                  </div>
                  <div className="bg-g-surface p-2 rounded border border-g-border/50">
                    <span className="text-g-textMuted block text-[10px]">Cycle Cadence</span>
                    <span className="font-semibold text-g-text">
                      {machine.ideal_cycle_time_sec ? `${machine.ideal_cycle_time_sec}s` : '12.0s'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
);

MachineXRayModal.displayName = 'MachineXRayModal';
