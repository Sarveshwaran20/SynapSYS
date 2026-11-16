import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDocumentVisible } from '../../lib/motion';

export type BackdropMode =
  | 'ecosystem_constellation'
  | 'lidar_mesh'
  | 'tokamak_fusion'
  | 'neural_synapse'
  | 'singularity';

export interface BackdropEngineMeta {
  id: BackdropMode;
  name: string;
  tagline: string;
  badge: string;
  description: string;
}

export const BACKDROP_ENGINES: BackdropEngineMeta[] = [
  {
    id: 'ecosystem_constellation',
    name: '3D Ecosystem Twin',
    tagline: 'CODESYS Automation Topology',
    badge: 'NEW',
    description: '3D isometric wireframe hypercube with interconnected SCADA & PLC digital twin constellation',
  },
  {
    id: 'lidar_mesh',
    name: '3D LiDAR Mesh',
    tagline: 'Topographic LiDAR Terrain',
    badge: '3D',
    description: 'Dynamic isometric LiDAR wave field with 3D triple-gimbal gyroscope core',
  },
  {
    id: 'tokamak_fusion',
    name: 'Tokamak Fusion',
    tagline: 'Plasma Magnetic Confinement',
    badge: 'FX',
    description: 'Toroidal magnetic flux coils with orbiting plasma and Lorenz attractor stream',
  },
  {
    id: 'neural_synapse',
    name: 'Neural Synapse',
    tagline: 'Cognitive SCADA Intelligence',
    badge: 'AI',
    description: 'Multi-layer neural synapse network with propagating action potentials',
  },
  {
    id: 'singularity',
    name: 'Gravitational Vortex',
    tagline: 'Deep Space Singularity',
    badge: 'CORE',
    description: 'Keplerian accretion disk with event horizon and infalling relativistic matter',
  },
];

export interface SingularityBackdropProps {
  isDarkMode?: boolean;
  enabled?: boolean;
  intensity?: number; // 0.1 to 1.0 (default: 0.65)
  mode?: BackdropMode; // default: 'ecosystem_constellation'
}

// -----------------------------------------------------------------------------
// Engine 1 Structures: 3D Ecosystem Constellation (CODESYS Industrial Topology)
// -----------------------------------------------------------------------------
interface EcosystemNode {
  id: string;
  label: string;
  sub: string;
  angle: number;
  orbitRadius: number;
  speed: number;
  tiltAngle: number;
  color: string;
  glowColor: string;
  packetProgress: number;
  packetSpeed: number;
}

interface PerimeterPacket {
  edgeIdx: number;
  progress: number;
  speed: number;
  color: string;
}

// -----------------------------------------------------------------------------
// Engine 2 Structures: LiDAR Mesh & Cybernetic Gyroscope
// -----------------------------------------------------------------------------
interface CircuitTrack {
  points: Array<{ x: number; y: number }>;
  packetProgress: number;
  speed: number;
  color: string;
}

interface HudBadge {
  relX: number;
  relY: number;
  label: string;
  metric: string;
  sub: string;
  tone: 'cyan' | 'purple' | 'emerald';
}

// -----------------------------------------------------------------------------
// Engine 3 Structures: Tokamak Magnetic Fusion Plasma
// -----------------------------------------------------------------------------
interface PlasmaParticle {
  torusAngle: number;
  poloidalAngle: number;
  torusSpeed: number;
  poloidalSpeed: number;
  orbitRadius: number;
  tubeRadius: number;
  color: string;
  size: number;
}

// -----------------------------------------------------------------------------
// Engine 4 Structures: Neural Synapse Cyber-Grid
// -----------------------------------------------------------------------------
interface NeuralNode {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  layer: number;
  activity: number;
  pulseRadius: number;
  connections: number[];
  label: string;
}

interface SynapticPulse {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

// -----------------------------------------------------------------------------
// Engine 5 Structures: Gravitational Singularity Accretion
// -----------------------------------------------------------------------------
interface SingularityParticle {
  r: number;
  theta: number;
  orbitSpeed: number;
  radialSpeed: number;
  size: number;
  color: string;
  alpha: number;
  history: Array<{ x: number; y: number }>;
}

export const SingularityBackdrop: React.FC<SingularityBackdropProps> = React.memo(({
  isDarkMode = true,
  enabled = true,
  intensity = 0.65,
  mode = 'ecosystem_constellation',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();

  // Engine state references
  const ecosystemNodesRef = useRef<EcosystemNode[]>([]);
  const perimeterPacketsRef = useRef<PerimeterPacket[]>([]);
  const circuitTracksRef = useRef<CircuitTrack[]>([]);
  const plasmaParticlesRef = useRef<PlasmaParticle[]>([]);
  const neuralNodesRef = useRef<NeuralNode[]>([]);
  const synapticPulsesRef = useRef<SynapticPulse[]>([]);
  const singularityParticlesRef = useRef<SingularityParticle[]>([]);

  // Lorenz attractor integration state for Tokamak mode
  const lorenzStateRef = useRef<{ x: number; y: number; z: number; trail: Array<{ x: number; y: number; z: number }> }>({
    x: 0.1,
    y: 0,
    z: 0,
    trail: [],
  });

  // Track mouse coordinates with inertia
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

  // Initialize all engine particle systems
  useEffect(() => {
    // 1. Initialize Ecosystem Constellation Nodes (CODESYS automation topology)
    ecosystemNodesRef.current = [
      {
        id: 'codesys',
        label: 'CODESYS PLC',
        sub: 'IEC 61131-3 Runtime',
        angle: 0,
        orbitRadius: 240,
        speed: 0.0018,
        tiltAngle: 0.1,
        color: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.45)',
        packetProgress: 0.15,
        packetSpeed: 0.0055,
      },
      {
        id: 'twin',
        label: 'DIGITAL TWIN',
        sub: '3D Spatial Mesh',
        angle: (Math.PI / 4) * 1,
        orbitRadius: 280,
        speed: 0.0016,
        tiltAngle: -0.15,
        color: '#818cf8',
        glowColor: 'rgba(129, 140, 248, 0.45)',
        packetProgress: 0.62,
        packetSpeed: 0.0048,
      },
      {
        id: 'acoustic',
        label: 'ACOUSTIC AI',
        sub: 'Heterodyne Spectral',
        angle: (Math.PI / 4) * 2,
        orbitRadius: 230,
        speed: 0.002,
        tiltAngle: 0.08,
        color: '#34d399',
        glowColor: 'rgba(52, 211, 153, 0.45)',
        packetProgress: 0.35,
        packetSpeed: 0.0062,
      },
      {
        id: 'opcua',
        label: 'OPC-UA / MQTT',
        sub: 'Sparkplug B 10Gbps',
        angle: (Math.PI / 4) * 3,
        orbitRadius: 290,
        speed: 0.0017,
        tiltAngle: -0.12,
        color: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.45)',
        packetProgress: 0.8,
        packetSpeed: 0.005,
      },
      {
        id: 'mro',
        label: 'PREDICTIVE MRO',
        sub: 'Weibull RUL Twin',
        angle: (Math.PI / 4) * 4,
        orbitRadius: 250,
        speed: 0.0019,
        tiltAngle: 0.14,
        color: '#f43f5e',
        glowColor: 'rgba(244, 63, 94, 0.45)',
        packetProgress: 0.42,
        packetSpeed: 0.0058,
      },
      {
        id: 'fft',
        label: 'ULTRASONIC FFT',
        sub: '48 kS/s Ingest',
        angle: (Math.PI / 4) * 5,
        orbitRadius: 270,
        speed: 0.0015,
        tiltAngle: -0.06,
        color: '#c084fc',
        glowColor: 'rgba(192, 132, 252, 0.45)',
        packetProgress: 0.73,
        packetSpeed: 0.0046,
      },
      {
        id: 'oee',
        label: 'ISO-22400 OEE',
        sub: '99.4% Availability',
        angle: (Math.PI / 4) * 6,
        orbitRadius: 235,
        speed: 0.0021,
        tiltAngle: 0.11,
        color: '#2dd4bf',
        glowColor: 'rgba(45, 212, 191, 0.45)',
        packetProgress: 0.2,
        packetSpeed: 0.0065,
      },
      {
        id: 'scada',
        label: 'SCADA MES RING',
        sub: 'Zero-Drop Bus',
        angle: (Math.PI / 4) * 7,
        orbitRadius: 285,
        speed: 0.0018,
        tiltAngle: -0.1,
        color: '#60a5fa',
        glowColor: 'rgba(96, 165, 250, 0.45)',
        packetProgress: 0.5,
        packetSpeed: 0.0052,
      },
    ];

    // Perimeter packets between constellation nodes
    perimeterPacketsRef.current = [
      { edgeIdx: 0, progress: 0.2, speed: 0.004, color: '#38bdf8' },
      { edgeIdx: 2, progress: 0.5, speed: 0.0035, color: '#34d399' },
      { edgeIdx: 4, progress: 0.7, speed: 0.0045, color: '#f43f5e' },
      { edgeIdx: 6, progress: 0.35, speed: 0.0038, color: '#2dd4bf' },
    ];

    // 2. Initialize Circuit Tracks for LiDAR Mesh
    circuitTracksRef.current = [
      {
        points: [{ x: 0.05, y: 0.18 }, { x: 0.28, y: 0.18 }, { x: 0.35, y: 0.28 }, { x: 0.65, y: 0.28 }],
        packetProgress: 0.1,
        speed: 0.0035,
        color: '#22d3ee',
      },
      {
        points: [{ x: 0.65, y: 0.28 }, { x: 0.75, y: 0.38 }, { x: 0.95, y: 0.38 }],
        packetProgress: 0.6,
        speed: 0.004,
        color: '#38bdf8',
      },
      {
        points: [{ x: 0.08, y: 0.72 }, { x: 0.22, y: 0.72 }, { x: 0.30, y: 0.60 }, { x: 0.55, y: 0.60 }],
        packetProgress: 0.45,
        speed: 0.003,
        color: '#a855f7',
      },
      {
        points: [{ x: 0.55, y: 0.60 }, { x: 0.68, y: 0.75 }, { x: 0.92, y: 0.75 }],
        packetProgress: 0.8,
        speed: 0.0045,
        color: '#2dd4bf',
      },
      {
        points: [{ x: 0.72, y: 0.12 }, { x: 0.72, y: 0.35 }, { x: 0.82, y: 0.48 }, { x: 0.82, y: 0.88 }],
        packetProgress: 0.25,
        speed: 0.0038,
        color: '#38bdf8',
      },
    ];

    // 3. Initialize Tokamak Plasma Particles
    const plasma: PlasmaParticle[] = [];
    for (let i = 0; i < 90; i++) {
      plasma.push({
        torusAngle: Math.random() * Math.PI * 2,
        poloidalAngle: Math.random() * Math.PI * 2,
        torusSpeed: 0.008 + Math.random() * 0.012,
        poloidalSpeed: 0.02 + Math.random() * 0.035,
        orbitRadius: 180 + Math.random() * 40,
        tubeRadius: 45 + Math.random() * 25,
        color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#a855f7' : '#f59e0b',
        size: 1.5 + Math.random() * 2.2,
      });
    }
    plasmaParticlesRef.current = plasma;

    // 4. Initialize Neural Synapse Nodes
    const nodes: NeuralNode[] = [];
    const layers = [
      { count: 3, xRel: 0.15, label: 'INGEST' },
      { count: 5, xRel: 0.32, label: 'FILTER' },
      { count: 6, xRel: 0.50, label: 'SPECTRAL' },
      { count: 4, xRel: 0.70, label: 'INFERENCE' },
      { count: 2, xRel: 0.88, label: 'DISPATCH' },
    ];

    layers.forEach((layer, layerIdx) => {
      for (let i = 0; i < layer.count; i++) {
        const yRel = 0.2 + (i + 1) * (0.6 / (layer.count + 1));
        const connections: number[] = [];
        if (layerIdx < layers.length - 1) {
          const nextLayerStart = layers.slice(0, layerIdx + 1).reduce((acc, l) => acc + l.count, 0);
          const nextLayerCount = layers[layerIdx + 1].count;
          for (let c = 0; c < nextLayerCount; c++) {
            if (Math.random() > 0.35) connections.push(nextLayerStart + c);
          }
          if (connections.length === 0) connections.push(nextLayerStart);
        }

        nodes.push({
          x: 0,
          y: 0,
          baseX: layer.xRel,
          baseY: yRel,
          layer: layerIdx,
          activity: 0.2 + Math.random() * 0.8,
          pulseRadius: 0,
          connections,
          label: `${layer.label}-${i + 1}`,
        });
      }
    });
    neuralNodesRef.current = nodes;

    synapticPulsesRef.current = [];
    for (let p = 0; p < 18; p++) {
      const srcNode = Math.floor(Math.random() * (nodes.length - 3));
      const validConns = nodes[srcNode]?.connections || [];
      if (validConns.length > 0) {
        const target = validConns[Math.floor(Math.random() * validConns.length)];
        synapticPulsesRef.current.push({
          fromNode: srcNode,
          toNode: target,
          progress: Math.random(),
          speed: 0.005 + Math.random() * 0.009,
          color: p % 2 === 0 ? '#38bdf8' : '#c084fc',
        });
      }
    }

    // 5. Initialize Singularity Particles
    const singParts: SingularityParticle[] = [];
    for (let i = 0; i < 110; i++) {
      singParts.push({
        r: 60 + Math.random() * 440,
        theta: Math.random() * Math.PI * 2,
        orbitSpeed: 0.006 + Math.random() * 0.012,
        radialSpeed: 0.15 + Math.random() * 0.45,
        size: 1.2 + Math.random() * 2.2,
        color: i % 4 === 0 ? '#38bdf8' : i % 4 === 1 ? '#a855f7' : i % 4 === 2 ? '#2dd4bf' : '#fb7185',
        alpha: 0.4 + Math.random() * 0.6,
        history: [],
      });
    }
    singularityParticlesRef.current = singParts;
  }, []);

  // Main 60 FPS Canvas Render Loop
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
      // MODE 1: 3D DIGITAL TWIN ECOSYSTEM CONSTELLATION (CODESYS Topology)
      // =========================================================================
      if (mode === 'ecosystem_constellation') {
        const coreCenterX = isMobile ? width * 0.5 : width * 0.72;
        const coreCenterY = isMobile ? height * 0.42 : height * 0.46;

        const mouseDeltaX = (mouse.currentX - width * 0.5) * 0.04;
        const mouseDeltaY = (mouse.currentY - height * 0.5) * 0.04;

        ctx.save();

        // 1A. Background Ambient Starfield & Isometric Ground Coordinate Grid
        const gridStep = isMobile ? 60 : 75;
        const gridStartY = height * 0.55;
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.04)' : 'rgba(14, 116, 144, 0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = -width * 0.2; gx <= width * 1.2; gx += gridStep) {
          ctx.moveTo(gx + mouseDeltaX * 0.5, gridStartY);
          ctx.lineTo(gx + (gx - width * 0.5) * 0.6 + mouseDeltaX, height);
        }
        for (let gy = gridStartY; gy <= height; gy += 45) {
          ctx.moveTo(0, gy + mouseDeltaY * 0.3);
          ctx.lineTo(width, gy + mouseDeltaY * 0.3);
        }
        ctx.stroke();

        // 1B. Concentric Isometric Orbital Ellipses with Degree Marks
        const orbitR1 = isMobile ? 180 : 255;
        const orbitR2 = isMobile ? 220 : 310;
        const orbitRatioY = 0.48; // isometric angle compression

        // Inner orbital guide ring
        ctx.beginPath();
        ctx.ellipse(coreCenterX, coreCenterY, orbitR1, orbitR1 * orbitRatioY, -0.15, 0, Math.PI * 2);
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 116, 144, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.stroke();

        // Outer orbital ring with degree marks
        ctx.beginPath();
        ctx.ellipse(coreCenterX, coreCenterY, orbitR2, orbitR2 * orbitRatioY, -0.15, 0, Math.PI * 2);
        ctx.strokeStyle = isDarkMode ? 'rgba(168, 85, 247, 0.14)' : 'rgba(124, 58, 237, 0.10)';
        ctx.lineWidth = 1;
        ctx.setLineDash([12, 16]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Degree calibration ticks along outer ring
        const tickCount = 24;
        for (let t = 0; t < tickCount; t++) {
          const tAngle = (t / tickCount) * Math.PI * 2 + (shouldReduce ? 0 : time * 0.04);
          const cosA = Math.cos(tAngle);
          const sinA = Math.sin(tAngle) * orbitRatioY;
          const tiltCos = Math.cos(-0.15);
          const tiltSin = Math.sin(-0.15);

          const tx = coreCenterX + (cosA * orbitR2 * tiltCos - sinA * orbitR2 * tiltSin);
          const ty = coreCenterY + (cosA * orbitR2 * tiltSin + sinA * orbitR2 * tiltCos);

          ctx.fillStyle = isDarkMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 116, 144, 0.35)';
          ctx.beginPath();
          ctx.arc(tx, ty, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // 1C. Calculate Projected 3D Positions for Satellite Nodes
        const nodes = ecosystemNodesRef.current;
        interface ProjectedNode {
          node: EcosystemNode;
          screenX: number;
          screenY: number;
          depthZ: number;
          isHovered: boolean;
        }

        const projectedNodes: ProjectedNode[] = nodes.map((n) => {
          if (!shouldReduce) {
            n.angle += n.speed;
            n.packetProgress += n.packetSpeed;
            if (n.packetProgress > 1) n.packetProgress = 0;
          }

          const currentR = isMobile ? n.orbitRadius * 0.72 : n.orbitRadius;
          const cosTheta = Math.cos(n.angle);
          const sinTheta = Math.sin(n.angle);

          // 3D elliptical coordinates with isometric compression
          const rawX = cosTheta * currentR;
          const rawY = sinTheta * currentR * orbitRatioY;
          const depthZ = sinTheta * currentR * 0.6;

          const tiltCos = Math.cos(-0.15 + n.tiltAngle);
          const tiltSin = Math.sin(-0.15 + n.tiltAngle);

          const px = coreCenterX + (rawX * tiltCos - rawY * tiltSin) + mouseDeltaX * (1 + depthZ / 600);
          const py = coreCenterY + (rawX * tiltSin + rawY * tiltCos) + mouseDeltaY * (1 + depthZ / 600);

          const distToMouse = Math.hypot(px - mouse.currentX, py - mouse.currentY);
          const isHovered = distToMouse < 60;

          return {
            node: n,
            screenX: px,
            screenY: py,
            depthZ,
            isHovered,
          };
        });

        // 1D. Laser Interconnects: Radial Cables to Central Digital Twin Core
        projectedNodes.forEach((pn) => {
          const depthAlpha = 0.25 + ((pn.depthZ + 200) / 400) * 0.45;

          // Radial laser link line
          const linkGrad = ctx.createLinearGradient(coreCenterX, coreCenterY, pn.screenX, pn.screenY);
          linkGrad.addColorStop(0, isDarkMode ? `rgba(244, 63, 94, ${depthAlpha * 0.75})` : `rgba(225, 29, 72, ${depthAlpha * 0.65})`);
          linkGrad.addColorStop(1, pn.node.glowColor);

          ctx.beginPath();
          ctx.moveTo(coreCenterX, coreCenterY);
          ctx.lineTo(pn.screenX, pn.screenY);
          ctx.strokeStyle = linkGrad;
          ctx.lineWidth = pn.isHovered ? 2.0 : 1.2;
          ctx.stroke();

          // Traveling photon data packet along the radial link
          const prog = pn.node.packetProgress;
          const packetX = coreCenterX + (pn.screenX - coreCenterX) * prog;
          const packetY = coreCenterY + (pn.screenY - coreCenterY) * prog;

          ctx.fillStyle = pn.node.color;
          ctx.shadowColor = pn.node.color;
          ctx.shadowBlur = pn.isHovered ? 12 : 8;
          ctx.beginPath();
          ctx.arc(packetX, packetY, pn.isHovered ? 3.5 : 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // 1E. Constellation Perimeter Polygon Links (Interconnecting Neighbor Nodes)
        ctx.beginPath();
        projectedNodes.forEach((pn, idx) => {
          if (idx === 0) ctx.moveTo(pn.screenX, pn.screenY);
          else ctx.lineTo(pn.screenX, pn.screenY);
        });
        ctx.closePath();
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 116, 144, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Perimeter traveling packets
        perimeterPacketsRef.current.forEach((pkt) => {
          if (!shouldReduce) {
            pkt.progress += pkt.speed;
            if (pkt.progress > 1) pkt.progress = 0;
          }
          const fromNode = projectedNodes[pkt.edgeIdx];
          const toNode = projectedNodes[(pkt.edgeIdx + 1) % projectedNodes.length];
          if (fromNode && toNode) {
            const px = fromNode.screenX + (toNode.screenX - fromNode.screenX) * pkt.progress;
            const py = fromNode.screenY + (toNode.screenY - fromNode.screenY) * pkt.progress;

            ctx.fillStyle = pkt.color;
            ctx.shadowColor = pkt.color;
            ctx.shadowBlur = 7;
            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // 1F. Central 3D Rotating Isometric Wireframe Hypercube (Tesseract Digital Twin Core)
        const outerSize = isMobile ? 32 : 44;
        const innerSize = outerSize * 0.52;

        const rotX = shouldReduce ? 0.4 : time * 0.45 + (mouse.currentY - height * 0.5) * 0.0006;
        const rotY = shouldReduce ? 0.6 : time * 0.60 + (mouse.currentX - width * 0.5) * 0.0006;
        const rotZ = shouldReduce ? 0.2 : time * 0.25;

        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

        const project3DPoint = (x: number, y: number, z: number) => {
          // 3D rotation
          const y1 = y * cosX - z * sinX;
          const z1 = y * sinX + z * cosX;
          const x2 = x * cosY + z1 * sinY;
          const z2 = -x * sinY + z1 * cosY;
          const x3 = x2 * cosZ - y1 * sinZ;
          const y3 = x2 * sinZ + y1 * cosZ;

          return { x: coreCenterX + x3, y: coreCenterY + y3, z: z2 };
        };

        const cubeUnitVerts: Array<[number, number, number]> = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
        ];

        const outerVerts = cubeUnitVerts.map(([vx, vy, vz]) =>
          project3DPoint(vx * outerSize, vy * outerSize, vz * outerSize)
        );
        const innerVerts = cubeUnitVerts.map(([vx, vy, vz]) =>
          project3DPoint(vx * innerSize, vy * innerSize, vz * innerSize)
        );

        const cubeEdges: Array<[number, number]> = [
          [0, 1], [1, 2], [2, 3], [3, 0], // front face
          [4, 5], [5, 6], [6, 7], [7, 4], // back face
          [0, 4], [1, 5], [2, 6], [3, 7], // connecting edges
        ];

        // Draw outer hypercube wireframe (Ruby neon cybernetic)
        ctx.strokeStyle = isDarkMode ? 'rgba(244, 63, 94, 0.75)' : 'rgba(225, 29, 72, 0.70)';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 9;
        ctx.beginPath();
        cubeEdges.forEach(([a, b]) => {
          ctx.moveTo(outerVerts[a].x, outerVerts[a].y);
          ctx.lineTo(outerVerts[b].x, outerVerts[b].y);
        });
        ctx.stroke();

        // Draw inner tesseract cube wireframe (Cyan neon)
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.85)' : 'rgba(14, 116, 144, 0.80)';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 7;
        ctx.beginPath();
        cubeEdges.forEach(([a, b]) => {
          ctx.moveTo(innerVerts[a].x, innerVerts[a].y);
          ctx.lineTo(innerVerts[b].x, innerVerts[b].y);
        });
        ctx.stroke();

        // Cross-connect outer vertices to inner vertices (4D hypercube tesseract diagonals)
        ctx.strokeStyle = isDarkMode ? 'rgba(168, 85, 247, 0.45)' : 'rgba(124, 58, 237, 0.40)';
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          ctx.moveTo(outerVerts[i].x, outerVerts[i].y);
          ctx.lineTo(innerVerts[i].x, innerVerts[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Glowing center core energy beacon
        const coreBeaconGrad = ctx.createRadialGradient(coreCenterX, coreCenterY, 2, coreCenterX, coreCenterY, 22);
        coreBeaconGrad.addColorStop(0, '#f43f5e');
        coreBeaconGrad.addColorStop(0.4, isDarkMode ? 'rgba(244, 63, 94, 0.45)' : 'rgba(225, 29, 72, 0.35)');
        coreBeaconGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreBeaconGrad;
        ctx.beginPath();
        ctx.arc(coreCenterX, coreCenterY, 22, 0, Math.PI * 2);
        ctx.fill();

        // Core label badge
        if (!isMobile) {
          ctx.fillStyle = isDarkMode ? 'rgba(244, 63, 94, 0.95)' : 'rgba(225, 29, 72, 0.95)';
          ctx.font = '700 9px "JetBrains Mono", ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('DIGITAL TWIN // CORE', coreCenterX, coreCenterY + outerSize + 18);
          ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.65)' : 'rgba(100, 116, 139, 0.65)';
          ctx.font = '500 8px ui-sans-serif, system-ui, sans-serif';
          ctx.fillText('CODESYS / SCADA INTERCONNECT', coreCenterX, coreCenterY + outerSize + 29);
        }

        // 1G. Render Satellite Ecosystem Nodes (Depth-Sorted)
        const sortedNodes = [...projectedNodes].sort((a, b) => a.depthZ - b.depthZ);

        sortedNodes.forEach((pn) => {
          const depthRatio = Math.max(0.4, Math.min(1.0, (pn.depthZ + 200) / 400));
          const nodeRadius = (isMobile ? 12 : 15) * (0.8 + depthRatio * 0.35) * (pn.isHovered ? 1.25 : 1.0);

          // Outer halo ring
          ctx.beginPath();
          ctx.arc(pn.screenX, pn.screenY, nodeRadius + (pn.isHovered ? 7 : 4), 0, Math.PI * 2);
          ctx.strokeStyle = pn.node.glowColor;
          ctx.lineWidth = pn.isHovered ? 1.8 : 1.0;
          ctx.stroke();

          // Main node circle
          ctx.fillStyle = isDarkMode ? '#090d16' : '#f8fafc';
          ctx.strokeStyle = pn.node.color;
          ctx.lineWidth = pn.isHovered ? 2.0 : 1.4;
          ctx.shadowColor = pn.node.color;
          ctx.shadowBlur = pn.isHovered ? 14 : 6;
          ctx.beginPath();
          ctx.arc(pn.screenX, pn.screenY, nodeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Inner glowing beacon LED
          ctx.fillStyle = pn.node.color;
          ctx.beginPath();
          ctx.arc(pn.screenX, pn.screenY, nodeRadius * 0.38, 0, Math.PI * 2);
          ctx.fill();

          // Label chip & subtitle
          if (!isMobile || pn.isHovered) {
            const labelX = pn.screenX;
            const labelY = pn.screenY + nodeRadius + 14;

            ctx.textAlign = 'center';
            ctx.fillStyle = isDarkMode ? 'rgba(241, 245, 249, 0.92)' : 'rgba(15, 23, 42, 0.92)';
            ctx.font = '700 9px "JetBrains Mono", ui-monospace, monospace';
            ctx.fillText(pn.node.label, labelX, labelY);

            ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.70)' : 'rgba(100, 116, 139, 0.70)';
            ctx.font = '500 8px ui-sans-serif, system-ui, sans-serif';
            ctx.fillText(pn.node.sub, labelX, labelY + 11);
          }
        });

        ctx.restore();
      }

      // =========================================================================
      // MODE 2: LIDAR CYBER-MESH & HOLOGRAPHIC GYROSCOPE
      // =========================================================================
      else if (mode === 'lidar_mesh') {
        const coreCenterX = isMobile ? width * 0.5 : width * 0.74;
        const coreCenterY = isMobile ? height * 0.38 : height * 0.44;

        // 2A. 3D Isometric LiDAR Topographic Wave Grid
        ctx.save();
        const gridCols = isMobile ? 18 : 28;
        const gridRows = isMobile ? 12 : 18;
        const gridOriginX = width * 0.5 + (mouse.currentX - width * 0.5) * 0.03;
        const gridOriginY = height * 0.72 + (mouse.currentY - height * 0.5) * 0.02;

        const cellW = isMobile ? width * 0.055 : width * 0.042;
        const cellH = cellW * 0.52; // isometric aspect ratio

        // Calculate elevation matrix
        const nodeMatrix: Array<Array<{ x: number; y: number; z: number; intensityRatio: number }>> = [];

        for (let r = 0; r <= gridRows; r++) {
          const rowNodes: Array<{ x: number; y: number; z: number; intensityRatio: number }> = [];
          for (let c = 0; c <= gridCols; c++) {
            const relC = c - gridCols * 0.5;
            const relR = r - gridRows * 0.5;

            const isoX = gridOriginX + (relC - relR) * cellW;
            const isoY = gridOriginY + (relC + relR) * cellH;

            const wave1 = Math.sin(c * 0.32 + time * 1.3) * Math.cos(r * 0.28 + time * 0.9) * 22;
            const wave2 = Math.sin((c + r) * 0.2 - time * 1.6) * 14;

            const mDist = Math.hypot(isoX - mouse.currentX, isoY - mouse.currentY);
            const mRipple = mDist < 260 ? Math.cos(mDist * 0.035 - time * 6) * Math.exp(-Math.pow(mDist / 140, 2)) * 36 : 0;

            const totalZ = wave1 + wave2 + mRipple;
            const finalY = isoY - totalZ;

            const ratio = Math.max(0, Math.min(1, (totalZ + 30) / 60));

            rowNodes.push({ x: isoX, y: finalY, z: totalZ, intensityRatio: ratio });
          }
          nodeMatrix.push(rowNodes);
        }

        // Draw isometric terrain mesh lines
        ctx.lineWidth = 1;
        for (let r = 0; r <= gridRows; r++) {
          ctx.beginPath();
          for (let c = 0; c <= gridCols; c++) {
            const n = nodeMatrix[r][c];
            if (c === 0) ctx.moveTo(n.x, n.y);
            else ctx.lineTo(n.x, n.y);
          }
          const rowRatio = r / gridRows;
          const alpha = (0.04 + rowRatio * 0.16) * effectiveIntensity;
          ctx.strokeStyle = isDarkMode ? `rgba(56, 189, 248, ${alpha})` : `rgba(14, 116, 144, ${alpha})`;
          ctx.stroke();
        }

        for (let c = 0; c <= gridCols; c++) {
          ctx.beginPath();
          for (let r = 0; r <= gridRows; r++) {
            const n = nodeMatrix[r][c];
            if (r === 0) ctx.moveTo(n.x, n.y);
            else ctx.lineTo(n.x, n.y);
          }
          const colAlpha = (0.05 + Math.sin((c / gridCols) * Math.PI) * 0.14) * effectiveIntensity;
          ctx.strokeStyle = isDarkMode ? `rgba(168, 85, 247, ${colAlpha})` : `rgba(124, 58, 237, ${colAlpha})`;
          ctx.stroke();
        }

        // Glowing LiDAR elevation vertices
        ctx.fillStyle = isDarkMode ? '#38bdf8' : '#0284c7';
        for (let r = 2; r < gridRows; r += 2) {
          for (let c = 2; c < gridCols; c += 2) {
            const n = nodeMatrix[r][c];
            if (n.intensityRatio > 0.65) {
              const ptAlpha = (n.intensityRatio - 0.65) * 2.5 * effectiveIntensity;
              ctx.globalAlpha = ptAlpha;
              ctx.beginPath();
              ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.restore();

        // 2B. Ortholinear Industrial Fiber Tracks & Laser Data Packets
        ctx.save();
        circuitTracksRef.current.forEach((track) => {
          if (!shouldReduce) {
            track.packetProgress += track.speed;
            if (track.packetProgress > 1) track.packetProgress = 0;
          }

          const screenPts = track.points.map((p) => ({
            x: p.x * width,
            y: p.y * height,
          }));

          ctx.beginPath();
          ctx.moveTo(screenPts[0].x, screenPts[0].y);
          for (let i = 1; i < screenPts.length; i++) {
            ctx.lineTo(screenPts[i].x, screenPts[i].y);
          }
          ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 116, 144, 0.10)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.lineDashOffset = -time * 12;
          ctx.stroke();

          if (screenPts.length > 1) {
            const totalSegments = screenPts.length - 1;
            const currentSegFloat = track.packetProgress * totalSegments;
            const segIdx = Math.min(Math.floor(currentSegFloat), totalSegments - 1);
            const segFraction = currentSegFloat - segIdx;

            const pA = screenPts[segIdx];
            const pB = screenPts[segIdx + 1];
            const packetX = pA.x + (pB.x - pA.x) * segFraction;
            const packetY = pA.y + (pB.y - pA.y) * segFraction;

            ctx.setLineDash([]);
            ctx.fillStyle = track.color;
            ctx.shadowColor = track.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(packetX, packetY, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = track.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(screenPts[screenPts.length - 1].x - 3, screenPts[screenPts.length - 1].y - 3, 6, 6);
          }
        });
        ctx.restore();

        // 2C. Sweeping LiDAR Radar Sensor Cone
        ctx.save();
        const sweepAngle = (time * 0.8) % (Math.PI * 2);
        const radarRadius = Math.min(width, height) * 0.42;

        const sweepGrad = ctx.createRadialGradient(coreCenterX, coreCenterY, 10, coreCenterX, coreCenterY, radarRadius);
        sweepGrad.addColorStop(0, isDarkMode ? 'rgba(34, 211, 238, 0.16)' : 'rgba(14, 116, 144, 0.12)');
        sweepGrad.addColorStop(0.7, isDarkMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(124, 58, 237, 0.06)');
        sweepGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.moveTo(coreCenterX, coreCenterY);
        ctx.arc(coreCenterX, coreCenterY, radarRadius, sweepAngle - 0.45, sweepAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.55)' : 'rgba(14, 116, 144, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(coreCenterX, coreCenterY);
        ctx.lineTo(coreCenterX + Math.cos(sweepAngle) * radarRadius, coreCenterY + Math.sin(sweepAngle) * radarRadius);
        ctx.stroke();
        ctx.restore();

        // 2D. Rotating 3D Cybernetic Triple-Gimbal Gyroscope Core
        ctx.save();
        const drawGimbalRing = (
          radius: number,
          rotRingX: number,
          rotRingY: number,
          rotRingZ: number,
          strokeColor: string,
          lineWidth: number,
          dashPattern: number[],
          drawTicks: boolean
        ) => {
          const numPts = 64;
          const cX = Math.cos(rotRingX), sX = Math.sin(rotRingX);
          const cY = Math.cos(rotRingY), sY = Math.sin(rotRingY);
          const cZ = Math.cos(rotRingZ), sZ = Math.sin(rotRingZ);

          const pts: Array<{ x: number; y: number; z: number }> = [];

          for (let i = 0; i <= numPts; i++) {
            const theta = (i / numPts) * Math.PI * 2;
            const rx = radius * Math.cos(theta);
            const ry = radius * Math.sin(theta);
            const rz = 0;

            const y1 = ry * cX - rz * sX;
            const z1 = ry * sX + rz * cX;
            const x2 = rx * cY + z1 * sY;
            const z2 = -rx * sY + z1 * cY;
            const x3 = x2 * cZ - y1 * sZ;
            const y3 = x2 * sZ + y1 * cZ;

            pts.push({ x: coreCenterX + x3, y: coreCenterY + y3, z: z2 });
          }

          ctx.beginPath();
          pts.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.setLineDash(dashPattern);
          ctx.stroke();

          if (drawTicks) {
            ctx.setLineDash([]);
            for (let t = 0; t < 12; t++) {
              const tickIdx = Math.floor((t / 12) * numPts);
              const p = pts[tickIdx];
              ctx.fillStyle = strokeColor;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        };

        const tNorm = shouldReduce ? 1.0 : time;
        drawGimbalRing(135, 0.45, tNorm * 0.45, 0, isDarkMode ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 116, 144, 0.40)', 1.5, [6, 8], true);
        drawGimbalRing(92, -tNorm * 0.65, 0.38, tNorm * 0.22, isDarkMode ? 'rgba(168, 85, 247, 0.55)' : 'rgba(124, 58, 237, 0.45)', 1.4, [10, 14], true);
        drawGimbalRing(56, 0.2, -0.3, tNorm * 0.95, isDarkMode ? 'rgba(45, 212, 191, 0.65)' : 'rgba(13, 148, 136, 0.55)', 1.2, [4, 6], false);

        // Inner 3D Rotating Quantum Octahedron Cage
        const cageSize = 24;
        const cageRotX = tNorm * 0.7;
        const cageRotY = tNorm * 0.85;

        const cosCX = Math.cos(cageRotX), sinCX = Math.sin(cageRotX);
        const cosCY = Math.cos(cageRotY), sinCY = Math.sin(cageRotY);

        const octaVerts = [
          [0, -1, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1], [0, 1, 0]
        ];

        const projectedOcta = octaVerts.map(([vx, vy, vz]) => {
          const px = vx * cageSize;
          const py = vy * cageSize;
          const pz = vz * cageSize;

          const y1 = py * cosCX - pz * sinCX;
          const z1 = py * sinCX + pz * cosCX;
          const x2 = px * cosCY + z1 * sinCY;

          return { x: coreCenterX + x2, y: coreCenterY + y1 };
        });

        const octaEdges: Array<[number, number]> = [
          [0, 1], [0, 2], [0, 3], [0, 4],
          [5, 1], [5, 2], [5, 3], [5, 4],
          [1, 2], [2, 3], [3, 4], [4, 1],
        ];

        ctx.setLineDash([]);
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.85)' : 'rgba(14, 116, 144, 0.80)';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = isDarkMode ? '#38bdf8' : '#0284c7';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        octaEdges.forEach(([a, b]) => {
          ctx.moveTo(projectedOcta[a].x, projectedOcta[a].y);
          ctx.lineTo(projectedOcta[b].x, projectedOcta[b].y);
        });
        ctx.stroke();

        ctx.fillStyle = isDarkMode ? '#38bdf8' : '#0284c7';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(coreCenterX, coreCenterY, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2E. Floating Parallax Holographic Telemetry HUD Badges
        if (!isMobile) {
          ctx.save();
          const badges: HudBadge[] = [
            { relX: 0.12, relY: 0.32, label: 'LIDAR MESH TWIN', metric: '48.0 kS/s', sub: 'Spatial Resolution: 1.2mm', tone: 'cyan' },
            { relX: 0.85, relY: 0.22, label: 'SCADA BUS 10Gbps', metric: 'ISO-22400', sub: 'Ring Topology · Zero Drop', tone: 'purple' },
            { relX: 0.84, relY: 0.68, label: 'ACOUSTIC SENSOR', metric: '99.8% SYNC', sub: 'Heterodyne Ultrasound Active', tone: 'emerald' },
          ];

          badges.forEach((b) => {
            const bx = b.relX * width + (mouse.currentX - width * 0.5) * 0.015;
            const by = b.relY * height + (mouse.currentY - height * 0.5) * 0.015;

            ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.55)';
            ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 116, 144, 0.25)';
            ctx.lineWidth = 1;
            ctx.fillRect(bx, by, 140, 44);
            ctx.strokeRect(bx, by, 140, 44);

            ctx.fillStyle = b.tone === 'cyan' ? '#38bdf8' : b.tone === 'purple' ? '#c084fc' : '#34d399';
            ctx.fillRect(bx, by, 3, 44);

            ctx.fillStyle = isDarkMode ? 'rgba(226, 232, 240, 0.85)' : 'rgba(30, 41, 59, 0.85)';
            ctx.font = '700 9px "JetBrains Mono", ui-monospace, monospace';
            ctx.fillText(b.label, bx + 10, by + 14);

            ctx.fillStyle = b.tone === 'cyan' ? '#38bdf8' : b.tone === 'purple' ? '#c084fc' : '#34d399';
            ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
            ctx.fillText(b.metric, bx + 10, by + 28);

            ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)';
            ctx.font = '400 8px ui-sans-serif, system-ui, sans-serif';
            ctx.fillText(b.sub, bx + 10, by + 39);
          });
          ctx.restore();
        }
      }

      // =========================================================================
      // MODE 3: TOKAMAK PLASMA FUSION STELLARATOR (Magnetic Confinement Torus)
      // =========================================================================
      else if (mode === 'tokamak_fusion') {
        const torusCenterX = isMobile ? width * 0.5 : width * 0.68;
        const torusCenterY = isMobile ? height * 0.45 : height * 0.48;

        ctx.save();
        const numCoils = 16;
        const majorR = isMobile ? 130 : 200;
        const minorR = isMobile ? 48 : 70;

        for (let c = 0; c < numCoils; c++) {
          const coilAngle = (c / numCoils) * Math.PI * 2 + time * 0.15;
          const cx = torusCenterX + Math.cos(coilAngle) * majorR;
          const cy = torusCenterY + Math.sin(coilAngle) * majorR * 0.42;

          ctx.beginPath();
          ctx.ellipse(cx, cy, minorR * 0.35, minorR, coilAngle, 0, Math.PI * 2);
          ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 116, 144, 0.16)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        plasmaParticlesRef.current.forEach((p) => {
          if (!shouldReduce) {
            p.torusAngle += p.torusSpeed;
            p.poloidalAngle += p.poloidalSpeed;
          }

          const tX = (p.orbitRadius + p.tubeRadius * Math.cos(p.poloidalAngle)) * Math.cos(p.torusAngle);
          const tY = (p.orbitRadius + p.tubeRadius * Math.cos(p.poloidalAngle)) * Math.sin(p.torusAngle) * 0.44;
          const tZ = p.tubeRadius * Math.sin(p.poloidalAngle);

          const screenX = torusCenterX + tX;
          const screenY = torusCenterY + tY - tZ * 0.35;

          const depthAlpha = 0.3 + (Math.sin(p.torusAngle) + 1) * 0.35;

          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.globalAlpha = depthAlpha * effectiveIntensity;
          ctx.beginPath();
          ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        const lz = lorenzStateRef.current;
        if (!shouldReduce) {
          const dt = 0.008;
          const dx = 10 * (lz.y - lz.x) * dt;
          const dy = (lz.x * (28 - lz.z) - lz.y) * dt;
          const dz = (lz.x * lz.y - (8 / 3) * lz.z) * dt;

          lz.x += dx;
          lz.y += dy;
          lz.z += dz;

          lz.trail.push({ x: lz.x, y: lz.y, z: lz.z });
          if (lz.trail.length > 120) lz.trail.shift();
        }

        if (lz.trail.length > 2) {
          ctx.beginPath();
          const lzScale = isMobile ? 5.5 : 8.5;
          lz.trail.forEach((pt, idx) => {
            const px = torusCenterX + pt.x * lzScale;
            const py = torusCenterY + (pt.y - pt.z * 0.5) * lzScale * 0.5;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.strokeStyle = isDarkMode ? 'rgba(244, 63, 94, 0.45)' : 'rgba(225, 29, 72, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 10;
          ctx.stroke();
        }
        ctx.restore();
      }

      // =========================================================================
      // MODE 4: NEURAL SYNAPSE CYBER-GRID (Cognitive SCADA Machine Intelligence)
      // =========================================================================
      else if (mode === 'neural_synapse') {
        ctx.save();
        const nodes = neuralNodesRef.current;

        nodes.forEach((n, idx) => {
          const wanderX = Math.sin(time * 0.8 + idx * 1.2) * 12;
          const wanderY = Math.cos(time * 0.7 + idx * 0.9) * 12;
          n.x = n.baseX * width + wanderX;
          n.y = n.baseY * height + wanderY;
        });

        nodes.forEach((src) => {
          src.connections.forEach((targetIdx) => {
            const tgt = nodes[targetIdx];
            if (!tgt) return;

            const grad = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
            grad.addColorStop(0, isDarkMode ? 'rgba(56, 189, 248, 0.16)' : 'rgba(14, 116, 144, 0.14)');
            grad.addColorStop(1, isDarkMode ? 'rgba(168, 85, 247, 0.16)' : 'rgba(124, 58, 237, 0.14)');

            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.lineTo(tgt.x, tgt.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        });

        synapticPulsesRef.current.forEach((pulse) => {
          if (!shouldReduce) {
            pulse.progress += pulse.speed;
            if (pulse.progress > 1) {
              pulse.progress = 0;
              pulse.fromNode = Math.floor(Math.random() * (nodes.length - 3));
              const conns = nodes[pulse.fromNode]?.connections || [];
              if (conns.length > 0) {
                pulse.toNode = conns[Math.floor(Math.random() * conns.length)];
              }
            }
          }

          const src = nodes[pulse.fromNode];
          const tgt = nodes[pulse.toNode];
          if (src && tgt) {
            const px = src.x + (tgt.x - src.x) * pulse.progress;
            const py = src.y + (tgt.y - src.y) * pulse.progress;

            ctx.fillStyle = pulse.color;
            ctx.shadowColor = pulse.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        nodes.forEach((n) => {
          ctx.shadowBlur = 0;
          ctx.fillStyle = isDarkMode ? '#0f172a' : '#f8fafc';
          ctx.strokeStyle = isDarkMode ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 1.4;

          ctx.beginPath();
          ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isDarkMode ? '#38bdf8' : '#0284c7';
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          if (!isMobile) {
            ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.7)' : 'rgba(100, 116, 139, 0.7)';
            ctx.font = '600 8px "JetBrains Mono", ui-monospace, monospace';
            ctx.fillText(n.label, n.x + 8, n.y + 3);
          }
        });
        ctx.restore();
      }

      // =========================================================================
      // MODE 5: GRAVITATIONAL SINGULARITY VORTEX & QUANTUM TESSERACT
      // =========================================================================
      else if (mode === 'singularity') {
        const singCenterX = isMobile ? width * 0.5 : width * 0.72;
        const singCenterY = isMobile ? height * 0.42 : height * 0.48;

        const tiltCos = Math.cos(-0.4);
        const tiltSin = Math.sin(-0.4);
        const compressionY = 0.42;

        ctx.save();
        const rings = [
          { r: 75, speed: 0.008, dash: [8, 12], color: isDarkMode ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 116, 144, 0.35)' },
          { r: 135, speed: 0.005, dash: [14, 20], color: isDarkMode ? 'rgba(168, 85, 247, 0.4)' : 'rgba(124, 58, 237, 0.3)' },
          { r: 215, speed: 0.003, dash: [22, 34], color: isDarkMode ? 'rgba(45, 212, 191, 0.35)' : 'rgba(13, 148, 136, 0.28)' },
          { r: 310, speed: 0.0018, dash: [35, 45], color: isDarkMode ? 'rgba(245, 158, 11, 0.25)' : 'rgba(217, 119, 6, 0.2)' },
        ];

        rings.forEach((ring) => {
          ctx.beginPath();
          ctx.ellipse(singCenterX, singCenterY, ring.r, ring.r * compressionY, -0.4, 0, Math.PI * 2);
          ctx.strokeStyle = ring.color;
          ctx.lineWidth = 1.4;
          ctx.setLineDash(ring.dash);
          ctx.lineDashOffset = shouldReduce ? 0 : -time * ring.speed * 1200;
          ctx.stroke();
        });

        singularityParticlesRef.current.forEach((p) => {
          if (!shouldReduce) {
            const speedBoost = 150 / (p.r + 40);
            p.theta += p.orbitSpeed * speedBoost;
            const fallBoost = 220 / (p.r + 60);
            p.r -= p.radialSpeed * fallBoost * 0.35;
            if (p.r <= 38) {
              p.r = 480 + Math.random() * 160;
              p.theta = Math.random() * Math.PI * 2;
            }
          }

          const rawX = p.r * Math.cos(p.theta);
          const rawY = p.r * Math.sin(p.theta) * compressionY;
          const px = singCenterX + (rawX * tiltCos - rawY * tiltSin);
          const py = singCenterY + (rawX * tiltSin + rawY * tiltCos);

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * effectiveIntensity;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.beginPath();
        ctx.arc(singCenterX, singCenterY, 44, 0, Math.PI * 2);
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.95)' : 'rgba(14, 116, 144, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.stroke();

        ctx.fillStyle = isDarkMode ? '#020617' : '#0f172a';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(singCenterX, singCenterY, 36, 0, Math.PI * 2);
        ctx.fill();
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
        isDarkMode ? 'opacity-65' : 'opacity-45'
      }`}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden="true"
    />
  );
});

export const IndustrialBackdrop = SingularityBackdrop;
export default SingularityBackdrop;
