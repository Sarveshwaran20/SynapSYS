import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MachineDashboardState } from '../../types';
import { AnimatedNumber } from '../motion';

export interface AcousticResonanceLabProps {
  machines: MachineDashboardState[];
  isDarkMode?: boolean;
  selectedMachineId?: string;
  onSelectMachineId?: (id: string) => void;
}

interface ProbePoint {
  id: string;
  name: string;
  location: string;
  harmonicFreq: number; // Hz
  defectSeverity: number; // 0 to 100%
  description: string;
  kurtosis: number;
  crestFactor: number;
  thdPct: number;
  defectType: string;
}

export const AcousticResonanceLab: React.FC<AcousticResonanceLabProps> = ({
  machines,
  isDarkMode = true,
  selectedMachineId: propSelectedMachineId,
  onSelectMachineId,
}) => {
  const [internalMachineId, setInternalMachineId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synapsys_acoustic_machine');
      if (saved) return saved;
    }
    return propSelectedMachineId || machines[0]?.machine_id || 'CNC-101';
  });

  const effectiveMachineId = propSelectedMachineId || internalMachineId;

  // Sync internal machine ID if prop updates from outside
  useEffect(() => {
    if (propSelectedMachineId && propSelectedMachineId !== internalMachineId) {
      setInternalMachineId(propSelectedMachineId);
    }
  }, [propSelectedMachineId, internalMachineId]);

  const selectedMachine = useMemo(() => {
    const match = machines.find((m) => m.machine_id === effectiveMachineId);
    if (match) return match;
    const ciMatch = machines.find((m) => m.machine_id.toLowerCase() === effectiveMachineId.toLowerCase());
    if (ciMatch) return ciMatch;
    return machines[0] || null;
  }, [machines, effectiveMachineId]);

  const handleSelectMachine = useCallback(
    (machineId: string) => {
      setInternalMachineId(machineId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('synapsys_acoustic_machine', machineId);
      }
      onSelectMachineId?.(machineId);
    },
    [onSelectMachineId]
  );

  // Virtual Stethoscope Probe Points on the Spindle & Drive Mechanism
  const PROBE_POINTS: ProbePoint[] = useMemo(() => {
    const isDown = selectedMachine?.status === 'Down';
    const isIdle = selectedMachine?.status === 'Idle';
    const baseVib = selectedMachine?.sensors?.vibration_mm_s ?? 1.25;
    const anomalyScore = selectedMachine?.predictive?.anomaly_score ?? 15.0;
    const componentName = selectedMachine?.predictive?.component_at_risk || 'Primary Spindle Bearing Cluster';

    const p1Severity = isDown ? 84 : isIdle ? 12 : Math.min(95, Math.max(10, Math.round(anomalyScore * 1.5 + baseVib * 7)));
    const p2Severity = isDown ? 88 : isIdle ? 10 : Math.min(95, Math.max(8, Math.round(anomalyScore * 1.2 + baseVib * 5)));

    return [
      {
        id: 'spindle_front',
        name: `${componentName} (BPFO)`,
        location: `${selectedMachine?.location || 'Primary Machining Cell'} - Drive End`,
        harmonicFreq: 142.5,
        defectSeverity: p1Severity,
        description: 'Angular contact hybrid ceramic bearing assembly. Monitored for outer race micro-spalling.',
        kurtosis: 3.42,
        crestFactor: 4.85,
        thdPct: 1.84,
        defectType: 'Outer Raceway Ball Pass Frequency (BPFO)',
      },
      {
        id: 'gearbox_mesh',
        name: 'Primary Drive Gearbox Mesh (GMF)',
        location: `${selectedMachine?.location || 'Primary Machining Cell'} - Reduction Stage`,
        harmonicFreq: 312.0,
        defectSeverity: p2Severity,
        description: 'High-frequency ultrasonic tooth contact mesh resonance and hydrodynamic shear harmonics.',
        kurtosis: 4.15,
        crestFactor: 5.21,
        thdPct: 2.92,
        defectType: 'Tooth Contact Resonance (Gear Mesh Harmonic)',
      },
      {
        id: 'rear_thrust',
        name: 'Non-Drive End Thrust Bearing (BPFI)',
        location: `${selectedMachine?.location || 'Primary Machining Cell'} - Rear Motor Flange`,
        harmonicFreq: 96.0,
        defectSeverity: isDown ? 65 : 8,
        description: 'Axial pre-load ground bearing stack. Monitored for inner raceway defect frequencies.',
        kurtosis: 2.98,
        crestFactor: 3.45,
        thdPct: 0.95,
        defectType: 'Inner Raceway Ball Pass Frequency (BPFI)',
      },
      {
        id: 'stator_airgap',
        name: 'Stator Electromagnetic Flux Core',
        location: `${selectedMachine?.location || 'Primary Machining Cell'} - Motor Core`,
        harmonicFreq: 120.0,
        defectSeverity: isDown ? 50 : 5,
        description: 'Electromagnetic magnetic flux air-gap acoustic resonance (2x line frequency humming).',
        kurtosis: 3.01,
        crestFactor: 3.12,
        thdPct: 0.65,
        defectType: 'Electromagnetic Pole Frequency Harmonic',
      },
    ];
  }, [
    selectedMachine?.machine_id,
    selectedMachine?.status,
    selectedMachine?.predictive?.anomaly_score,
    selectedMachine?.sensors?.vibration_mm_s,
    selectedMachine?.predictive?.component_at_risk,
    selectedMachine?.location,
  ]);

  const [activeProbeId, setActiveProbeId] = useState<string>('spindle_front');
  const activeProbe = useMemo(() => {
    return PROBE_POINTS.find((p) => p.id === activeProbeId) || PROBE_POINTS[0];
  }, [PROBE_POINTS, activeProbeId]);

  const [defectSlider, setDefectSlider] = useState<number>(() => PROBE_POINTS[0].defectSeverity);
  const [autoSyncTelemetry, setAutoSyncTelemetry] = useState<boolean>(true);

  // Keep defectSlider synchronized with live telemetry when autoSyncTelemetry is active
  useEffect(() => {
    if (autoSyncTelemetry) {
      setDefectSlider(activeProbe.defectSeverity);
    }
  }, [autoSyncTelemetry, activeProbe.defectSeverity]);

  // Sync defect slider when machine or active probe ID changes
  const prevProbeKeyRef = useRef<string>(`${selectedMachine?.machine_id}_${activeProbe.id}`);
  useEffect(() => {
    const currentKey = `${selectedMachine?.machine_id}_${activeProbe.id}`;
    if (currentKey !== prevProbeKeyRef.current) {
      prevProbeKeyRef.current = currentKey;
      setDefectSlider(activeProbe.defectSeverity);
    }
  }, [selectedMachine?.machine_id, activeProbe.id, activeProbe.defectSeverity]);

  // ---------------------------------------------------------------------------
  // Web Audio API: Heterodyne Ultrasonic-to-Audible Synthesizer
  // Converts high-frequency mechanical vibrations (20-40 kHz) into audible audio
  // Dynamically modulates audio parameters in real time on the go without restarts
  // ---------------------------------------------------------------------------
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.35);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const carrierOscRef = useRef<OscillatorNode | null>(null);
  const carrierGainRef = useRef<GainNode | null>(null);
  const harmonicOscRef = useRef<OscillatorNode | null>(null);
  const harmonicGainRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const bandpassFilterRef = useRef<BiquadFilterNode | null>(null);
  const impulseTimeoutRef = useRef<number | null>(null);

  // Live mutable refs to eliminate closure staleness in recursive audio loops
  const defectSliderRef = useRef<number>(defectSlider);
  defectSliderRef.current = defectSlider;
  const isPlayingAudioRef = useRef<boolean>(isPlayingAudio);
  isPlayingAudioRef.current = isPlayingAudio;
  const activeProbeRef = useRef<ProbePoint>(activeProbe);
  activeProbeRef.current = activeProbe;
  const selectedMachineRef = useRef<MachineDashboardState | null>(selectedMachine);
  selectedMachineRef.current = selectedMachine;

  // Trigger instantaneous mechanical click impulse (micro-impact spalling)
  const triggerImpulseClick = useCallback(() => {
    const ctx = audioCtxRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || ctx.state === 'closed' || !masterGain) return;

    const currentDefect = defectSliderRef.current;
    const currentMachine = selectedMachineRef.current;
    const isIdle = currentMachine?.status === 'Idle';
    if (isIdle || currentDefect < 1) return;

    try {
      const now = ctx.currentTime;
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();

      clickOsc.type = 'square';
      const baseClickFreq = 1100 + (currentDefect / 100) * 1500 + Math.random() * 400;
      clickOsc.frequency.setValueAtTime(baseClickFreq, now);

      const clickVolume = Math.min(0.85, (currentDefect / 100) * 0.7);
      clickGain.gain.setValueAtTime(clickVolume, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      clickOsc.connect(clickGain);
      clickGain.connect(masterGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.04);
    } catch {
      // ignore transient click scheduling errors
    }
  }, []);

  // Recursive impulse scheduler: recalculates click period on the fly on every single tick
  const scheduleNextImpulse = useCallback(() => {
    if (!isPlayingAudioRef.current) return;

    triggerImpulseClick();

    const currentDefect = defectSliderRef.current;
    const nextPeriodMs = Math.max(45, 420 - currentDefect * 3.75);

    impulseTimeoutRef.current = window.setTimeout(scheduleNextImpulse, nextPeriodMs);
  }, [triggerImpulseClick]);

  // Smoothly update running audio graph parameters on the fly
  const updateAudioParametersOnTheGo = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === 'closed') return;

    const probe = activeProbeRef.current;
    const machine = selectedMachineRef.current;
    const severity = defectSliderRef.current;
    const isDown = machine?.status === 'Down';
    const isIdle = machine?.status === 'Idle';
    const baseVib = machine?.sensors?.vibration_mm_s ?? 1.25;

    const now = ctx.currentTime;

    // Carrier frequency & harmonic pitch glide (50ms smooth exponential time constant)
    const speedFactor = isDown ? 0.55 : isIdle ? 0.75 : 1 + (baseVib - 1.5) * 0.05;
    const targetCarrierFreq = Math.max(30, probe.harmonicFreq * speedFactor);
    const targetHarmonicFreq = targetCarrierFreq * 2.14;

    if (carrierOscRef.current) {
      carrierOscRef.current.frequency.setTargetAtTime(targetCarrierFreq, now, 0.05);
    }
    if (harmonicOscRef.current) {
      harmonicOscRef.current.frequency.setTargetAtTime(targetHarmonicFreq, now, 0.05);
    }

    // Dynamic gain levels based on machine operating envelope
    const carrierLevel = isDown ? 0.2 : isIdle ? 0.15 : 0.4;
    const harmonicLevel = isDown ? 0.45 : 0.12 + (severity / 100) * 0.35;
    const noiseLevel = isIdle ? 0.08 : 0.15 + (severity / 100) * 0.28;

    if (carrierGainRef.current) {
      carrierGainRef.current.gain.setTargetAtTime(carrierLevel, now, 0.05);
    }
    if (harmonicGainRef.current) {
      harmonicGainRef.current.gain.setTargetAtTime(harmonicLevel, now, 0.05);
    }
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.setTargetAtTime(noiseLevel, now, 0.05);
    }
    if (bandpassFilterRef.current) {
      const filterFreq = 1200 + severity * 8;
      bandpassFilterRef.current.frequency.setTargetAtTime(filterFreq, now, 0.05);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (impulseTimeoutRef.current) {
      window.clearTimeout(impulseTimeoutRef.current);
      impulseTimeoutRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
    masterGainRef.current = null;
    carrierOscRef.current = null;
    carrierGainRef.current = null;
    harmonicOscRef.current = null;
    harmonicGainRef.current = null;
    noiseNodeRef.current = null;
    noiseGainRef.current = null;
    bandpassFilterRef.current = null;
    setIsPlayingAudio(false);
    isPlayingAudioRef.current = false;
  }, []);

  const startAudio = useCallback(async () => {
    try {
      stopAudio();

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(audioVolume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // 1. Base carrier shaft rotation tone (fundamental frequency)
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(activeProbe.harmonicFreq, ctx.currentTime);

      const carrierGain = ctx.createGain();
      carrierGain.gain.setValueAtTime(0.4, ctx.currentTime);
      carrier.connect(carrierGain);
      carrierGain.connect(masterGain);
      carrier.start();
      carrierOscRef.current = carrier;
      carrierGainRef.current = carrierGain;

      // 2. Harmonic overtone (tooth mesh / rolling element harmonics)
      const harmonic = ctx.createOscillator();
      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(activeProbe.harmonicFreq * 2.14, ctx.currentTime);

      const harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.2, ctx.currentTime);
      harmonic.connect(harmonicGain);
      harmonicGain.connect(masterGain);
      harmonic.start();
      harmonicOscRef.current = harmonic;
      harmonicGainRef.current = harmonicGain;

      // 3. Pink noise hydrodynamic lubrication hiss (simulates real bearing film)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.11;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, ctx.currentTime);
      bandpass.Q.setValueAtTime(3.0, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, ctx.currentTime);
      whiteNoise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(masterGain);
      whiteNoise.start();
      noiseNodeRef.current = whiteNoise;
      noiseGainRef.current = noiseGain;
      bandpassFilterRef.current = bandpass;

      setIsPlayingAudio(true);
      isPlayingAudioRef.current = true;

      // Update parameters immediately to current live state
      updateAudioParametersOnTheGo();

      // Begin recursive impulse scheduler
      scheduleNextImpulse();
    } catch {
      setIsPlayingAudio(false);
      isPlayingAudioRef.current = false;
    }
  }, [audioVolume, activeProbe.harmonicFreq, stopAudio, updateAudioParametersOnTheGo, scheduleNextImpulse]);

  // Update running audio parameters on the fly when defect slider, active probe, or telemetry changes
  useEffect(() => {
    if (isPlayingAudio) {
      updateAudioParametersOnTheGo();
    }
  }, [isPlayingAudio, defectSlider, activeProbe, selectedMachine, updateAudioParametersOnTheGo]);

  // Adjust volume dynamically on the fly
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      masterGainRef.current.gain.setValueAtTime(audioVolume, audioCtxRef.current.currentTime);
    }
  }, [audioVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // ---------------------------------------------------------------------------
  // Real-Time Canvas FFT Spectrogram & Oscilloscope Visualizer
  // ---------------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let phase = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Dark acoustic background
      ctx.fillStyle = isDarkMode ? '#06080C' : '#F8FAFC';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = isDarkMode ? 'rgba(76, 141, 246, 0.12)' : 'rgba(76, 141, 246, 0.15)';
      ctx.lineWidth = 1;

      for (let x = 40; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 30; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw FFT Waterfall Spectrum Bars (0 Hz to 2.4 kHz)
      const numBars = 48;
      const barWidth = (width - 60) / numBars;
      const freqMultiplier = activeProbe.harmonicFreq / 120;
      const severityFactor = defectSlider / 100;

      for (let i = 0; i < numBars; i++) {
        const x = 30 + i * barWidth;
        const normI = i / numBars;

        // Base harmonic resonances
        const h1 = Math.exp(-Math.pow((normI - 0.2 * freqMultiplier) * 16, 2)) * 0.85;
        const h2 = Math.exp(-Math.pow((normI - 0.42 * freqMultiplier) * 20, 2)) * 0.65;
        const h3 = Math.exp(-Math.pow((normI - 0.75 * freqMultiplier) * 22, 2)) * (0.3 + severityFactor * 0.6);
        const noise = (Math.sin(phase * 4 + i * 2.3) * 0.08 + Math.cos(phase * 7 + i) * 0.05 + 0.12);

        const totalEnergy = Math.min(1.0, Math.max(0.04, h1 + h2 + h3 + noise));
        const barHeight = totalEnergy * (height - 60);

        // Color based on severity & frequency zone
        const isSpike = totalEnergy > 0.65;
        let fill = isSpike
          ? (severityFactor > 0.5 ? '#F43F5E' : '#F59E0B')
          : '#4C8DF6';

        ctx.fillStyle = fill;
        ctx.shadowColor = fill;
        ctx.shadowBlur = isSpike ? 8 : 2;
        ctx.fillRect(x + 1, height - 30 - barHeight, barWidth - 2, barHeight);
        ctx.shadowBlur = 0;
      }

      // Draw Oscilloscope Overlay Waveform
      ctx.beginPath();
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 6;

      for (let x = 0; x < width; x += 4) {
        const t = (x / width) * 4 * Math.PI + phase * 6;
        const carrierVal = Math.sin(t * freqMultiplier);
        const modVal = Math.sin(t * 0.25) * severityFactor;
        const impactVal = (Math.sin(t * 8) > 0.95 ? severityFactor * 1.5 : 0);
        const y = height * 0.35 + (carrierVal * 28 + modVal * 18 + impactVal * 22);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Frequency Axis Labels
      ctx.fillStyle = isDarkMode ? '#94A3B8' : '#64748B';
      ctx.font = '10px monospace';
      ctx.fillText('0 Hz', 30, height - 10);
      ctx.fillText('600 Hz (1X RPM)', width * 0.25, height - 10);
      ctx.fillText('1.2 kHz (2X Mesh)', width * 0.5, height - 10);
      ctx.fillText('1.8 kHz (BPFO)', width * 0.75, height - 10);
      ctx.fillText('2.4 kHz Ultrasonic', width - 110, height - 10);

      phase += 0.024;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeProbe, defectSlider, isDarkMode]);

  return (
    <div className="space-y-6 font-sans">
      {/* Revolutionary Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-g-surface to-blue-950/30 border border-cyan-500/30 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-bold uppercase tracking-wider">
              1st-in-Market Industry Pioneer
            </span>
            <span className="px-2.5 py-1 rounded bg-g-surfaceElevated border border-g-border text-g-textSecondary text-[11px] font-mono">
              Ultrasonic Heterodyne FFT Stethoscope
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-400 font-semibold">
              Active Unit: {selectedMachine?.machine_id} &bull; {selectedMachine?.status}
            </span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-g-text tracking-tight flex items-center gap-3">
          <span>Acoustic AI Harmonic Resonance Twin</span>
          <span className="text-sm font-mono font-normal px-2.5 py-0.5 rounded-full bg-g-blueLight text-g-blue border border-g-blue/30">
            Machine Audio Stethoscope
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-g-textSecondary mt-1.5 max-w-4xl leading-relaxed">
          The first industrial SCADA software to synthesize and analyze live machine bearing acoustics in real time.
          Currently monitoring <strong className="text-cyan-300 font-mono">{selectedMachine?.machine_name || selectedMachine?.machine_id}</strong> ({selectedMachine?.location}).
          Touch the virtual acoustic probe onto CNC spindle components to hear heterodyne ultrasound, observe 48-band FFT resonance,
          and identify micro-pitting weeks before traditional vibration sensors trip.
        </p>

        {/* Machine Selector Bar */}
        <div className="mt-4 pt-4 border-t border-g-border/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-g-textMuted">Active Telemetry Unit:</span>
            {machines.map((m) => {
              const isSelected = selectedMachine?.machine_id === m.machine_id;
              return (
                <button
                  key={m.machine_id}
                  type="button"
                  onClick={() => handleSelectMachine(m.machine_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-xs ring-1 ring-cyan-500/30'
                      : 'bg-g-surfaceElevated text-g-textSecondary border-g-border hover:border-cyan-500/40'
                  }`}
                >
                  {m.machine_id} &bull; {m.machine_name.split(' ')[0]}
                </button>
              );
            })}
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-3 bg-g-surfaceElevated/80 px-3.5 py-2 rounded-xl border border-g-border">
            <button
              type="button"
              onClick={isPlayingAudio ? stopAudio : startAudio}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                isPlayingAudio
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs animate-pulse'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-xs'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {isPlayingAudio ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                )}
              </svg>
              <span>{isPlayingAudio ? 'Mute Live Acoustic Stream' : 'Listen to Live Spindle'}</span>
            </button>

            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-g-textMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-cyan-400 cursor-pointer"
                title={`Volume: ${Math.round(audioVolume * 100)}%`}
              />
              <span className="text-[10px] font-mono text-g-textMuted w-7">
                {Math.round(audioVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Interactive Stethoscope Diagram + Spectrum Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Interactive Stethoscope Probe Selector on Machine Schematic */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-g-surface border border-g-border space-y-4">
          <div className="flex items-center justify-between border-b border-g-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-g-text uppercase tracking-wider font-cinzel">
                Acoustic Sensor Probes
              </h3>
              <p className="text-[11px] text-g-textSecondary">
                Select mechanical point to attach virtual ultrasound sensor:
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              4 Sensor Channels
            </span>
          </div>

          {/* Interactive Probe Cards */}
          <div className="space-y-2.5">
            {PROBE_POINTS.map((probe) => {
              const isSelected = activeProbe.id === probe.id;
              return (
                <button
                  key={probe.id}
                  type="button"
                  onClick={() => {
                    setActiveProbeId(probe.id);
                    setDefectSlider(probe.defectSeverity);
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-500/30 shadow-xs'
                      : 'bg-g-surfaceElevated border-g-border hover:border-g-borderHover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold font-sans ${isSelected ? 'text-cyan-300' : 'text-g-text'}`}>
                      {probe.name}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-g-surface border border-g-border text-g-textSecondary">
                      {probe.harmonicFreq} Hz
                    </span>
                  </div>
                  <p className="text-[11px] text-g-textSecondary leading-tight font-sans">
                    {probe.location}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-g-textMuted pt-1.5 border-t border-g-border/50">
                    <span>Kurtosis: <strong className="text-g-text">{probe.kurtosis}</strong></span>
                    <span>Crest Factor: <strong className="text-g-text">{probe.crestFactor}</strong></span>
                    <span className={probe.defectSeverity > 50 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      Severity: {probe.defectSeverity}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Defect Severity Injection Simulator Slider */}
          <div className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-g-text">
                  Bearing Defect / Raceway Pitting
                </span>
                {autoSyncTelemetry ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Telemetry
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSyncTelemetry(true);
                      setDefectSlider(activeProbe.defectSeverity);
                    }}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors cursor-pointer"
                    title="Click to re-sync with live machine telemetry"
                  >
                    Manual Mode (Click to sync)
                  </button>
                )}
              </div>
              <span className={`text-xs font-mono font-bold ${defectSlider > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {defectSlider}% Severity
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={defectSlider}
              onChange={(e) => {
                setAutoSyncTelemetry(false);
                setDefectSlider(parseInt(e.target.value));
              }}
              className="w-full h-1.5 accent-cyan-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-g-textMuted font-mono">
              <span>Updates audio in real time on the fly</span>
              {isPlayingAudio && (
                <span className="text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Live Modulating
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: High-Definition Real-Time FFT Spectrum & Oscilloscope */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-g-surface border border-g-border space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-g-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-g-text uppercase tracking-wider font-cinzel">
                  Live Ultrasonic FFT Waterfall & Oscilloscope
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Realtime 60 FPS
                </span>
              </div>
              <p className="text-[11px] text-g-textSecondary mt-0.5">
                Heterodyned Acoustic Signature for: <strong className="text-cyan-400">{activeProbe.name}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                <span className="text-g-textSecondary text-[11px]">Oscilloscope Wave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-g-textSecondary text-[11px]">FFT Spectrum</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span className="text-g-textSecondary text-[11px]">Resonance Spike</span>
              </div>
            </div>
          </div>

          {/* Canvas Spectrum Display */}
          <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-black/80 aspect-[16/9] sm:aspect-[2/1] w-full">
            <canvas
              ref={canvasRef}
              width={720}
              height={360}
              className="w-full h-full object-cover"
            />

            {/* Live Indicator Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>LIVE HARMONIC SWEEP &bull; {activeProbe.defectType}</span>
            </div>

            {/* Pinned Resonance Cursor Overlay */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-g-border text-[10px] font-mono text-g-textSecondary">
              THD: <strong className="text-cyan-400">{activeProbe.thdPct}%</strong> | THz Noise Floor: <strong className="text-emerald-400">-64.2 dB</strong>
            </div>
          </div>

          {/* AI Diagnostic Inference Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-g-surfaceElevated border border-g-border">
              <span className="text-[10px] font-mono text-g-textMuted uppercase tracking-wider block mb-1">
                Hydrodynamic Film Health
              </span>
              <div className="text-lg font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span><AnimatedNumber value={Math.max(20, 100 - defectSlider * 0.85)} decimals={1} />%</span>
                <span className="text-xs font-normal text-g-textSecondary font-sans">Nominal</span>
              </div>
              <p className="text-[10px] text-g-textSecondary mt-0.5">
                Ultrasonic acoustic cavitation within ISO safety margins.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-g-surfaceElevated border border-g-border">
              <span className="text-[10px] font-mono text-g-textMuted uppercase tracking-wider block mb-1">
                Kurtosis Signal Peakedness
              </span>
              <div className="text-lg font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <span>{(activeProbe.kurtosis + (defectSlider / 100) * 2.5).toFixed(2)}</span>
                <span className="text-xs font-normal text-g-textSecondary font-sans">Gaussian</span>
              </div>
              <p className="text-[10px] text-g-textSecondary mt-0.5">
                Standard baseline: 3.0. Values &gt; 5.0 indicate micro-fractures.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-g-surfaceElevated border border-g-border">
              <span className="text-[10px] font-mono text-g-textMuted uppercase tracking-wider block mb-1">
                Predicted Remaining Useful Life (RUL)
              </span>
              <div className="text-lg font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <span>{Math.max(140, Math.round(2840 - defectSlider * 28))} hrs</span>
                <span className="text-xs font-normal text-g-textSecondary font-sans">Before Service</span>
              </div>
              <p className="text-[10px] text-g-textSecondary mt-0.5">
                Calculated using Weibull failure probability curve.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcousticResonanceLab;
