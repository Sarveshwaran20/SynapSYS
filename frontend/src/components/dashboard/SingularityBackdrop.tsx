import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDocumentVisible } from '../../lib/motion';

export type BackdropMode =
  | 'ambient_lattice'
  | 'circuit_matrix'
  | 'cad_robotic_gantry'
  | 'matrix_telemetry'
  | 'oscilloscope_spectral';

export interface BackdropEngineMeta {
  id: BackdropMode;
  name: string;
  tagline: string;
  badge: string;
  description: string;
}

export const BACKDROP_ENGINES: BackdropEngineMeta[] = [
  {
    id: 'ambient_lattice',
    name: 'Ambient Fiber Flow',
    tagline: 'Minimalist SCADA Telemetry Mesh',
    badge: 'CLEAN',
    description: 'Subtle fiber-optic currents, faint constellation micro-nodes, and a gentle ambient horizon — designed for clean, non-distracting industrial monitoring',
  },
  {
    id: 'circuit_matrix',
    name: 'Circuit Highway',
    tagline: 'PCB Bus & CAD Oscilloscope',
    badge: 'BUS',
    description: 'Orthogonal PCB bus traces with traveling data packets and dual-channel oscilloscope waveform',
  },
  {
    id: 'cad_robotic_gantry',
    name: 'CAD CNC Gantry',
    tagline: '3D Cartesian Machine Blueprint',
    badge: 'CAD',
    description: 'Precision Cartesian CNC gantry wireframe moving along rails with laser toolhead and drafting grid',
  },
  {
    id: 'matrix_telemetry',
    name: 'Telemetry Waterfall',
    tagline: 'SCADA Hex & Binary Matrix',
    badge: 'DATA',
    description: 'Cascading monospace industrial telemetry data streams with register readouts',
  },
  {
    id: 'oscilloscope_spectral',
    name: 'Spectral FFT Lab',
    tagline: 'Multi-Channel Vibration Audio',
    badge: 'FFT',
    description: 'Multi-frequency acoustic resonance harmonic waves and real-time frequency spectrum analyzer bars',
  },
];

export interface SingularityBackdropProps {
  isDarkMode?: boolean;
  enabled?: boolean;
  intensity?: number;
  mode?: BackdropMode;
}

// -----------------------------------------------------------------------------
// Engine 1: Ambient Lattice & Fiber Structures (Subtle, Clean & Non-Distracting)
// -----------------------------------------------------------------------------
interface AmbientNode {
  baseX: number;
  baseY: number;
  phaseX: number;
  phaseY: number;
  speed: number;
  size: number;
  color: string;
}

interface FiberStream {
  points: Array<{ x: number; y: number }>;
  packetProgress: number;
  speed: number;
  color: string;
}

// -----------------------------------------------------------------------------
// Circuit Highway & PCB Structures
// -----------------------------------------------------------------------------
interface CircuitWire {
  points: Array<{ x: number; y: number }>;
  color: string;
  packetProgress: number;
  speed: number;
  packetSize: number;
}

interface CircuitChip {
  id: string;
  name: string;
  code: string;
  relX: number;
  relY: number;
  width: number;
  height: number;
  color: string;
  pins: 'both' | 'left' | 'right' | 'horizontal';
}

// -----------------------------------------------------------------------------
// Matrix Waterfall Column Structure
// -----------------------------------------------------------------------------
interface TelemetryColumn {
  xRel: number;
  yOffset: number;
  speed: number;
  chars: string[];
}

export const SingularityBackdrop: React.FC<SingularityBackdropProps> = React.memo(({
  isDarkMode = true,
  enabled = true,
  intensity = 0.55,
  mode = 'ambient_lattice',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();

  // Engine state references
  const ambientNodesRef = useRef<AmbientNode[]>([]);
  const fiberStreamsRef = useRef<FiberStream[]>([]);
  const wiresRef = useRef<CircuitWire[]>([]);
  const chipsRef = useRef<CircuitChip[]>([]);
  const columnsRef = useRef<TelemetryColumn[]>([]);

  // Mouse coordinate tracking with smooth interpolation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Initialize particle systems and ambient elements
  useEffect(() => {
    // 1. Ambient Lattice Floating Micro-Nodes (24 delicate, floating telemetry dots)
    const nodes: AmbientNode[] = [];
    for (let i = 0; i < 26; i++) {
      nodes.push({
        baseX: 0.05 + Math.random() * 0.90,
        baseY: 0.08 + Math.random() * 0.84,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
        size: 1.2 + Math.random() * 0.8,
        color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#2dd4bf' : '#818cf8',
      });
    }
    ambientNodesRef.current = nodes;

    // 2. Subtle Fiber-Optic Current Streams (Gentle, low-contrast conduit lines)
    fiberStreamsRef.current = [
      {
        points: [{ x: 0.02, y: 0.20 }, { x: 0.30, y: 0.20 }, { x: 0.38, y: 0.28 }, { x: 0.72, y: 0.28 }, { x: 0.78, y: 0.22 }, { x: 0.98, y: 0.22 }],
        packetProgress: 0.15,
        speed: 0.0018,
        color: '#38bdf8',
      },
      {
        points: [{ x: 0.04, y: 0.44 }, { x: 0.25, y: 0.44 }, { x: 0.32, y: 0.52 }, { x: 0.65, y: 0.52 }, { x: 0.72, y: 0.44 }, { x: 0.96, y: 0.44 }],
        packetProgress: 0.60,
        speed: 0.0022,
        color: '#2dd4bf',
      },
      {
        points: [{ x: 0.05, y: 0.72 }, { x: 0.35, y: 0.72 }, { x: 0.42, y: 0.64 }, { x: 0.75, y: 0.64 }, { x: 0.82, y: 0.72 }, { x: 0.95, y: 0.72 }],
        packetProgress: 0.35,
        speed: 0.0016,
        color: '#818cf8',
      },
      {
        points: [{ x: 0.12, y: 0.88 }, { x: 0.45, y: 0.88 }, { x: 0.52, y: 0.82 }, { x: 0.80, y: 0.82 }, { x: 0.86, y: 0.88 }, { x: 0.94, y: 0.88 }],
        packetProgress: 0.82,
        speed: 0.0020,
        color: '#38bdf8',
      },
    ];

    // 3. Integrated Circuit (IC) Chip Footprints for Circuit Matrix Mode
    chipsRef.current = [
      { id: 'mcu', name: 'CORE MCU', code: 'STM32-H743', relX: 0.28, relY: 0.22, width: 110, height: 50, color: '#38bdf8', pins: 'both' },
      { id: 'plc', name: 'PLC I/O BUS', code: 'IEC-61131-3', relX: 0.74, relY: 0.26, width: 120, height: 52, color: '#34d399', pins: 'both' },
      { id: 'phy', name: 'ANALOG DSP', code: 'FFT-48kS/s', relX: 0.35, relY: 0.62, width: 115, height: 48, color: '#fbbf24', pins: 'both' },
      { id: 'asic', name: 'ETHERCAT PHY', code: '100BASE-TX', relX: 0.82, relY: 0.65, width: 125, height: 50, color: '#c084fc', pins: 'both' },
      { id: 'gate', name: 'SCADA BRIDGE', code: 'MQTT-SPARKPLUG', relX: 0.56, relY: 0.84, width: 130, height: 46, color: '#f43f5e', pins: 'horizontal' },
    ];

    // 4. PCB Circuit Traces
    wiresRef.current = [
      {
        points: [{ x: 0.02, y: 0.14 }, { x: 0.24, y: 0.14 }, { x: 0.28, y: 0.20 }, { x: 0.65, y: 0.20 }, { x: 0.70, y: 0.14 }, { x: 0.98, y: 0.14 }],
        color: '#38bdf8',
        packetProgress: 0.12,
        speed: 0.0035,
        packetSize: 3.2,
      },
      {
        points: [{ x: 0.28, y: 0.27 }, { x: 0.28, y: 0.44 }, { x: 0.35, y: 0.50 }, { x: 0.68, y: 0.50 }, { x: 0.74, y: 0.32 }],
        color: '#34d399',
        packetProgress: 0.45,
        speed: 0.0038,
        packetSize: 3.0,
      },
      {
        points: [{ x: 0.05, y: 0.40 }, { x: 0.18, y: 0.40 }, { x: 0.24, y: 0.48 }, { x: 0.24, y: 0.62 }, { x: 0.29, y: 0.62 }],
        color: '#fbbf24',
        packetProgress: 0.25,
        speed: 0.0045,
        packetSize: 2.8,
      },
      {
        points: [{ x: 0.10, y: 0.88 }, { x: 0.45, y: 0.88 }, { x: 0.50, y: 0.86 }, { x: 0.62, y: 0.86 }, { x: 0.66, y: 0.92 }, { x: 0.94, y: 0.92 }],
        color: '#f43f5e',
        packetProgress: 0.33,
        speed: 0.0041,
        packetSize: 3.0,
      },
    ];

    // 5. Telemetry Waterfall Columns
    const rawTokens = [
      '0x4F', '0xA1', 'PLC:RUN', 'MODBUS', '79.3kW', '246_U', 'OEE:98%', 'VIB:0.8g',
      'FFT:48k', 'ISO22400', 'CAN:OK', 'ETHERCAT', '0xFF', '0x10', 'SYNC', 'ACK',
    ];
    const cols: TelemetryColumn[] = [];
    for (let c = 0; c < 14; c++) {
      const colChars: string[] = [];
      for (let i = 0; i < 24; i++) {
        colChars.push(rawTokens[Math.floor(Math.random() * rawTokens.length)]);
      }
      cols.push({
        xRel: (c + 0.5) / 14,
        yOffset: Math.random() * 800,
        speed: 0.5 + Math.random() * 0.8,
        chars: colChars,
      });
    }
    columnsRef.current = cols;
  }, []);

  // Main 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    let time = 0;

    const render = () => {
      if (!isDocVisible) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      time += 0.016;

      // Mouse inertia lerping
      const mouse = mouseRef.current;
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.05;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const isMobile = width < 768;
      const effectiveIntensity = intensity;

      // =========================================================================
      // ENGINE 1: AMBIENT FIBER FLOW (Clean, Subtle & Non-Distracting)
      // Designed specifically for high-end SCADA dashboards - clean and not overdone
      // =========================================================================
      if (mode === 'ambient_lattice') {
        ctx.save();

        // 1A. Delicate Engineering Blueprint Coordinate Grid
        const gridStep = isMobile ? 60 : 72;
        ctx.lineWidth = 1;
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.022)' : 'rgba(14, 116, 144, 0.02)';

        ctx.beginPath();
        for (let x = 0; x <= width; x += gridStep) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridStep) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Tiny crosshair marks (+) at grid intersections
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 116, 144, 0.10)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let x = gridStep; x < width; x += gridStep * 2) {
          for (let y = gridStep; y < height; y += gridStep * 2) {
            ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y);
            ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 2);
          }
        }
        ctx.stroke();

        // 1B. Soft Cursor Proximity Aura (Gentle radial ambient glow, zero harsh reticles)
        if (!isMobile) {
          const auraGrad = ctx.createRadialGradient(
            mouse.currentX, mouse.currentY, 10,
            mouse.currentX, mouse.currentY, 160
          );
          auraGrad.addColorStop(0, isDarkMode ? 'rgba(56, 189, 248, 0.05)' : 'rgba(14, 116, 144, 0.04)');
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(mouse.currentX, mouse.currentY, 160, 0, Math.PI * 2);
          ctx.fill();
        }

        // 1C. Floating Ambient Micro-Nodes & Constellation Threads
        const nodes = ambientNodesRef.current;
        const projectedNodes: Array<{ x: number; y: number; color: string; size: number }> = [];

        nodes.forEach((n) => {
          const wanderX = Math.sin(time * n.speed + n.phaseX) * 20;
          const wanderY = Math.cos(time * (n.speed * 0.9) + n.phaseY) * 16;
          const px = n.baseX * width + wanderX;
          const py = n.baseY * height + wanderY;
          projectedNodes.push({ x: px, y: py, color: n.color, size: n.size });
        });

        // Hairline connection threads between nearby nodes
        const maxDist = isMobile ? 90 : 125;
        for (let i = 0; i < projectedNodes.length; i++) {
          for (let j = i + 1; j < projectedNodes.length; j++) {
            const p1 = projectedNodes[i];
            const p2 = projectedNodes[j];
            const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (d < maxDist) {
              const alpha = (1 - d / maxDist) * 0.12 * effectiveIntensity;
              ctx.strokeStyle = isDarkMode ? `rgba(56, 189, 248, ${alpha})` : `rgba(14, 116, 144, ${alpha})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // Draw micro-dots
        projectedNodes.forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.45 * effectiveIntensity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // 1D. Smooth Fiber-Optic Current Streams (Soft glowing pulses)
        fiberStreamsRef.current.forEach((stream) => {
          if (!shouldReduce) {
            stream.packetProgress += stream.speed;
            if (stream.packetProgress > 1) stream.packetProgress = 0;
          }

          const screenPts = stream.points.map((p) => ({
            x: p.x * width,
            y: p.y * height,
          }));

          // Conduit trace line
          ctx.beginPath();
          ctx.moveTo(screenPts[0].x, screenPts[0].y);
          for (let i = 1; i < screenPts.length; i++) {
            ctx.lineTo(screenPts[i].x, screenPts[i].y);
          }
          ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.06)' : 'rgba(14, 116, 144, 0.05)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Traveling soft photon pulse
          if (screenPts.length > 1) {
            let totalLength = 0;
            const segLengths: number[] = [];
            for (let i = 0; i < screenPts.length - 1; i++) {
              const segLen = Math.hypot(screenPts[i + 1].x - screenPts[i].x, screenPts[i + 1].y - screenPts[i].y);
              segLengths.push(segLen);
              totalLength += segLen;
            }

            const targetDist = stream.packetProgress * totalLength;
            let accumulated = 0;
            let currentX = screenPts[0].x;
            let currentY = screenPts[0].y;

            for (let i = 0; i < segLengths.length; i++) {
              const segLen = segLengths[i];
              if (accumulated + segLen >= targetDist) {
                const fraction = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
                currentX = screenPts[i].x + (screenPts[i + 1].x - screenPts[i].x) * fraction;
                currentY = screenPts[i].y + (screenPts[i + 1].y - screenPts[i].y) * fraction;
                break;
              }
              accumulated += segLen;
            }

            // Soft glowing pulse with modest aura
            ctx.fillStyle = stream.color;
            ctx.shadowColor = stream.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(currentX, currentY, 2.0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // 1E. Whisper Horizon Waveform (Single delicate telemetry wave along lower margin)
        const waveY = height - 28;
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 116, 144, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const waveStep = isMobile ? 8 : 6;
        for (let x = 0; x <= width; x += waveStep) {
          const w1 = Math.sin(x * 0.007 + time * 1.4) * 5;
          const w2 = Math.cos(x * 0.016 - time * 0.9) * 3;
          const y = waveY + w1 + w2;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.restore();
      }

      // =========================================================================
      // ENGINE 2: CIRCUIT HIGHWAY & CAD OSCILLOSCOPE
      // =========================================================================
      else if (mode === 'circuit_matrix') {
        ctx.save();
        const gridStep = isMobile ? 50 : 64;
        ctx.lineWidth = 1;
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.035)' : 'rgba(14, 116, 144, 0.03)';

        ctx.beginPath();
        for (let x = 0; x <= width; x += gridStep) {
          ctx.moveTo(x, 0); ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridStep) {
          ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();

        // PCB Traces
        wiresRef.current.forEach((wire) => {
          if (!shouldReduce) {
            wire.packetProgress += wire.speed;
            if (wire.packetProgress > 1) wire.packetProgress = 0;
          }

          const screenPts = wire.points.map((p) => ({
            x: p.x * width,
            y: p.y * height,
          }));

          ctx.beginPath();
          ctx.moveTo(screenPts[0].x, screenPts[0].y);
          for (let i = 1; i < screenPts.length; i++) {
            ctx.lineTo(screenPts[i].x, screenPts[i].y);
          }
          ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 116, 144, 0.15)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });

        // IC Chips
        chipsRef.current.forEach((chip) => {
          const cx = chip.relX * width;
          const cy = chip.relY * height;
          const cw = isMobile ? chip.width * 0.8 : chip.width;
          const ch = isMobile ? chip.height * 0.8 : chip.height;

          const chipLeft = cx - cw / 2;
          const chipTop = cy - ch / 2;

          ctx.fillStyle = isDarkMode ? '#090d16' : '#ffffff';
          ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 116, 144, 0.30)';
          ctx.lineWidth = 1.2;
          ctx.fillRect(chipLeft, chipTop, cw, ch);
          ctx.strokeRect(chipLeft, chipTop, cw, ch);

          ctx.fillStyle = isDarkMode ? 'rgba(241, 245, 249, 0.95)' : 'rgba(15, 23, 42, 0.95)';
          ctx.font = '700 9px "JetBrains Mono", ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(chip.name, chipLeft + 12, chipTop + 18);
        });

        // Bottom Oscilloscope Waveform
        const oscY = height - 40;
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.65)' : 'rgba(14, 116, 144, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 6) {
          const y = oscY + Math.sin(x * 0.012 - time * 3.8) * 12;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // =========================================================================
      // ENGINE 3: 3D CARTESIAN CNC GANTRY BLUEPRINT
      // =========================================================================
      else if (mode === 'cad_robotic_gantry') {
        ctx.save();
        const gantryX = isMobile ? width * 0.5 : width * 0.72;
        const gantryY = isMobile ? height * 0.42 : height * 0.45;
        const railLen = isMobile ? 180 : 280;
        const railHeight = isMobile ? 90 : 140;

        const gantryProgressX = (Math.sin(time * 0.7) + 1) * 0.5;
        const gantryProgressY = (Math.cos(time * 0.9) + 1) * 0.5;
        const carriageX = gantryX - railLen / 2 + gantryProgressX * railLen;
        const carriageY = gantryY - railHeight / 2 + gantryProgressY * railHeight;

        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 116, 144, 0.30)';
        ctx.lineWidth = 2;
        ctx.strokeRect(gantryX - railLen / 2, gantryY - railHeight / 2, railLen, railHeight);

        ctx.fillStyle = isDarkMode ? '#090d16' : '#ffffff';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.fillRect(carriageX - 16, carriageY - 16, 32, 32);
        ctx.strokeRect(carriageX - 16, carriageY - 16, 32, 32);

        ctx.restore();
      }

      // =========================================================================
      // ENGINE 4: SCADA TELEMETRY DATA WATERFALL
      // =========================================================================
      else if (mode === 'matrix_telemetry') {
        ctx.save();
        const cols = columnsRef.current;
        ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';

        cols.forEach((col) => {
          if (!shouldReduce) {
            col.yOffset += col.speed;
            if (col.yOffset > 40) col.yOffset = 0;
          }
          const colX = col.xRel * width;
          const colHeight = height + 100;

          col.chars.forEach((char, cIdx) => {
            const y = (cIdx * 24 + col.yOffset) % colHeight - 20;
            const alpha = (0.06 + (cIdx % 4) * 0.04) * effectiveIntensity;
            ctx.fillStyle = isDarkMode ? `rgba(56, 189, 248, ${alpha})` : `rgba(14, 116, 144, ${alpha})`;
            ctx.fillText(char, colX, y);
          });
        });
        ctx.restore();
      }

      // =========================================================================
      // ENGINE 5: MULTI-CHANNEL SPECTRAL FFT AUDIO LAB
      // =========================================================================
      else if (mode === 'oscilloscope_spectral') {
        ctx.save();
        const numBars = isMobile ? 32 : 64;
        const barWidth = width / numBars;
        const baseY = height - 40;

        for (let b = 0; b < numBars; b++) {
          const freq = (b / numBars) * 12;
          const amplitude =
            Math.sin(freq - time * 4) * 0.4 +
            Math.sin(freq * 2.5 + time * 6) * 0.3;
          const barHeight = Math.max(4, Math.abs(amplitude) * 90);
          const bx = b * barWidth;
          const by = baseY - barHeight;

          ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 116, 144, 0.35)';
          ctx.fillRect(bx + 1, by, barWidth - 2, barHeight);
        }
        ctx.restore();
      }

      if (!shouldReduce) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDarkMode, enabled, intensity, mode, isDocVisible, shouldReduce]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
        isDarkMode ? 'opacity-50' : 'opacity-35'
      }`}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden="true"
    />
  );
});

export const IndustrialBackdrop = SingularityBackdrop;
export default SingularityBackdrop;
