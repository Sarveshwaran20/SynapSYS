import React, { useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import { useDocumentVisible } from '../../lib/motion';

function resolveCssVarRgb(varName: string, fallbackRgb: string): string {
  if (typeof window === 'undefined' || !document.body) return fallbackRgb;
  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.color = `var(${varName})`;
  document.body.appendChild(probe);
  const computed = window.getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return fallbackRgb;
  return `${match[1]}, ${match[2]}, ${match[3]}`;
}

export const LandingScrollBackground: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollProgressRef = useRef(0);
  const ripplesRef = useRef<
    Array<{ x: number; y: number; r: number; maxR: number; alpha: number }>
  >([]);

  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();

  // Window-only scroll progress (never binds target refs, preventing hydration errors)
  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const updateScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
      scrollProgressRef.current = pct;
      rawProgress.set(pct);
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    updateScroll();
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [rawProgress]);

  // Mouse parallax + interactive click ripples
  useEffect(() => {
    if (shouldReduce) return;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX =
        ((e.clientX / window.innerWidth) - 0.5) * 0.45;
      mouseRef.current.targetY =
        ((e.clientY / window.innerHeight) - 0.5) * 0.35;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (ripplesRef.current.length > 6) ripplesRef.current.shift();
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        r: 12,
        maxR: Math.min(window.innerWidth, window.innerHeight) * 0.42,
        alpha: 0.7,
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [shouldReduce]);

  // 60FPS High-DPI 3D Classical Fluted Column & Telemetry Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    let palette = {
      blue: resolveCssVarRgb('--g-blue', '76, 141, 246'),
      purple: resolveCssVarRgb('--tyrian', '154, 91, 208'),
      text: resolveCssVarRgb('--g-text', '241, 243, 246'),
      bg: resolveCssVarRgb('--g-bg', '8, 10, 13'),
    };

    const refreshPalette = () => {
      palette = {
        blue: resolveCssVarRgb('--g-blue', '76, 141, 246'),
        purple: resolveCssVarRgb('--tyrian', '154, 91, 208'),
        text: resolveCssVarRgb('--g-text', '241, 243, 246'),
        bg: resolveCssVarRgb('--g-bg', '8, 10, 13'),
      };
    };

    const themeObserver = new MutationObserver(refreshPalette);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    const rings = 12;
    const pointsPerRing = 24;
    const columnHeight = 460;
    const dustCount = 42;
    const dustParticles = Array.from({ length: dustCount }, () => ({
      x: (Math.random() - 0.5) * width * 1.25,
      y: (Math.random() - 0.5) * height * 1.25,
      z: (Math.random() - 0.5) * 600,
      vy: -(0.25 + Math.random() * 0.45),
      size: 1 + Math.random() * 1.8,
      alpha: 0.16 + Math.random() * 0.45,
      purple: Math.random() > 0.72,
    }));

    let time = 0;

    const drawFrame = (advance: boolean) => {
      if (advance) {
        time += 0.011;
        mouseRef.current.x +=
          (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
        mouseRef.current.y +=
          (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      }

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.22;
      const scrollProgress = scrollProgressRef.current;

      const rotY = time * 0.32 + scrollProgress * Math.PI * 3.5 + mouseRef.current.x;
      const rotX =
        0.22 +
        Math.sin(time * 0.38 + scrollProgress * Math.PI) * 0.12 -
        mouseRef.current.y;

      // 1. Soft Midnight Marble Ambient Backlight Aura
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        24,
        centerX,
        centerY,
        Math.max(width, height) * 0.54
      );
      auraGradient.addColorStop(0, `rgba(${palette.blue}, 0.10)`);
      auraGradient.addColorStop(0.4, `rgba(${palette.purple}, 0.05)`);
      auraGradient.addColorStop(1, `rgba(${palette.bg}, 0)`);
      ctx.fillStyle = auraGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Click Shockwave Ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rip = ripplesRef.current[i];
        rip.r += 5.5;
        rip.alpha *= 0.94;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${palette.blue}, ${rip.alpha * 0.45})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (rip.alpha < 0.02 || rip.r >= rip.maxR) {
          ripplesRef.current.splice(i, 1);
        }
      }

      // 3. Upward Floating Dust Motes
      for (let i = 0; i < dustCount; i++) {
        const p = dustParticles[i];
        if (advance) {
          p.y += p.vy;
          if (p.y < -height * 0.6) {
            p.y = height * 0.6;
            p.x = (Math.random() - 0.5) * width * 1.25;
          }
        }
        const fov = 750;
        const scale = fov / (850 + p.z);
        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;
        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.purple ? palette.purple : palette.blue}, ${p.alpha * 0.6})`;
          ctx.fill();
        }
      }

      // 4. 3D Fluted Corinthian Column Projection
      const projectedRings: Array<Array<{ x: number; y: number; z: number }>> = [];
      for (let r = 0; r < rings; r++) {
        const ringY = (r / (rings - 1) - 0.5) * columnHeight;
        const ringPoints: Array<{ x: number; y: number; z: number }> = [];
        const flare =
          r === 0 || r === rings - 1
            ? 1.35
            : r === 1 || r === rings - 2
            ? 1.15
            : 1.0;
        const radius =
          baseRadius *
          flare *
          (1 + Math.sin(r * 0.45 + scrollProgress * 5) * 0.05);

        for (let p = 0; p < pointsPerRing; p++) {
          const theta = (p / pointsPerRing) * Math.PI * 2;
          const x0 = Math.cos(theta) * radius;
          const z0 = Math.sin(theta) * radius;
          const y0 = ringY;

          const cosY = Math.cos(rotY);
          const sinY = Math.sin(rotY);
          const x1 = x0 * cosY + z0 * sinY;
          const z1 = -x0 * sinY + z0 * cosY;

          const cosX = Math.cos(rotX);
          const sinX = Math.sin(rotX);
          const y2 = y0 * cosX - z1 * sinX;
          const z2 = y0 * sinX + z1 * cosX;

          const fov = 850;
          const scale = fov / (950 + z2);
          ringPoints.push({
            x: centerX + x1 * scale,
            y: centerY + y2 * scale,
            z: z2,
          });
        }
        projectedRings.push(ringPoints);
      }

      // Draw Concentric Horizontal Column Rings + Ascending Energy Pulse
      for (let r = 0; r < rings; r++) {
        const pts = projectedRings[r];
        ctx.beginPath();
        for (let p = 0; p < pointsPerRing; p++) {
          const pt = pts[p];
          if (p === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();

        const ascWave = Math.max(0, Math.sin(r * 0.55 - time * 3.2));
        const ringAlpha = 0.1 + ascWave * 0.18 + (r % 2 === 0 ? 0.09 : 0.03);
        const usePurple = r === 0 || r === rings - 1;
        ctx.strokeStyle = `rgba(${usePurple ? palette.purple : palette.blue}, ${ringAlpha})`;
        ctx.lineWidth = usePurple ? 1.7 : 0.95;
        ctx.stroke();
      }

      // Draw Vertical Classical Fluting Lines with 3D depth modulation
      for (let p = 0; p < pointsPerRing; p++) {
        const midPt = projectedRings[Math.floor(rings / 2)][p];
        const depthFactor = Math.max(
          0.35,
          Math.min(1.15, (midPt.z + baseRadius * 1.35) / (baseRadius * 2.2))
        );
        ctx.beginPath();
        for (let r = 0; r < rings; r++) {
          const pt = projectedRings[r][p];
          if (r === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const isPrimaryFlute = p % 3 === 0;
        ctx.strokeStyle = isPrimaryFlute
          ? `rgba(${palette.blue}, ${0.26 * depthFactor})`
          : `rgba(${palette.text}, ${0.09 * depthFactor})`;
        ctx.lineWidth = isPrimaryFlute ? 1.3 : 0.75;
        ctx.stroke();
      }

      // 4b. Inclined Orbital Telemetry Halo Ring Around Column Core
      const haloSegments = 48;
      const haloRadius = baseRadius * 1.72;
      const haloTilt = 0.36 + scrollProgress * 0.6;
      ctx.beginPath();
      for (let h = 0; h <= haloSegments; h++) {
        const a = (h / haloSegments) * Math.PI * 2 + time * 0.25;
        const hx0 = Math.cos(a) * haloRadius;
        const hz0 = Math.sin(a) * haloRadius;
        const hy0 = Math.sin(a) * haloRadius * haloTilt;
        const hCos = Math.cos(rotY * 0.5);
        const hSin = Math.sin(rotY * 0.5);
        const hx1 = hx0 * hCos + hz0 * hSin;
        const hz1 = -hx0 * hSin + hz0 * hCos;
        const scale = 850 / (950 + hz1);
        const sx = centerX + hx1 * scale;
        const sy = centerY + hy0 * scale;
        if (h === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = `rgba(${palette.blue}, 0.14)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 5. Orbiting Telemetry Nodes Around the Column
      const orbitNodes = 16;
      const orbitRadius = baseRadius * 1.55;
      for (let n = 0; n < orbitNodes; n++) {
        const angle =
          (n / orbitNodes) * Math.PI * 2 + time * 0.55 - scrollProgress * 3;
        const ox = Math.cos(angle) * orbitRadius;
        const oz = Math.sin(angle) * orbitRadius;
        const oy = Math.sin(angle * 2 + time) * 65;

        const cosY = Math.cos(rotY * 0.75);
        const sinY = Math.sin(rotY * 0.75);
        const rx = ox * cosY + oz * sinY;
        const rz = -ox * sinY + oz * cosY;

        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const ry = oy * cosX - rz * sinX;
        const rzFinal = oy * sinX + rz * cosX;

        const scale = 850 / (950 + rzFinal);
        const px = centerX + rx * scale;
        const py = centerY + ry * scale;

        const nodeRgb = n % 4 === 0 ? palette.purple : palette.blue;
        ctx.beginPath();
        ctx.arc(px, py, 3.0 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${nodeRgb}, 0.7)`;
        ctx.fill();

        if (n % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(centerX, centerY);
          ctx.strokeStyle = `rgba(${nodeRgb}, 0.07)`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    };

    if (shouldReduce || !isDocVisible) {
      drawFrame(false);
    } else {
      const loop = () => {
        drawFrame(true);
        animationFrameId = requestAnimationFrame(loop);
      };
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      themeObserver.disconnect();
    };
  }, [isDocVisible, shouldReduce]);

  return (
    <>
      {/* Top Scroll Progress Line */}
      {!shouldReduce && (
        <motion.div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none origin-left"
          style={{
            scaleX: smoothProgress,
            background:
              'linear-gradient(90deg, var(--g-blue) 0%, var(--tyrian) 100%)',
          }}
        />
      )}

      {/* Fullscreen High-DPI 60FPS 3D Neoclassical Column Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Subtle Radial Vignette Preserving Center Hero Text Readability */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 hero-canvas-vignette"
      />
    </>
  );
});

LandingScrollBackground.displayName = 'LandingScrollBackground';
