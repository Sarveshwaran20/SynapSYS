import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDocumentVisible } from '../../lib/motion';

export interface AuthBackdropProps {
  isDarkMode?: boolean;
  enabled?: boolean;
}

interface AtmosphericParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
  opacity: number;
}

export const AuthBackdrop: React.FC<AuthBackdropProps> = React.memo(({
  isDarkMode = true,
  enabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });
  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();

  const particlesRef = useRef<AtmosphericParticle[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!enabled || shouldReduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const initParticles = () => {
      const particles: AtmosphericParticle[] = [];
      const count = Math.min(45, Math.floor(width / 35));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          speed: 0.25 + Math.random() * 0.45,
          size: 1.0 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          opacity: 0.15 + Math.random() * 0.35,
        });
      }
      particlesRef.current = particles;
    };

    initParticles();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };
    window.addEventListener('resize', handleResize);

    let startTime = performance.now();

    const render = (currentTime: number) => {
      if (!isDocVisible) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = (currentTime - startTime) * 0.001;
      ctx.clearRect(0, 0, width, height);

      // Mouse smooth interpolation
      mouseRef.current.currentX += (mouseRef.current.x - mouseRef.current.currentX) * 0.04;
      mouseRef.current.currentY += (mouseRef.current.y - mouseRef.current.currentY) * 0.04;

      const parallaxX = (mouseRef.current.currentX - width * 0.5) * 0.035;
      const parallaxY = (mouseRef.current.currentY - height * 0.5) * 0.025;

      const vpX = width * 0.5 + parallaxX;
      const vpY = height * 0.52 + parallaxY;

      // =========================================================================
      // 1. HORIZON ATMOSPHERIC DAWN GLOW
      // =========================================================================
      ctx.save();
      const horizonGrad = ctx.createRadialGradient(vpX, vpY, 20, vpX, vpY, width * 0.7);
      horizonGrad.addColorStop(
        0,
        isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.09)'
      );
      horizonGrad.addColorStop(
        0.5,
        isDarkMode ? 'rgba(76, 141, 246, 0.04)' : 'rgba(37, 99, 235, 0.03)'
      );
      horizonGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // =========================================================================
      // 2. 3D PERSPECTIVE TERRAIN WIREFRAME (DIGITAL TWIN GROUND PLANE)
      // =========================================================================
      ctx.save();
      const groundStartY = vpY + 10;
      const groundHeight = height - groundStartY;

      if (groundHeight > 20) {
        // Perspective Vanishing Fan Rays
        ctx.lineWidth = 1;
        const numRays = 26;
        for (let r = 0; r <= numRays; r++) {
          const spreadFactor = (r / numRays) * 2 - 1; // -1 to +1
          const bottomX = vpX + spreadFactor * (width * 0.85);

          const rayAlpha = (1 - Math.abs(spreadFactor) * 0.5) * (isDarkMode ? 0.09 : 0.07);
          ctx.strokeStyle = isDarkMode
            ? `rgba(56, 189, 248, ${rayAlpha})`
            : `rgba(14, 116, 144, ${rayAlpha})`;

          ctx.beginPath();
          ctx.moveTo(vpX, groundStartY);
          ctx.lineTo(bottomX, height);
          ctx.stroke();
        }

        // Forward-Scrolling Perspective Transverse Grid Lines
        const numHorizLines = 14;
        const scrollSpeed = 0.16;
        const scrollOffset = (elapsed * scrollSpeed) % 1.0;

        for (let i = 0; i < numHorizLines; i++) {
          const depth = (i + scrollOffset) / numHorizLines;
          const projY = groundStartY + Math.pow(depth, 2.3) * groundHeight;
          const halfSpan = depth * (width * 0.9);

          const lineAlpha = depth * (isDarkMode ? 0.13 : 0.10);
          ctx.strokeStyle = isDarkMode
            ? `rgba(56, 189, 248, ${lineAlpha})`
            : `rgba(14, 116, 144, ${lineAlpha})`;

          ctx.beginPath();
          ctx.moveTo(vpX - halfSpan, projY);
          ctx.lineTo(vpX + halfSpan, projY);
          ctx.stroke();
        }

        // Horizon Boundary Line with faint laser glow
        ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.28)' : 'rgba(14, 116, 144, 0.22)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(width * 0.1, groundStartY);
        ctx.lineTo(width * 0.9, groundStartY);
        ctx.stroke();
      }
      ctx.restore();

      // =========================================================================
      // 3. CONCENTRIC SECURITY VAULT RETICLE & ORBITAL RADAR RINGS
      // =========================================================================
      ctx.save();
      const reticleX = vpX;
      const reticleY = vpY - 20;

      // Outer Orbital Ring with Degree Ticks
      const outerR = Math.min(360, width * 0.32);
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 116, 144, 0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(reticleX, reticleY, outerR, 0, Math.PI * 2);
      ctx.stroke();

      // Degree Tick Marks (every 6 degrees)
      const tickRot = elapsed * 0.03;
      for (let d = 0; d < 60; d++) {
        const angle = (d * 6 * Math.PI) / 180 + tickRot;
        const isMajor = d % 5 === 0;
        const tLen = isMajor ? 8 : 4;

        const x1 = reticleX + Math.cos(angle) * (outerR - tLen);
        const y1 = reticleY + Math.sin(angle) * (outerR - tLen);
        const x2 = reticleX + Math.cos(angle) * outerR;
        const y2 = reticleY + Math.sin(angle) * outerR;

        ctx.strokeStyle = isMajor
          ? (isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 116, 144, 0.20)')
          : (isDarkMode ? 'rgba(56, 189, 248, 0.10)' : 'rgba(14, 116, 144, 0.08)');

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Middle Segmented Dashed Ring with Counter-Rotation
      const midR = outerR * 0.72;
      ctx.save();
      ctx.strokeStyle = isDarkMode ? 'rgba(76, 141, 246, 0.15)' : 'rgba(37, 99, 235, 0.12)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([12, 14]);
      ctx.beginPath();
      ctx.arc(reticleX, reticleY, midR, -elapsed * 0.04, -elapsed * 0.04 + Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Rotating Radar Scanner Beam Arc (110-degree sweep)
      const scanAngle = elapsed * 0.45;
      const beamGrad = ctx.createRadialGradient(reticleX, reticleY, 20, reticleX, reticleY, midR);
      beamGrad.addColorStop(
        0,
        isDarkMode ? 'rgba(56, 189, 248, 0.14)' : 'rgba(14, 116, 144, 0.10)'
      );
      beamGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(reticleX, reticleY);
      ctx.arc(reticleX, reticleY, midR, scanAngle, scanAngle + Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();

      // Quadrant Cardinal Alignment Calipers
      const calR = outerR + 18;
      const cardAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
      ctx.strokeStyle = isDarkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 116, 144, 0.28)';
      ctx.lineWidth = 1.5;

      cardAngles.forEach((a) => {
        const cx1 = reticleX + Math.cos(a) * (calR - 7);
        const cy1 = reticleY + Math.sin(a) * (calR - 7);
        const cx2 = reticleX + Math.cos(a) * (calR + 7);
        const cy2 = reticleY + Math.sin(a) * (calR + 7);
        ctx.beginPath();
        ctx.moveTo(cx1, cy1);
        ctx.lineTo(cx2, cy2);
        ctx.stroke();
      });

      // Caliper coordinate text
      ctx.fillStyle = isDarkMode ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.50)';
      ctx.font = '600 7.5px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `SEC-GATE // AZIMUTH ${(((elapsed * 20) % 360)).toFixed(1)}°`,
        reticleX,
        reticleY - outerR - 12
      );
      ctx.fillText('NODE: GATEWAY-01 // TLS 1.3', reticleX, reticleY + outerR + 20);

      ctx.restore();

      // =========================================================================
      // 4. FLOATING ATMOSPHERIC CLEANROOM PARTICLES
      // =========================================================================
      ctx.save();
      const particles = particlesRef.current;
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(elapsed * 0.8 + p.phase) * 0.3;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        // Particle Glow
        const alpha = p.opacity * (isDarkMode ? 0.7 : 0.55);
        ctx.fillStyle = isDarkMode
          ? `rgba(56, 189, 248, ${alpha})`
          : `rgba(14, 116, 144, ${alpha})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, isDarkMode, shouldReduce, isDocVisible]);

  if (!enabled || shouldReduce) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
        isDarkMode ? 'opacity-85' : 'opacity-65'
      }`}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden="true"
    />
  );
});

export default AuthBackdrop;
