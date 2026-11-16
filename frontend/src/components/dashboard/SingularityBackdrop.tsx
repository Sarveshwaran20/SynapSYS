import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDocumentVisible } from '../../lib/motion';

export interface SingularityBackdropProps {
  isDarkMode?: boolean;
  enabled?: boolean;
  intensity?: number;
  mode?: string;
}

// -----------------------------------------------------------------------------
// Unified Industrial SCADA Matrix Engine
// Master blended composition of CAD Gantry Blueprint, PCB Circuit Bus,
// Telemetry Waterfall, Acoustic Resonance Oscilloscope & Ambient Constellation
// -----------------------------------------------------------------------------

interface ConstellationNode {
  baseX: number;
  baseY: number;
  phaseX: number;
  phaseY: number;
  speed: number;
  size: number;
}

interface CircuitTrace {
  points: Array<{ x: number; y: number }>;
  packetProgress: number;
  speed: number;
  color: string;
}

interface CircuitChip {
  name: string;
  code: string;
  relX: number;
  relY: number;
  width: number;
  height: number;
}

interface TelemetryStream {
  x: number;
  yOffset: number;
  speed: number;
  readouts: string[];
}

export const SingularityBackdrop: React.FC<SingularityBackdropProps> = React.memo(({
  isDarkMode = true,
  enabled = true,
  intensity = 0.55,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();

  // Internal structures for the unified blended engine
  const nodesRef = useRef<ConstellationNode[]>([]);
  const tracesRef = useRef<CircuitTrace[]>([]);
  const chipsRef = useRef<CircuitChip[]>([]);
  const streamsRef = useRef<TelemetryStream[]>([]);

  // Smooth mouse interpolation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Main canvas animation loop
  useEffect(() => {
    if (!enabled || shouldReduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initializeUnifiedStructures();
    };
    window.addEventListener('resize', handleResize);

    const initializeUnifiedStructures = () => {
      // 1. Constellation micro-nodes (from ambient lattice)
      const nodes: ConstellationNode[] = [];
      const nodeCount = Math.min(22, Math.max(12, Math.floor(width / 80)));
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          baseX: Math.random() * width,
          baseY: Math.random() * height,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          speed: 0.0015 + Math.random() * 0.002,
          size: 1.2 + Math.random() * 1.4,
        });
      }
      nodesRef.current = nodes;

      // 2. Orthogonal PCB Circuit Traces & Packets (from circuit highway)
      const traces: CircuitTrace[] = [
        {
          points: [
            { x: 0, y: height * 0.22 },
            { x: width * 0.28, y: height * 0.22 },
            { x: width * 0.34, y: height * 0.32 },
            { x: width * 0.62, y: height * 0.32 },
            { x: width * 0.68, y: height * 0.18 },
            { x: width, y: height * 0.18 },
          ],
          packetProgress: 0.15,
          speed: 0.0016,
          color: isDarkMode ? '#38bdf8' : '#0284c7',
        },
        {
          points: [
            { x: width * 0.15, y: 0 },
            { x: width * 0.15, y: height * 0.42 },
            { x: width * 0.24, y: height * 0.52 },
            { x: width * 0.24, y: height },
          ],
          packetProgress: 0.55,
          speed: 0.0012,
          color: isDarkMode ? '#4c8df6' : '#2563eb',
        },
        {
          points: [
            { x: width, y: height * 0.62 },
            { x: width * 0.72, y: height * 0.62 },
            { x: width * 0.64, y: height * 0.74 },
            { x: width * 0.36, y: height * 0.74 },
            { x: width * 0.30, y: height * 0.86 },
            { x: 0, y: height * 0.86 },
          ],
          packetProgress: 0.8,
          speed: 0.0014,
          color: isDarkMode ? '#34d399' : '#059669',
        },
        {
          points: [
            { x: width * 0.82, y: 0 },
            { x: width * 0.82, y: height * 0.48 },
            { x: width * 0.75, y: height * 0.58 },
            { x: width * 0.75, y: height },
          ],
          packetProgress: 0.35,
          speed: 0.0015,
          color: isDarkMode ? '#38bdf8' : '#0284c7',
        },
      ];
      tracesRef.current = traces;

      // 3. Logic Micro-Chips on PCB Junctions
      chipsRef.current = [
        { name: 'PLC-CORE', code: 'MODBUS/TCP', relX: 0.28, relY: 0.22, width: 72, height: 26 },
        { name: 'DSP-24', code: '48kHz FFT', relX: 0.62, relY: 0.32, width: 68, height: 24 },
        { name: 'CAN-BUS', code: '1 Mbps ISO', relX: 0.72, relY: 0.62, width: 70, height: 24 },
      ];

      // 4. Peripheral Monospace Telemetry Waterfall Columns (from matrix telemetry)
      const telemetryReadouts = [
        ['0x7E', '48.2Hz', '14.2kW', '1.52mm/s', 'OPC-UA:OK', 'REG:4001', '24.2°C', '250Hz', 'SYNC'],
        ['0xA4', 'RMS:1.8', 'ISO-18.2', '99.4%', 'VIB:NOM', 'NODE:02', '0x1F', 'PLC:RUN', 'TOL:±2μ'],
        ['0x3B', 'SPINDLE', 'FFT:PEAK', '142Hz', 'BPFO', '400V', 'THD:1.8%', 'STATUS:OK', 'CH-01'],
        ['0x9C', 'HYDR:P1', '140bar', 'FEED:+8%', 'TEMP:52°C', 'ALM:NONE', 'CYCLE:7.2s', 'RUN', '0x88'],
      ];

      streamsRef.current = [
        { x: 26, yOffset: 0, speed: 0.45, readouts: telemetryReadouts[0] },
        { x: 80, yOffset: 120, speed: 0.35, readouts: telemetryReadouts[1] },
        { x: width - 95, yOffset: 60, speed: 0.40, readouts: telemetryReadouts[2] },
        { x: width - 35, yOffset: 180, speed: 0.50, readouts: telemetryReadouts[3] },
      ];
    };

    initializeUnifiedStructures();

    let startTime = performance.now();

    const render = (currentTime: number) => {
      if (!isDocVisible) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = (currentTime - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse coordinates interpolation
      mouseRef.current.currentX += (mouseRef.current.targetX - mouseRef.current.currentX) * 0.05;
      mouseRef.current.currentY += (mouseRef.current.targetY - mouseRef.current.currentY) * 0.05;

      const effectiveIntensity = Math.max(0.2, Math.min(1.0, intensity));

      // =========================================================================
      // LAYER 1: AMBIENT BLUEPRINT GRID & PRECISION CROSSHAIRS
      // =========================================================================
      ctx.save();
      const gridPitch = 120;
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.045)' : 'rgba(14, 116, 144, 0.04)';
      ctx.lineWidth = 1;

      // Coordinate Grid Lines
      for (let x = 0; x <= width; x += gridPitch) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridPitch) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Precision Crosshairs at Grid Intersections
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.16)' : 'rgba(14, 116, 144, 0.14)';
      ctx.lineWidth = 1;
      const crossSize = 3.5;
      for (let x = gridPitch; x < width; x += gridPitch * 2) {
        for (let y = gridPitch; y < height; y += gridPitch * 2) {
          ctx.beginPath();
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
          ctx.stroke();
        }
      }
      ctx.restore();

      // =========================================================================
      // LAYER 2: ORTHOGONAL PCB BUS HIGHWAY TRACES & TRAVELING PHOTONS
      // =========================================================================
      ctx.save();
      const traces = tracesRef.current;
      traces.forEach((wire) => {
        // Trace line
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.09)' : 'rgba(14, 116, 144, 0.08)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        wire.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Terminal Via Rings
        wire.points.forEach((pt, pIdx) => {
          if (pIdx === 0 || pIdx === wire.points.length - 1) {
            ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 116, 144, 0.16)';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Traveling Photon Data Packet
        wire.packetProgress = (wire.packetProgress + wire.speed) % 1.0;
        const totalSegments = wire.points.length - 1;
        const segIndex = Math.min(totalSegments - 1, Math.floor(wire.packetProgress * totalSegments));
        const segSubProgress = (wire.packetProgress * totalSegments) - segIndex;
        const pA = wire.points[segIndex];
        const pB = wire.points[segIndex + 1];

        if (pA && pB) {
          const packetX = pA.x + (pB.x - pA.x) * segSubProgress;
          const packetY = pA.y + (pB.y - pA.y) * segSubProgress;

          // Packet core
          ctx.fillStyle = wire.color;
          ctx.shadowColor = wire.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(packetX, packetY, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // PCB Logic Chips
      chipsRef.current.forEach((chip) => {
        const cx = chip.relX * width;
        const cy = chip.relY * height;
        const halfW = chip.width / 2;
        const halfH = chip.height / 2;

        ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.55)' : 'rgba(241, 245, 249, 0.65)';
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(14, 116, 144, 0.20)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - halfW, cy - halfH, chip.width, chip.height);
        ctx.fillRect(cx - halfW, cy - halfH, chip.width, chip.height);

        // Chip Monospace Text
        ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.70)' : 'rgba(14, 116, 144, 0.75)';
        ctx.font = '600 8.5px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(chip.name, cx, cy - 1);
        ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.50)' : 'rgba(100, 116, 139, 0.60)';
        ctx.font = '500 7px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText(chip.code, cx, cy + 8);
      });
      ctx.restore();

      // =========================================================================
      // LAYER 3: CAD CARTESIAN GANTRY WIREFRAME & DIMENSION CALIPER
      // =========================================================================
      ctx.save();
      const railY = 46;
      // Top Drafting Rail
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 116, 144, 0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, railY);
      ctx.lineTo(width, railY);
      ctx.stroke();

      // Millimeter Tick Marks
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 116, 144, 0.07)';
      for (let tx = 0; tx <= width; tx += 20) {
        ctx.beginPath();
        ctx.moveTo(tx, railY - 3);
        ctx.lineTo(tx, railY + 3);
        ctx.stroke();
      }

      // Smooth drifting CNC Gantry Carriage
      const gantryProgressX = (Math.sin(elapsed * 0.15) + 1) * 0.5;
      const gantryX = width * 0.18 + gantryProgressX * (width * 0.64);
      const carriageW = 38;
      const carriageH = 14;

      // Carriage block
      ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.65)' : 'rgba(241, 245, 249, 0.75)';
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 116, 144, 0.30)';
      ctx.lineWidth = 1;
      ctx.fillRect(gantryX - carriageW / 2, railY - carriageH / 2, carriageW, carriageH);
      ctx.strokeRect(gantryX - carriageW / 2, railY - carriageH / 2, carriageW, carriageH);

      // Toolhead Dropper Laser Guideline
      const toolheadY = railY + 70 + Math.sin(elapsed * 0.4) * 20;
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.20)' : 'rgba(14, 116, 144, 0.16)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(gantryX, railY + carriageH / 2);
      ctx.lineTo(gantryX, toolheadY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Toolhead Reticle
      ctx.strokeStyle = isDarkMode ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(gantryX, toolheadY, 4, 0, Math.PI * 2);
      ctx.stroke();

      // Dimension Readout
      ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.60)' : 'rgba(14, 116, 144, 0.65)';
      ctx.font = '600 8px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`AXIS X: ${(gantryProgressX * 1200).toFixed(1)} mm`, gantryX + 8, railY - 8);
      ctx.restore();

      // =========================================================================
      // LAYER 4: PERIPHERAL MONOSPACE TELEMETRY WATERFALL STREAMS
      // =========================================================================
      ctx.save();
      ctx.font = '500 9px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';

      streamsRef.current.forEach((stream) => {
        stream.yOffset = (stream.yOffset + stream.speed) % 180;
        const rowHeight = 22;

        stream.readouts.forEach((text, rIdx) => {
          const rawY = (rIdx * rowHeight + stream.yOffset) % (height + 60);
          const y = rawY - 20;
          const alpha = (0.05 + (rIdx % 3) * 0.025) * effectiveIntensity;

          ctx.fillStyle = isDarkMode ? `rgba(56, 189, 248, ${alpha})` : `rgba(14, 116, 144, ${alpha})`;
          ctx.fillText(text, stream.x, y);
        });
      });
      ctx.restore();

      // =========================================================================
      // LAYER 5: DUAL-CHANNEL ACOUSTIC RESONANCE OSCILLOSCOPE & FFT BARS
      // =========================================================================
      ctx.save();
      // 1. Dual-Channel Oscilloscope Horizon Wave
      const waveY = height * 0.74;
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.16)' : 'rgba(14, 116, 144, 0.14)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 6) {
        const t = (x / width) * 4 * Math.PI + elapsed * 1.8;
        const y = waveY + Math.sin(t * 1.5) * 14 + Math.cos(t * 0.7) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Spectral FFT Vibration Bars along the bottom edge
      const numBars = 32;
      const barWidth = Math.min(22, (width * 0.45) / numBars);
      const startX = width * 0.275;
      const baseY = height - 12;

      for (let b = 0; b < numBars; b++) {
        const freq = (b / numBars) * 10;
        const amp = Math.sin(freq - elapsed * 3.5) * 0.45 + Math.sin(freq * 2.2 + elapsed * 5.0) * 0.35;
        const barHeight = Math.max(3, Math.abs(amp) * 36);
        const bx = startX + b * (barWidth + 2);
        const by = baseY - barHeight;

        ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 116, 144, 0.16)';
        ctx.fillRect(bx, by, barWidth, barHeight);
      }
      ctx.restore();

      // =========================================================================
      // LAYER 6: AMBIENT CONSTELLATION MICRO-NODES & CURSOR ILLUMINATION
      // =========================================================================
      ctx.save();
      const nodes = nodesRef.current;
      const currentNodes = nodes.map((n) => {
        const x = n.baseX + Math.sin(elapsed * 0.6 + n.phaseX) * 25;
        const y = n.baseY + Math.cos(elapsed * 0.5 + n.phaseY) * 20;
        return { x, y, size: n.size };
      });

      // Constellation threads between near nodes
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 116, 144, 0.07)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const dx = currentNodes[i].x - currentNodes[j].x;
          const dy = currentNodes[i].y - currentNodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            const threadAlpha = (1 - dist / 110) * 0.12 * effectiveIntensity;
            ctx.strokeStyle = isDarkMode ? `rgba(56, 189, 248, ${threadAlpha})` : `rgba(14, 116, 144, ${threadAlpha})`;
            ctx.beginPath();
            ctx.moveTo(currentNodes[i].x, currentNodes[i].y);
            ctx.lineTo(currentNodes[j].x, currentNodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Micro-node dots
      currentNodes.forEach((node) => {
        ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 116, 144, 0.30)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cursor Radial Illumination Glow
      const mx = mouseRef.current.currentX;
      const my = mouseRef.current.currentY;
      if (mx > 0 && my > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 280);
        grad.addColorStop(0, isDarkMode ? 'rgba(56, 189, 248, 0.06)' : 'rgba(14, 116, 144, 0.05)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, isDarkMode, intensity, shouldReduce, isDocVisible]);

  if (!enabled || shouldReduce) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
        isDarkMode ? 'opacity-45' : 'opacity-30'
      }`}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden="true"
    />
  );
});

export const IndustrialBackdrop = SingularityBackdrop;
export default SingularityBackdrop;
