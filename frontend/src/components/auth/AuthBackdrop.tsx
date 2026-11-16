import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDocumentVisible } from '../../lib/motion';

export interface AuthBackdropProps {
  isDarkMode?: boolean;
  enabled?: boolean;
}

export const AuthBackdrop: React.FC<AuthBackdropProps> = React.memo(({
  isDarkMode = true,
  enabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({
    currentX: -1000,
    currentY: -1000,
    targetX: -1000,
    targetY: -1000,
    isOver: false,
  });
  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.isOver = true;
    };
    const handleMouseLeave = () => {
      mouseRef.current.isOver = false;
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();

    const render = (currentTime: number) => {
      if (!isDocVisible) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const elapsed = (currentTime - startTime) * 0.001;

      // Smooth mouse interpolation
      if (mouseRef.current.isOver) {
        mouseRef.current.currentX += (mouseRef.current.targetX - mouseRef.current.currentX) * 0.12;
        mouseRef.current.currentY += (mouseRef.current.targetY - mouseRef.current.currentY) * 0.12;
      } else {
        mouseRef.current.currentX = -1000;
        mouseRef.current.currentY = -1000;
      }

      const mx = mouseRef.current.currentX;
      const my = mouseRef.current.currentY;

      // 1. Ultra-subtle ambient atmospheric glow orbs (breathing gently in background)
      const orb1X = width * 0.5 + Math.sin(elapsed * 0.25) * (width * 0.15);
      const orb1Y = height * 0.45 + Math.cos(elapsed * 0.3) * (height * 0.1);
      const orb1Grad = ctx.createRadialGradient(orb1X, orb1Y, 40, orb1X, orb1Y, Math.min(width * 0.5, 540));
      orb1Grad.addColorStop(0, isDarkMode ? 'rgba(37, 99, 235, 0.055)' : 'rgba(59, 130, 246, 0.04)');
      orb1Grad.addColorStop(1, 'transparent');
      ctx.fillStyle = orb1Grad;
      ctx.fillRect(0, 0, width, height);

      const orb2X = width * 0.65 + Math.cos(elapsed * 0.2) * (width * 0.12);
      const orb2Y = height * 0.6 + Math.sin(elapsed * 0.22) * (height * 0.12);
      const orb2Grad = ctx.createRadialGradient(orb2X, orb2Y, 30, orb2X, orb2Y, Math.min(width * 0.4, 460));
      orb2Grad.addColorStop(0, isDarkMode ? 'rgba(6, 182, 212, 0.04)' : 'rgba(14, 165, 233, 0.03)');
      orb2Grad.addColorStop(1, 'transparent');
      ctx.fillStyle = orb2Grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Interactive flashlight illumination aura
      const torchRadius = 280;
      if (mx > -200 && my > -200) {
        const torchGrad = ctx.createRadialGradient(mx, my, 0, mx, my, torchRadius);
        torchGrad.addColorStop(0, isDarkMode ? 'rgba(56, 189, 248, 0.06)' : 'rgba(2, 132, 199, 0.045)');
        torchGrad.addColorStop(0.6, isDarkMode ? 'rgba(56, 189, 248, 0.02)' : 'rgba(2, 132, 199, 0.015)');
        torchGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = torchGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Precision architectural drafting crosshair grid
      const gridSize = 44;
      const crossSize = 2.5;

      const baseCrossColor = isDarkMode ? 'rgba(148, 163, 184, 0.07)' : 'rgba(71, 85, 105, 0.08)';
      const activeCrossColor = isDarkMode ? 'rgba(56, 189, 248, ' : 'rgba(2, 132, 199, ';

      // Render crisp micro-crosshairs at grid points
      const startX = Math.floor((width % gridSize) / 2);
      const startY = Math.floor((height % gridSize) / 2);

      for (let x = startX; x < width; x += gridSize) {
        for (let y = startY; y < height; y += gridSize) {
          const dist = Math.hypot(x - mx, y - my);

          if (dist < torchRadius && mx > -200) {
            const factor = Math.pow(1 - dist / torchRadius, 2);
            const alpha = 0.07 + factor * 0.38;
            ctx.strokeStyle = `${activeCrossColor}${alpha})`;
            ctx.lineWidth = 1;

            const extendedArm = crossSize + factor * 1.5;
            ctx.beginPath();
            ctx.moveTo(x - extendedArm, y);
            ctx.lineTo(x + extendedArm, y);
            ctx.moveTo(x, y - extendedArm);
            ctx.lineTo(x, y + extendedArm);
            ctx.stroke();
          } else {
            ctx.strokeStyle = baseCrossColor;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(x - crossSize, y);
            ctx.lineTo(x + crossSize, y);
            ctx.moveTo(x, y - crossSize);
            ctx.lineTo(x, y + crossSize);
            ctx.stroke();
          }
        }
      }

      ctx.restore();

      if (!shouldReduce) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    if (shouldReduce) {
      render(startTime);
    } else {
      animFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [enabled, isDarkMode, shouldReduce, isDocVisible]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
        isDarkMode ? 'opacity-90' : 'opacity-75'
      }`}
      aria-hidden="true"
    />
  );
});

export default AuthBackdrop;
