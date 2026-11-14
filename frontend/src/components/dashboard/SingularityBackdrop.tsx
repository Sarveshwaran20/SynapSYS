import React, { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDocumentVisible } from '../../lib/motion';

export interface SingularityBackdropProps {
  isDarkMode?: boolean;
  enabled?: boolean;
  intensity?: number; // 0.1 to 1.0 (default: 0.6)
}

interface Particle {
  r: number;
  theta: number;
  orbitSpeed: number;
  radialSpeed: number;
  size: number;
  color: string;
  alpha: number;
  history: Array<{ x: number; y: number }>;
}

interface EcosystemNode {
  id: string;
  label: string;
  sub: string;
  baseRadius: number;
  baseAngle: number;
  orbitSpeed: number;
  connections: number[];
  packetProgress: number[];
}

export const SingularityBackdrop: React.FC<SingularityBackdropProps> = React.memo(({
  isDarkMode = true,
  enabled = true,
  intensity = 0.65,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });
  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();

  // Particle pool
  const particlesRef = useRef<Particle[]>([]);
  // Ecosystem Nodes inspired by SCADA telemetry constellation
  const nodesRef = useRef<EcosystemNode[]>([
    {
      id: 'node-0',
      label: 'OPC-UA FIELD INGESTION',
      sub: '10ms Telemetry Stream',
      baseRadius: 360,
      baseAngle: 0.4,
      orbitSpeed: 0.0003,
      connections: [1, 5],
      packetProgress: [0.2, 0.7],
    },
    {
      id: 'node-1',
      label: 'ACOUSTIC AI TWIN',
      sub: 'Ultrasonic Heterodyne',
      baseRadius: 420,
      baseAngle: 1.3,
      orbitSpeed: 0.00022,
      connections: [2],
      packetProgress: [0.5],
    },
    {
      id: 'node-2',
      label: 'DIGITAL TWIN SHOP FLOOR',
      sub: 'Spatial Asset Mapping',
      baseRadius: 490,
      baseAngle: 2.2,
      orbitSpeed: 0.00018,
      connections: [3],
      packetProgress: [0.1],
    },
    {
      id: 'node-3',
      label: 'AI DEPLETION HORIZON',
      sub: 'Weibull Predictive MTBF',
      baseRadius: 440,
      baseAngle: 3.4,
      orbitSpeed: 0.00025,
      connections: [4],
      packetProgress: [0.6],
    },
    {
      id: 'node-4',
      label: '3D SMART CRIB & RFID',
      sub: 'Automated 2FA Logistics',
      baseRadius: 380,
      baseAngle: 4.3,
      orbitSpeed: 0.00028,
      connections: [5],
      packetProgress: [0.35],
    },
    {
      id: 'node-5',
      label: 'SIX BIG LOSSES (ISO-22400)',
      sub: 'Real-Time OEE Yield',
      baseRadius: 470,
      baseAngle: 5.2,
      orbitSpeed: 0.0002,
      connections: [6],
      packetProgress: [0.8],
    },
    {
      id: 'node-6',
      label: 'ISA-18.2 ALARM RADAR',
      sub: 'Autonomous Triage Matrix',
      baseRadius: 340,
      baseAngle: 6.0,
      orbitSpeed: 0.00035,
      connections: [0, 1],
      packetProgress: [0.4, 0.9],
    },
  ]);

  // Initialize particle pool
  const initParticles = useCallback((count: number) => {
    const list: Particle[] = [];
    const colors = isDarkMode
      ? ['#38bdf8', '#818cf8', '#c084fc', '#2dd4bf', '#fbbf24']
      : ['#0284c7', '#4f46e5', '#7c3aed', '#0d9488', '#d97706'];

    for (let i = 0; i < count; i++) {
      list.push({
        r: 60 + Math.random() * 540,
        theta: Math.random() * Math.PI * 2,
        orbitSpeed: 0.004 + Math.random() * 0.012,
        radialSpeed: 0.25 + Math.random() * 0.75,
        size: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.2 + Math.random() * 0.8,
        history: [],
      });
    }
    particlesRef.current = list;
  }, [isDarkMode]);

  useEffect(() => {
    initParticles(110);
  }, [initParticles]);

  // Track mouse coordinates for smooth gravitational parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Main 60fps render loop
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

      // Smooth mouse lerp
      mouseRef.current.currentX += (mouseRef.current.x - mouseRef.current.currentX) * 0.05;
      mouseRef.current.currentY += (mouseRef.current.y - mouseRef.current.currentY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Gravitational center (singularity origin)
      // Placed slightly to the center-right to complement left navigation and top KPIs
      const isMobile = width < 768;
      const baseCenterX = isMobile ? width * 0.5 : width * 0.72;
      const baseCenterY = isMobile ? height * 0.42 : height * 0.48;

      const mouseDeltaX = (mouseRef.current.currentX - width * 0.5) * 0.04;
      const mouseDeltaY = (mouseRef.current.currentY - height * 0.5) * 0.04;

      const centerX = baseCenterX + mouseDeltaX;
      const centerY = baseCenterY + mouseDeltaY;

      // 3D tilt plane parameters for the accretion disk
      const tiltCos = Math.cos(-0.4);
      const tiltSin = Math.sin(-0.4);
      const compressionY = 0.42; // Perspective elongation

      // -------------------------------------------------------------
      // 1. OUTER COSMIC GRAVITATIONAL WARPING & GRID LINES
      // -------------------------------------------------------------
      ctx.save();
      const gridSpacing = 90;
      const gridCols = Math.ceil(width / gridSpacing);
      const gridRows = Math.ceil(height / gridSpacing);

      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.035)' : 'rgba(14, 116, 144, 0.035)';
      ctx.lineWidth = 1;

      for (let i = 0; i <= gridCols; i++) {
        const x = i * gridSpacing;
        ctx.beginPath();
        for (let j = 0; j <= gridRows; j++) {
          const y = j * gridSpacing;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Gravitational spacetime indentation warp
          const warpFactor = Math.max(0, 1 - dist / 500);
          const pull = (warpFactor * warpFactor * 32);
          const warpedX = dist > 40 ? x - (dx / (dist || 1)) * pull : x;
          const warpedY = dist > 40 ? y - (dy / (dist || 1)) * pull : y;

          if (j === 0) ctx.moveTo(warpedX, warpedY);
          else ctx.lineTo(warpedX, warpedY);
        }
        ctx.stroke();
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 2. INDUSTRIAL SCADA CONSTELLATION NODES & NETWORK BEAMS
      // -------------------------------------------------------------
      const nodeScreenCoords: Array<{ x: number; y: number; node: EcosystemNode }> = [];

      nodesRef.current.forEach((node) => {
        if (!shouldReduce) {
          node.baseAngle += node.orbitSpeed;
        }

        const angle = node.baseAngle;
        const r = node.baseRadius;

        // Apply accretion plane tilt
        const rawX = r * Math.cos(angle);
        const rawY = r * Math.sin(angle) * compressionY;

        const rotatedX = rawX * tiltCos - rawY * tiltSin;
        const rotatedY = rawX * tiltSin + rawY * tiltCos;

        const screenX = centerX + rotatedX;
        const screenY = centerY + rotatedY;

        nodeScreenCoords.push({ x: screenX, y: screenY, node });
      });

      // Draw connection vectors between nodes
      ctx.save();
      nodeScreenCoords.forEach((src) => {
        src.node.connections.forEach((targetIdx, connIdx) => {
          const target = nodeScreenCoords[targetIdx];
          if (!target) return;

          // Vector line
          const lineGrad = ctx.createLinearGradient(src.x, src.y, target.x, target.y);
          if (isDarkMode) {
            lineGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
            lineGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.22)');
            lineGrad.addColorStop(1, 'rgba(56, 189, 248, 0.18)');
          } else {
            lineGrad.addColorStop(0, 'rgba(14, 116, 144, 0.14)');
            lineGrad.addColorStop(0.5, 'rgba(109, 40, 217, 0.16)');
            lineGrad.addColorStop(1, 'rgba(14, 116, 144, 0.14)');
          }

          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.lineDashOffset = -time * 18;

          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();

          // Data packet beam traveling along line
          if (!shouldReduce) {
            const currentP = (src.node.packetProgress[connIdx] || 0) + 0.007;
            src.node.packetProgress[connIdx] = currentP > 1 ? 0 : currentP;

            const packetX = src.x + (target.x - src.x) * currentP;
            const packetY = src.y + (target.y - src.y) * currentP;

            ctx.save();
            ctx.setLineDash([]);
            ctx.fillStyle = isDarkMode ? '#38bdf8' : '#0284c7';
            ctx.shadowColor = isDarkMode ? '#38bdf8' : '#0284c7';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(packetX, packetY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
      });
      ctx.restore();

      // Render individual ecosystem node hubs
      nodeScreenCoords.forEach(({ x, y, node }, idx) => {
        ctx.save();

        // Pulsing radar ripple
        const pulsePhase = (time * 1.8 + idx * 0.9) % (Math.PI * 2);
        const rippleR = 8 + Math.sin(pulsePhase) * 6;
        const rippleAlpha = Math.max(0, 0.4 - (rippleR / 18) * 0.4);

        ctx.strokeStyle = isDarkMode ? `rgba(56, 189, 248, ${rippleAlpha})` : `rgba(14, 116, 144, ${rippleAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, rippleR, 0, Math.PI * 2);
        ctx.stroke();

        // Core Hub Dot
        ctx.fillStyle = isDarkMode ? '#38bdf8' : '#0284c7';
        ctx.shadowColor = isDarkMode ? 'rgba(56, 189, 248, 0.8)' : 'rgba(2, 132, 199, 0.6)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Outer Target Ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isDarkMode ? 'rgba(168, 85, 247, 0.4)' : 'rgba(124, 58, 237, 0.35)';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();

        // Node Label Typography (industrial SCADA telemetry badge)
        if (!isMobile) {
          ctx.fillStyle = isDarkMode ? 'rgba(226, 232, 240, 0.75)' : 'rgba(30, 41, 59, 0.75)';
          ctx.font = '600 9px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillText(node.label, x + 12, y - 2);

          ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.55)';
          ctx.font = '400 8px ui-sans-serif, system-ui, sans-serif';
          ctx.fillText(node.sub, x + 12, y + 9);
        }

        ctx.restore();
      });

      // -------------------------------------------------------------
      // 3. ACCRETION DISK RINGS (Differential Keplerian Motion)
      // -------------------------------------------------------------
      ctx.save();
      const ringConfigs = [
        { r: 75, speed: 0.008, dash: [8, 12], color: isDarkMode ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 116, 144, 0.35)', width: 2 },
        { r: 135, speed: 0.005, dash: [14, 20], color: isDarkMode ? 'rgba(168, 85, 247, 0.4)' : 'rgba(124, 58, 237, 0.3)', width: 1.5 },
        { r: 215, speed: 0.003, dash: [22, 34], color: isDarkMode ? 'rgba(45, 212, 191, 0.35)' : 'rgba(13, 148, 136, 0.28)', width: 1.2 },
        { r: 310, speed: 0.0018, dash: [35, 45], color: isDarkMode ? 'rgba(245, 158, 11, 0.25)' : 'rgba(217, 119, 6, 0.2)', width: 1 },
      ];

      ringConfigs.forEach((ring) => {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, ring.r, ring.r * compressionY, -0.4, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.width;
        ctx.setLineDash(ring.dash);
        ctx.lineDashOffset = shouldReduce ? 0 : -time * ring.speed * 1200;
        ctx.stroke();
      });
      ctx.restore();

      // -------------------------------------------------------------
      // 4. INFALLING GEODESIC PARTICLES (Accretion Flow Quanta)
      // -------------------------------------------------------------
      ctx.save();
      particlesRef.current.forEach((p) => {
        if (!shouldReduce) {
          // Keplerian orbital acceleration: closer to core = faster orbit
          const speedBoost = 150 / (p.r + 40);
          p.theta += p.orbitSpeed * speedBoost;

          // Gravitational infalling descent: accelerates towards event horizon
          const fallBoost = 220 / (p.r + 60);
          p.r -= p.radialSpeed * fallBoost * 0.35;

          // If crossed the event horizon, respawn at outer boundary
          if (p.r <= 38) {
            p.r = 480 + Math.random() * 160;
            p.theta = Math.random() * Math.PI * 2;
            p.history = [];
          }
        }

        // Project into tilted accretion plane
        const rawX = p.r * Math.cos(p.theta);
        const rawY = p.r * Math.sin(p.theta) * compressionY;

        const x = centerX + (rawX * tiltCos - rawY * tiltSin);
        const y = centerY + (rawX * tiltSin + rawY * tiltCos);

        // Track trail
        p.history.push({ x, y });
        if (p.history.length > 5) p.history.shift();

        // Relativistic brightness enhancement near horizon
        const proximity = Math.max(0, 1 - (p.r - 38) / 300);
        const alpha = Math.min(1, p.alpha * (0.35 + proximity * 0.65) * intensity);

        // Draw particle tail
        if (p.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.history[0].x, p.history[0].y);
          for (let h = 1; h < p.history.length; h++) {
            ctx.lineTo(p.history[h].x, p.history[h].y);
          }
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = alpha * 0.5;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw particle head
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (0.8 + proximity * 0.6), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // -------------------------------------------------------------
      // 5. PHOTON SPHERE & THE SINGULARITY CORE (Black Hole Event Horizon)
      // -------------------------------------------------------------
      ctx.save();
      const horizonRadius = 38;

      // Outer Gravitational Glow / Relativistic Doppler Beaming
      const glowGrad = ctx.createRadialGradient(
        centerX - 8,
        centerY - 4,
        horizonRadius * 0.8,
        centerX,
        centerY,
        horizonRadius * 3.5
      );

      if (isDarkMode) {
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
        glowGrad.addColorStop(0.35, 'rgba(168, 85, 247, 0.35)');
        glowGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.12)');
        glowGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      } else {
        glowGrad.addColorStop(0, 'rgba(14, 116, 144, 0.35)');
        glowGrad.addColorStop(0.35, 'rgba(109, 40, 217, 0.25)');
        glowGrad.addColorStop(0.7, 'rgba(37, 99, 235, 0.1)');
        glowGrad.addColorStop(1, 'rgba(241, 245, 249, 0)');
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, horizonRadius * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Photon Ring (1.5x Schwarzschild Radius)
      ctx.beginPath();
      ctx.arc(centerX, centerY, horizonRadius * 1.25, 0, Math.PI * 2);
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.95)' : 'rgba(14, 116, 144, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = isDarkMode ? '#38bdf8' : '#0284c7';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Secondary Lensing Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, horizonRadius * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = isDarkMode ? 'rgba(168, 85, 247, 0.45)' : 'rgba(124, 58, 237, 0.35)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Inner Absolute Event Horizon (The Black Hole Core)
      ctx.shadowBlur = 0;
      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        horizonRadius
      );
      if (isDarkMode) {
        coreGrad.addColorStop(0, 'rgba(2, 6, 23, 0.95)');
        coreGrad.addColorStop(0.85, 'rgba(3, 7, 18, 0.98)');
        coreGrad.addColorStop(1, 'rgba(3, 7, 18, 1)');
      } else {
        coreGrad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
        coreGrad.addColorStop(0.85, 'rgba(30, 41, 59, 0.96)');
        coreGrad.addColorStop(1, 'rgba(30, 41, 59, 1)');
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, horizonRadius, 0, Math.PI * 2);
      ctx.fill();

      // -------------------------------------------------------------
      // 5B. 3D ROTATING QUANTUM TESSERACT LATTICE CORE
      // Inspired by CODESYS industrial ecosystem cybernetic wireframe
      // -------------------------------------------------------------
      const rotTime = shouldReduce ? 1.2 : time;
      const rotX = rotTime * 0.38;
      const rotY = rotTime * 0.52;
      const rotZ = rotTime * 0.22;

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

      // 3D Rotation and Perspective Projection Helper
      const project3D = (x: number, y: number, z: number, scaleFactor: number) => {
        // Rotate X
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;
        // Rotate Y
        const x2 = x * cosY + z1 * sinY;
        const z2 = -x * sinY + z1 * cosY;
        // Rotate Z
        const x3 = x2 * cosZ - y1 * sinZ;
        const y3 = x2 * sinZ + y1 * cosZ;

        // Perspective projection
        const cameraDist = 180;
        const fov = cameraDist / (cameraDist + z2);
        return {
          px: centerX + x3 * fov * scaleFactor,
          py: centerY + y3 * fov * scaleFactor,
          depth: z2,
        };
      };

      // Define 16 vertices of a 4D Hypercube / Double-Lattice projection
      const sOuter = 21;
      const sInner = 11;
      const outerVerts3D = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1],
      ];

      const projOuter = outerVerts3D.map(([vx, vy, vz]) => project3D(vx * sOuter, vy * sOuter, vz * sOuter, 1));
      const projInner = outerVerts3D.map(([vx, vy, vz]) => project3D(vx * sInner, vy * sInner, vz * sInner, 1));

      // 12 edges for standard cube
      const cubeEdges: Array<[number, number]> = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];

      ctx.save();
      // Outer Hypercube Wireframe
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.65)' : 'rgba(14, 116, 144, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = isDarkMode ? '#38bdf8' : '#0284c7';
      ctx.shadowBlur = 6;

      ctx.beginPath();
      cubeEdges.forEach(([a, b]) => {
        ctx.moveTo(projOuter[a].px, projOuter[a].py);
        ctx.lineTo(projOuter[b].px, projOuter[b].py);
      });
      ctx.stroke();

      // Inner Nested Quantum Core Wireframe
      ctx.strokeStyle = isDarkMode ? 'rgba(168, 85, 247, 0.7)' : 'rgba(124, 58, 237, 0.65)';
      ctx.lineWidth = 1;
      ctx.shadowColor = isDarkMode ? '#c084fc' : '#7c3aed';
      ctx.shadowBlur = 5;

      ctx.beginPath();
      cubeEdges.forEach(([a, b]) => {
        ctx.moveTo(projInner[a].px, projInner[a].py);
        ctx.lineTo(projInner[b].px, projInner[b].py);
      });
      ctx.stroke();

      // Inter-lattice connector struts (Tesseract diagonals)
      ctx.strokeStyle = isDarkMode ? 'rgba(45, 212, 191, 0.4)' : 'rgba(13, 148, 136, 0.35)';
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = 0;

      ctx.beginPath();
      for (let v = 0; v < 8; v++) {
        ctx.moveTo(projOuter[v].px, projOuter[v].py);
        ctx.lineTo(projInner[v].px, projInner[v].py);
      }
      ctx.stroke();

      // Glowing vertex node pins
      ctx.fillStyle = isDarkMode ? '#38bdf8' : '#0284c7';
      projOuter.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = isDarkMode ? '#c084fc' : '#7c3aed';
      projInner.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Delicate Inner Telemetry Reticle
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 116, 144, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, horizonRadius * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      // Micro crosshair at singularity focal point
      const chSize = 4;
      ctx.beginPath();
      ctx.moveTo(centerX - chSize, centerY);
      ctx.lineTo(centerX + chSize, centerY);
      ctx.moveTo(centerX, centerY - chSize);
      ctx.lineTo(centerX, centerY + chSize);
      ctx.stroke();

      ctx.restore();

      if (!shouldReduce) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDarkMode, enabled, intensity, isDocVisible, shouldReduce]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
        isDarkMode ? 'opacity-55' : 'opacity-35'
      }`}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden="true"
    />
  );
});

SingularityBackdrop.displayName = 'SingularityBackdrop';
