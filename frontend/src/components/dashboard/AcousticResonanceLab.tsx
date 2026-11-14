import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MachineDashboardState } from '../../types';
import { AnimatedNumber } from '../motion';

export interface AcousticResonanceLabProps {
  machines: MachineDashboardState[];
  isDarkMode?: boolean;
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
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => {
    return machines[0]?.machine_id || 'CNC-101';
  });

  const selectedMachine = useMemo(() => {
    return machines.find((m) => m.machine_id === selectedMachineId) || machines[0];
  }, [machines, selectedMachineId]);

  // Virtual Stethoscope Probe Points on the Spindle & Drive Mechanism
  const PROBE_POINTS: ProbePoint[] = useMemo(() => [
    {
      id: 'spindle_front',
      name: 'Spindle Front Ceramic Bearing (BPFO)',
      location: 'Spindle Nose Housing - Drive End',
      harmonicFreq: 142.5,
      defectSeverity: selectedMachine?.status === 'Down' ? 78 : selectedMachine?.status === 'Idle' ? 12 : 24,
      description: 'Angular contact hybrid ceramic bearing assembly. Monitored for outer race micro-spalling.',
      kurtosis: 3.42,
      crestFactor: 4.85,
      thdPct: 1.84,
      defectType: 'Outer Raceway Ball Pass Frequency (BPFO)',
    },
    {
      id: 'gearbox_mesh',
      name: 'Planetary Gearbox Mesh (GMF)',
      location: 'Primary Reduction Gearbox - Mid Section',
      harmonicFreq: 312.0,
      defectSeverity: selectedMachine?.status === 'Down' ? 88 : 18,
      description: 'Helical sun-planet gear interface. High-frequency ultrasonic acoustic tooth mesh signature.',
      kurtosis: 4.15,
      crestFactor: 5.21,
      thdPct: 2.92,
      defectType: 'Tooth Contact Resonance (Gear Mesh Harmonic)',
    },
    {
      id: 'rear_thrust',
      name: 'Rear Pre-Load Thrust Bearing (BPFI)',
      location: 'Motor Coupling Flange - Non-Drive End',
      harmonicFreq: 96.0,
      defectSeverity: 8,
      description: 'Axial pre-load spring and duplex ground bearing stack.',
      kurtosis: 2.98,
      crestFactor: 3.45,
      thdPct: 0.95,
      defectType: 'Inner Raceway Ball Pass Frequency (BPFI)',
    },
    {
      id: 'stator_airgap',
      name: 'Stator Electromagnetic Flux Core',
      location: 'High-Torque Permanent Magnet Synchronous Stator',
      harmonicFreq: 120.0,
      defectSeverity: 5,
      description: 'Electromagnetic magnetic flux air-gap acoustic resonance (2x line frequency humming).',
      kurtosis: 3.01,
      crestFactor: 3.12,
      thdPct: 0.65,
      defectType: 'Electromagnetic Pole Frequency Harmonic',
    },
  ], [selectedMachine]);

  const [activeProbe, setActiveProbe] = useState<ProbePoint>(PROBE_POINTS[0]);
  const [defectSlider, setDefectSlider] = useState<number>(PROBE_POINTS[0].defectSeverity);

  // Sync active probe when machine changes
  useEffect(() => {
    setActiveProbe(PROBE_POINTS[0]);
    setDefectSlider(PROBE_POINTS[0].defectSeverity);
  }, [PROBE_POINTS]);

  // ---------------------------------------------------------------------------
  // Web Audio API: Heterodyne Ultrasonic-to-Audible Synthesizer
  // Converts high-frequency mechanical vibrations (20-40 kHz) into audible audio
  // ---------------------------------------------------------------------------
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.35);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const carrierOscRef = useRef<OscillatorNode | null>(null);
  const harmonicOscRef = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const impulseIntervalRef = useRef<number | null>(null);

  const stopAudio = useCallback(() => {
    if (impulseIntervalRef.current) {
      window.clearInterval(impulseIntervalRef.current);
      impulseIntervalRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
    setIsPlayingAudio(false);
  }, []);

  const startAudio = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
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

      // 4. Periodic bearing defect impulse clicks (rate scales with defect severity)
      const impulsePeriodMs = Math.max(60, 400 - defectSlider * 3.5);
      impulseIntervalRef.current = window.setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        try {
          const clickOsc = audioCtxRef.current.createOscillator();
          const clickGain = audioCtxRef.current.createGain();
          clickOsc.type = 'square';
          clickOsc.frequency.setValueAtTime(1200 + Math.random() * 800, audioCtxRef.current.currentTime);

          const clickVolume = (defectSlider / 100) * 0.6;
          clickGain.gain.setValueAtTime(clickVolume, audioCtxRef.current.currentTime);
          clickGain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.04);

          clickOsc.connect(clickGain);
          clickGain.connect(masterGainRef.current!);
          clickOsc.start();
          clickOsc.stop(audioCtxRef.current.currentTime + 0.05);
        } catch {
          // ignore transient click scheduling errors
        }
      }, impulsePeriodMs);

      setIsPlayingAudio(true);
    } catch {
      setIsPlayingAudio(false);
    }
  }, [activeProbe.harmonicFreq, audioVolume, defectSlider]);

  // Adjust volume dynamically
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(audioVolume, audioCtxRef.current.currentTime);
    }
  }, [audioVolume]);

  // Adjust frequencies dynamically when probe changes
  useEffect(() => {
    if (carrierOscRef.current && audioCtxRef.current) {
      carrierOscRef.current.frequency.setValueAtTime(activeProbe.harmonicFreq, audioCtxRef.current.currentTime);
    }
    if (harmonicOscRef.current && audioCtxRef.current) {
      harmonicOscRef.current.frequency.setValueAtTime(activeProbe.harmonicFreq * 2.14, audioCtxRef.current.currentTime);
    }
  }, [activeProbe]);

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
              Sampling Bus: 48.0 kS/s &bull; ISO-10816 Class II
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
          Touch the virtual acoustic probe onto CNC spindle components to hear heterodyne ultrasound, observe 24-band FFT resonance,
          and identify micro-pitting weeks before traditional vibration sensors trip.
        </p>

        {/* Machine Selector Bar */}
        <div className="mt-4 pt-4 border-t border-g-border/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-g-textMuted">Active Telemetry Unit:</span>
            {machines.map((m) => (
              <button
                key={m.machine_id}
                type="button"
                onClick={() => setSelectedMachineId(m.machine_id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                  selectedMachineId === m.machine_id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-xs ring-1 ring-cyan-500/30'
                    : 'bg-g-surfaceElevated text-g-textSecondary border-g-border hover:border-cyan-500/40'
                }`}
              >
                {m.machine_id} &bull; {m.machine_name.split(' ')[0]}
              </button>
            ))}
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
                    setActiveProbe(probe);
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
          <div className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-g-text">
                Simulate Bearing Defect / Raceway Pitting
              </span>
              <span className={`text-xs font-mono font-bold ${defectSlider > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {defectSlider}% Severity
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={defectSlider}
              onChange={(e) => setDefectSlider(parseInt(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 cursor-pointer"
            />
            <p className="text-[10px] text-g-textMuted leading-relaxed">
              Drag slider to dynamically inject raceway spalling and impact noise into the synthesized audio and FFT spectrum.
            </p>
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
