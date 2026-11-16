import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDocumentVisible } from '../../lib/motion';

export type BackdropMode =
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
    id: 'circuit_matrix',
    name: 'Circuit Highway',
    tagline: 'PCB Bus & CAD Oscilloscope',
    badge: 'NEW',
    description: 'Orthogonal high-speed PCB circuit bus traces with traveling photon data packets, logic chips, and live oscilloscope waveform',
  },
  {
    id: 'cad_robotic_gantry',
    name: 'CAD CNC Gantry',
    tagline: '3D Cartesian Machine Blueprint',
    badge: 'CAD',
    description: 'Precision Cartesian CNC gantry wireframe moving along rails with laser toolhead, dimensional calipers, and drafting grid',
  },
  {
    id: 'matrix_telemetry',
    name: 'Telemetry Waterfall',
    tagline: 'SCADA Hex & Binary Matrix',
    badge: 'DATA',
    description: 'Cascading monospace industrial telemetry data streams with register readouts and horizontal laser scanlines',
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
  intensity = 0.65,
  mode = 'circuit_matrix',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();

  // Engine state references
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

  // Initialize PCB components, circuit bus traces, and telemetry streams
  useEffect(() => {
    // 1. Integrated Circuit (IC) Chip Footprints
    chipsRef.current = [
      { id: 'mcu', name: 'CORE MCU', code: 'STM32-H743', relX: 0.28, relY: 0.22, width: 110, height: 50, color: '#38bdf8', pins: 'both' },
      { id: 'plc', name: 'PLC I/O BUS', code: 'IEC-61131-3', relX: 0.74, relY: 0.26, width: 120, height: 52, color: '#34d399', pins: 'both' },
      { id: 'phy', name: 'ANALOG DSP', code: 'FFT-48kS/s', relX: 0.35, relY: 0.62, width: 115, height: 48, color: '#fbbf24', pins: 'both' },
      { id: 'asic', name: 'ETHERCAT PHY', code: '100BASE-TX', relX: 0.82, relY: 0.65, width: 125, height: 50, color: '#c084fc', pins: 'both' },
      { id: 'gate', name: 'SCADA BRIDGE', code: 'MQTT-SPARKPLUG', relX: 0.56, relY: 0.84, width: 130, height: 46, color: '#f43f5e', pins: 'horizontal' },
    ];

    // 2. Multi-Layer PCB Circuit Highway Bus Traces (Horizontal & Vertical with 45-degree chamfers)
    wiresRef.current = [
      // Top Primary Data Highway
      {
        points: [{ x: 0.02, y: 0.14 }, { x: 0.24, y: 0.14 }, { x: 0.28, y: 0.20 }, { x: 0.65, y: 0.20 }, { x: 0.70, y: 0.14 }, { x: 0.98, y: 0.14 }],
        color: '#38bdf8',
        packetProgress: 0.12,
        speed: 0.0035,
        packetSize: 3.2,
      },
      {
        points: [{ x: 0.04, y: 0.16 }, { x: 0.23, y: 0.16 }, { x: 0.27, y: 0.22 }, { x: 0.64, y: 0.22 }, { x: 0.69, y: 0.16 }, { x: 0.96, y: 0.16 }],
        color: '#22d3ee',
        packetProgress: 0.68,
        speed: 0.0042,
        packetSize: 2.6,
      },

      // Mid-Level Cross Bus Conduit
      {
        points: [{ x: 0.28, y: 0.27 }, { x: 0.28, y: 0.44 }, { x: 0.35, y: 0.50 }, { x: 0.68, y: 0.50 }, { x: 0.74, y: 0.32 }],
        color: '#34d399',
        packetProgress: 0.45,
        speed: 0.0038,
        packetSize: 3.0,
      },
      {
        points: [{ x: 0.35, y: 0.27 }, { x: 0.35, y: 0.42 }, { x: 0.42, y: 0.48 }, { x: 0.82, y: 0.48 }, { x: 0.82, y: 0.60 }],
        color: '#86efac',
        packetProgress: 0.82,
        speed: 0.0032,
        packetSize: 2.4,
      },

      // Left I/O Sensor Collector Traces
      {
        points: [{ x: 0.05, y: 0.40 }, { x: 0.18, y: 0.40 }, { x: 0.24, y: 0.48 }, { x: 0.24, y: 0.62 }, { x: 0.29, y: 0.62 }],
        color: '#fbbf24',
        packetProgress: 0.25,
        speed: 0.0045,
        packetSize: 2.8,
      },
      {
        points: [{ x: 0.06, y: 0.75 }, { x: 0.22, y: 0.75 }, { x: 0.28, y: 0.68 }, { x: 0.30, y: 0.68 }],
        color: '#f59e0b',
        packetProgress: 0.6,
        speed: 0.0039,
        packetSize: 2.5,
      },

      // Right Fieldbus Telemetry Traces
      {
        points: [{ x: 0.95, y: 0.35 }, { x: 0.84, y: 0.35 }, { x: 0.80, y: 0.31 }, { x: 0.74, y: 0.31 }],
        color: '#c084fc',
        packetProgress: 0.18,
        speed: 0.0048,
        packetSize: 3.0,
      },
      {
        points: [{ x: 0.82, y: 0.70 }, { x: 0.82, y: 0.78 }, { x: 0.74, y: 0.84 }, { x: 0.63, y: 0.84 }],
        color: '#a855f7',
        packetProgress: 0.52,
        speed: 0.0036,
        packetSize: 2.6,
      },

      // Lower SCADA Gateway Bus
      {
        points: [{ x: 0.10, y: 0.88 }, { x: 0.45, y: 0.88 }, { x: 0.50, y: 0.86 }, { x: 0.62, y: 0.86 }, { x: 0.66, y: 0.92 }, { x: 0.94, y: 0.92 }],
        color: '#f43f5e',
        packetProgress: 0.33,
        speed: 0.0041,
        packetSize: 3.0,
      },
      {
        points: [{ x: 0.35, y: 0.67 }, { x: 0.35, y: 0.80 }, { x: 0.42, y: 0.86 }, { x: 0.50, y: 0.86 }],
        color: '#fb7185',
        packetProgress: 0.77,
        speed: 0.0044,
        packetSize: 2.4,
      },
    ];

    // 3. Telemetry Stream Columns for Matrix Mode
    const rawTokens = [
      '0x4F', '0xA1', 'PLC:RUN', 'MODBUS', '79.3kW', '246_U', 'OEE:98%', 'VIB:0.8g',
      'FFT:48k', 'ISO22400', 'CAN:OK', 'ETHERCAT', '0xFF', '0x10', 'SYNC', 'ACK',
      'RPM:2980', 'PRES:4.2B', 'TEMP:42C', 'NET:10G', 'DB:NORM', '0x7E', '0x3C', 'CRC32'
    ];

    const cols: TelemetryColumn[] = [];
    const numCols = 16;
    for (let c = 0; c < numCols; c++) {
      const colChars: string[] = [];
      for (let i = 0; i < 28; i++) {
        colChars.push(rawTokens[Math.floor(Math.random() * rawTokens.length)]);
      }
      cols.push({
        xRel: (c + 0.5) / numCols,
        yOffset: Math.random() * 800,
        speed: 0.6 + Math.random() * 1.2,
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
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.06;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.06;

      ctx.clearRect(0, 0, width, height);

      const isMobile = width < 768;
      const effectiveIntensity = intensity;

      // =========================================================================
      // ENGINE 1: CIRCUIT HIGHWAY & CAD OSCILLOSCOPE (Brand New Default Style!)
      // Completely linear, rectangular, orthogonal - ZERO black hole resemblance
      // =========================================================================
      if (mode === 'circuit_matrix') {
        ctx.save();

        // 1A. Background Technical Blueprint Drafting Grid
        const gridStep = isMobile ? 50 : 64;
        ctx.lineWidth = 1;
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.035)' : 'rgba(14, 116, 144, 0.03)';

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

        // Major grid intersection dots
        ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(14, 116, 144, 0.18)';
        for (let x = gridStep * 2; x < width; x += gridStep * 2) {
          for (let y = gridStep * 2; y < height; y += gridStep * 2) {
            ctx.fillRect(x - 1, y - 1, 2, 2);
          }
        }

        // 1B. Sweeping Vertical Laser Scanner
        const scanPeriod = 9.0;
        const scanProgress = (time % scanPeriod) / scanPeriod;
        const laserX = scanProgress * (width + 100) - 50;

        const laserGrad = ctx.createLinearGradient(laserX - 25, 0, laserX + 25, 0);
        laserGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
        laserGrad.addColorStop(0.5, isDarkMode ? 'rgba(34, 211, 238, 0.28)' : 'rgba(14, 116, 144, 0.22)');
        laserGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');

        ctx.fillStyle = laserGrad;
        ctx.fillRect(laserX - 25, 0, 50, height);

        // Crisp leading laser beam
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.65)' : 'rgba(14, 116, 144, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(laserX, 0);
        ctx.lineTo(laserX, height);
        ctx.stroke();

        // 1C. Draw Orthogonal PCB Circuit Bus Traces
        wiresRef.current.forEach((wire) => {
          if (!shouldReduce) {
            wire.packetProgress += wire.speed;
            if (wire.packetProgress > 1) wire.packetProgress = 0;
          }

          const screenPts = wire.points.map((p) => ({
            x: p.x * width,
            y: p.y * height,
          }));

          // Outer copper trace glow
          ctx.beginPath();
          ctx.moveTo(screenPts[0].x, screenPts[0].y);
          for (let i = 1; i < screenPts.length; i++) {
            ctx.lineTo(screenPts[i].x, screenPts[i].y);
          }
          ctx.strokeStyle = isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(226, 232, 240, 0.8)';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Inner conductive trace line
          ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(14, 116, 144, 0.18)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Solder pad dots at wire vertex junctions
          screenPts.forEach((pt) => {
            ctx.fillStyle = isDarkMode ? '#0f172a' : '#f8fafc';
            ctx.strokeStyle = wire.color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });

          // High-speed photon data packet
          if (screenPts.length > 1) {
            let totalLength = 0;
            const segLengths: number[] = [];
            for (let i = 0; i < screenPts.length - 1; i++) {
              const segLen = Math.hypot(screenPts[i + 1].x - screenPts[i].x, screenPts[i + 1].y - screenPts[i].y);
              segLengths.push(segLen);
              totalLength += segLen;
            }

            const targetDist = wire.packetProgress * totalLength;
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

            // Draw glowing packet with trailing photon aura
            ctx.fillStyle = wire.color;
            ctx.shadowColor = wire.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(currentX, currentY, wire.packetSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // 1D. Render Integrated Circuit (IC) Microchip Footprints
        chipsRef.current.forEach((chip) => {
          const cx = chip.relX * width;
          const cy = chip.relY * height;
          const cw = isMobile ? chip.width * 0.8 : chip.width;
          const ch = isMobile ? chip.height * 0.8 : chip.height;

          const chipLeft = cx - cw / 2;
          const chipTop = cy - ch / 2;

          // Proximity to mouse
          const mDist = Math.hypot(mouse.currentX - cx, mouse.currentY - cy);
          const isTargeted = mDist < 85;

          // Pin leads (metallic IC legs)
          const numPins = 6;
          ctx.fillStyle = isDarkMode ? '#64748b' : '#94a3b8';
          for (let p = 1; p <= numPins; p++) {
            const py = chipTop + (p / (numPins + 1)) * ch;
            // Left pins
            ctx.fillRect(chipLeft - 6, py - 1.5, 6, 3);
            // Right pins
            ctx.fillRect(chipLeft + cw, py - 1.5, 6, 3);
          }

          // Main chip package body
          ctx.fillStyle = isDarkMode ? '#090d16' : '#ffffff';
          ctx.strokeStyle = isTargeted ? chip.color : isDarkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 116, 144, 0.30)';
          ctx.lineWidth = isTargeted ? 1.8 : 1.2;
          ctx.shadowColor = chip.color;
          ctx.shadowBlur = isTargeted ? 12 : 0;
          ctx.fillRect(chipLeft, chipTop, cw, ch);
          ctx.strokeRect(chipLeft, chipTop, cw, ch);
          ctx.shadowBlur = 0;

          // Corner orientation notch
          ctx.fillStyle = chip.color;
          ctx.beginPath();
          ctx.arc(chipLeft + 8, chipTop + 8, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Chip typography
          ctx.fillStyle = isDarkMode ? 'rgba(241, 245, 249, 0.95)' : 'rgba(15, 23, 42, 0.95)';
          ctx.font = '700 9px "JetBrains Mono", ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(chip.name, chipLeft + 16, chipTop + 18);

          ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.70)' : 'rgba(100, 116, 139, 0.70)';
          ctx.font = '500 8px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillText(chip.code, chipLeft + 16, chipTop + 32);

          // Active indicator pulse
          ctx.fillStyle = chip.color;
          ctx.beginPath();
          ctx.arc(chipLeft + cw - 10, chipTop + 14, 2, 0, Math.PI * 2);
          ctx.fill();
        });

        // 1E. Live Dual-Channel Oscilloscope Waveform Spanning Bottom Section
        const oscY = height - (isMobile ? 36 : 48);
        const oscHeight = 24;

        // Oscilloscope graticule axis
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 116, 144, 0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, oscY);
        ctx.lineTo(width, oscY);
        ctx.stroke();

        // Channel 1: Harmonic Sine Wave (Acoustic / Vibration Telemetry)
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.85)' : 'rgba(14, 116, 144, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const step = isMobile ? 6 : 4;
        for (let x = 0; x <= width; x += step) {
          const w1 = Math.sin(x * 0.012 - time * 3.8) * oscHeight * 0.45;
          const w2 = Math.sin(x * 0.035 + time * 2.2) * oscHeight * 0.22;
          const y = oscY + w1 + w2;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Channel 2: Digital Clock Train / Square Wave Pulses
        ctx.strokeStyle = isDarkMode ? 'rgba(52, 211, 153, 0.55)' : 'rgba(5, 150, 105, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += step * 2) {
          const rawSq = Math.sin(x * 0.018 - time * 5.0);
          const sqVal = Math.tanh(rawSq * 6) * oscHeight * 0.35;
          const y = oscY + 8 + sqVal;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 1F. High-Precision Cartesian CAD Laser Reticle Crosshair
        const mx = mouse.currentX;
        const my = mouse.currentY;

        // Full-screen horizontal laser line
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 116, 144, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(0, my);
        ctx.lineTo(width, my);
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target reticle calipers at cursor center
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.75)' : 'rgba(14, 116, 144, 0.70)';
        ctx.lineWidth = 1.4;
        const cSize = 14;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(mx - cSize, my - cSize / 2);
        ctx.lineTo(mx - cSize, my - cSize);
        ctx.lineTo(mx - cSize / 2, my - cSize);
        // Top-right
        ctx.moveTo(mx + cSize / 2, my - cSize);
        ctx.lineTo(mx + cSize, my - cSize);
        ctx.lineTo(mx + cSize, my - cSize / 2);
        // Bottom-left
        ctx.moveTo(mx - cSize, my + cSize / 2);
        ctx.lineTo(mx - cSize, my + cSize);
        ctx.lineTo(mx - cSize / 2, my + cSize);
        // Bottom-right
        ctx.moveTo(mx + cSize / 2, my + cSize);
        ctx.lineTo(mx + cSize, my + cSize);
        ctx.lineTo(mx + cSize, my + cSize / 2);
        ctx.stroke();

        // Small center reticle dot
        ctx.fillStyle = isDarkMode ? '#38bdf8' : '#0284c7';
        ctx.fillRect(mx - 1.5, my - 1.5, 3, 3);

        // Coordinate telemetry readout chip next to reticle
        if (!isMobile) {
          const badgeX = Math.min(width - 160, mx + 18);
          const badgeY = Math.max(20, my - 26);

          ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)';
          ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 116, 144, 0.30)';
          ctx.lineWidth = 1;
          ctx.fillRect(badgeX, badgeY, 145, 24);
          ctx.strokeRect(badgeX, badgeY, 145, 24);

          ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.95)' : 'rgba(14, 116, 144, 0.95)';
          ctx.font = '700 8.5px "JetBrains Mono", ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`X:${mx.toFixed(1)}mm  Y:${my.toFixed(1)}mm`, badgeX + 8, badgeY + 11);

          ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.70)' : 'rgba(100, 116, 139, 0.70)';
          ctx.font = '500 7.5px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillText('CAD BUS: 10Gbps SYNC', badgeX + 8, badgeY + 20);
        }

        ctx.restore();
      }

      // =========================================================================
      // ENGINE 2: 3D CARTESIAN CNC GANTRY BLUEPRINT (Industrial Machine Toolhead)
      // =========================================================================
      else if (mode === 'cad_robotic_gantry') {
        ctx.save();
        const gantryX = isMobile ? width * 0.5 : width * 0.72;
        const gantryY = isMobile ? height * 0.42 : height * 0.45;

        // Background drafting cross grid
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.04)' : 'rgba(14, 116, 144, 0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 60) {
          ctx.moveTo(x, 0); ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += 60) {
          ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Mechanical Linear Motion Rails (Isometric 3D Gantry)
        const railLen = isMobile ? 180 : 280;
        const railHeight = isMobile ? 90 : 140;

        const gantryProgressX = (Math.sin(time * 0.7) + 1) * 0.5;
        const gantryProgressY = (Math.cos(time * 0.9) + 1) * 0.5;

        const carriageX = gantryX - railLen / 2 + gantryProgressX * railLen;
        const carriageY = gantryY - railHeight / 2 + gantryProgressY * railHeight;

        // Outer gantry rail frame
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 116, 144, 0.30)';
        ctx.lineWidth = 2;
        ctx.strokeRect(gantryX - railLen / 2, gantryY - railHeight / 2, railLen, railHeight);

        // Linear guide shafts
        ctx.strokeStyle = isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(gantryX - railLen / 2, gantryY);
        ctx.lineTo(gantryX + railLen / 2, gantryY);
        ctx.stroke();

        // Moving transverse cross-beam
        ctx.strokeStyle = isDarkMode ? 'rgba(52, 211, 153, 0.65)' : 'rgba(5, 150, 105, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(carriageX, gantryY - railHeight / 2);
        ctx.lineTo(carriageX, gantryY + railHeight / 2);
        ctx.stroke();

        // Laser cutting / machining toolhead carriage
        ctx.fillStyle = isDarkMode ? '#090d16' : '#ffffff';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fillRect(carriageX - 16, carriageY - 16, 32, 32);
        ctx.strokeRect(carriageX - 16, carriageY - 16, 32, 32);
        ctx.shadowBlur = 0;

        // Downward vertical laser machining beam
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(carriageX, carriageY + 16);
        ctx.lineTo(carriageX, carriageY + 60);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Dimension Callout Arrows and Labels
        ctx.fillStyle = isDarkMode ? 'rgba(241, 245, 249, 0.85)' : 'rgba(15, 23, 42, 0.85)';
        ctx.font = '700 9px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`AXIS X: ${(gantryProgressX * 1200).toFixed(1)} mm`, gantryX, gantryY - railHeight / 2 - 12);
        ctx.fillText(`AXIS Y: ${(gantryProgressY * 600).toFixed(1)} mm`, gantryX, gantryY + railHeight / 2 + 22);

        ctx.restore();
      }

      // =========================================================================
      // ENGINE 3: SCADA TELEMETRY DATA WATERFALL (Matrix Monospace Stream)
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
            const rawY = (cIdx * 24 + col.yOffset) % colHeight;
            const y = rawY - 20;

            const isLeading = cIdx === 0;
            const alpha = (0.08 + (cIdx % 4) * 0.05) * effectiveIntensity;

            ctx.fillStyle = isLeading
              ? (isDarkMode ? '#38bdf8' : '#0284c7')
              : (isDarkMode ? `rgba(56, 189, 248, ${alpha})` : `rgba(14, 116, 144, ${alpha})`);

            ctx.fillText(char, colX, y);
          });
        });

        // Horizontal laser sweep line
        const sweepY = (time * 60) % height;
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 116, 144, 0.40)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, sweepY);
        ctx.lineTo(width, sweepY);
        ctx.stroke();

        ctx.restore();
      }

      // =========================================================================
      // ENGINE 4: MULTI-CHANNEL SPECTRAL FFT AUDIO LAB (Acoustic Resonance Bars)
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
            Math.sin(freq * 2.5 + time * 6) * 0.3 +
            Math.cos(freq * 0.8 + time * 1.5) * 0.3;

          const barHeight = Math.max(6, Math.abs(amplitude) * 110);
          const bx = b * barWidth;
          const by = baseY - barHeight;

          const barGrad = ctx.createLinearGradient(bx, by, bx, baseY);
          barGrad.addColorStop(0, isDarkMode ? '#38bdf8' : '#0284c7');
          barGrad.addColorStop(1, isDarkMode ? 'rgba(56, 189, 248, 0.05)' : 'rgba(14, 116, 144, 0.05)');

          ctx.fillStyle = barGrad;
          ctx.fillRect(bx + 1, by, barWidth - 2, barHeight);

          // Peak cap LED
          ctx.fillStyle = isDarkMode ? '#34d399' : '#059669';
          ctx.fillRect(bx + 1, by - 3, barWidth - 2, 2);
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
        isDarkMode ? 'opacity-70' : 'opacity-50'
      }`}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden="true"
    />
  );
});

export const IndustrialBackdrop = SingularityBackdrop;
export default SingularityBackdrop;
