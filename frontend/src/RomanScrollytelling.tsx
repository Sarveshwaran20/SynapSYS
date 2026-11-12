import React, { useEffect, useRef, useState } from 'react';

interface RomanScrollytellingProps {
  onEnterLiveDeck: () => void;
  isDarkMode: boolean;
  totalMachines: number;
  plantOee: number;
  totalOutput: number;
  activeAlarmsCount: number;
}

export const RomanScrollytelling: React.FC<RomanScrollytellingProps> = ({
  onEnterLiveDeck,
  isDarkMode,
  totalMachines,
  plantOee,
  totalOutput,
  activeAlarmsCount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeStage, setActiveStage] = useState<number>(0);

  // Monitor scroll within the 320vh container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight - window.innerHeight;
      if (containerHeight <= 0) return;

      const progress = Math.min(1, Math.max(0, -rect.top / containerHeight));
      setScrollProgress(progress);

      if (progress < 0.22) {
        setActiveStage(0);
      } else if (progress < 0.48) {
        setActiveStage(1);
      } else if (progress < 0.74) {
        setActiveStage(2);
      } else {
        setActiveStage(3);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 60FPS Neoclassical 3D Wireframe Column & Telemetry Ring Particle Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Neoclassical Fluted Column Pillars & Telemetry Torus Ring math
    const rings = 12;
    const pointsPerRing = 24;
    const columnHeight = 420;
    const columnRadius = Math.min(width, height) * 0.24;

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Base rotation governed by both time and scroll position
      const scrollRotation = scrollProgress * Math.PI * 4;
      const rotY = time * 0.4 + scrollRotation;
      const rotX = 0.25 + Math.sin(time * 0.5 + scrollProgress * Math.PI) * 0.15;

      const goldColor = isDarkMode ? '212, 175, 55' : '179, 130, 52';
      const blueColor = isDarkMode ? '14, 165, 233' : '2, 132, 199';

      // 1. Draw glowing radial aura behind the architecture
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        20,
        centerX,
        centerY,
        Math.max(width, height) * 0.55
      );
      if (isDarkMode) {
        gradient.addColorStop(0, `rgba(${goldColor}, 0.18)`);
        gradient.addColorStop(0.35, `rgba(${blueColor}, 0.08)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        gradient.addColorStop(0, `rgba(${goldColor}, 0.22)`);
        gradient.addColorStop(0.4, 'rgba(238, 232, 219, 0.4)');
        gradient.addColorStop(1, 'rgba(245, 242, 234, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Project and draw 3D Corinthian fluted column cylinder
      const projectedRings: Array<Array<{ x: number; y: number; z: number; alpha: number }>> = [];

      for (let r = 0; r < rings; r++) {
        const ringY = ((r / (rings - 1)) - 0.5) * columnHeight;
        const ringPoints: Array<{ x: number; y: number; z: number; alpha: number }> = [];

        // Flare top (capital) and bottom (pedestal) like a classical Greek column
        const flare = r === 0 || r === rings - 1 ? 1.35 : r === 1 || r === rings - 2 ? 1.15 : 1.0;
        const radius = columnRadius * flare * (1 + Math.sin(r * 0.4 + scrollProgress * 5) * 0.06);

        for (let p = 0; p < pointsPerRing; p++) {
          const theta = (p / pointsPerRing) * Math.PI * 2;
          const x0 = Math.cos(theta) * radius;
          const z0 = Math.sin(theta) * radius;
          const y0 = ringY;

          // Rotate around Y
          const cosY = Math.cos(rotY);
          const sinY = Math.sin(rotY);
          const x1 = x0 * cosY + z0 * sinY;
          const z1 = -x0 * sinY + z0 * cosY;

          // Rotate around X
          const cosX = Math.cos(rotX);
          const sinX = Math.sin(rotX);
          const y2 = y0 * cosX - z1 * sinX;
          const z2 = y0 * sinX + z1 * cosX;

          // Perspective projection
          const fov = 800;
          const distance = 900;
          const scale = fov / (distance + z2);

          const px = centerX + x1 * scale;
          const py = centerY + y2 * scale;
          const alpha = Math.max(0.08, Math.min(1, (z2 + radius) / (2 * radius)));

          ringPoints.push({ x: px, y: py, z: z2, alpha });
        }
        projectedRings.push(ringPoints);
      }

      // Draw horizontal concentric ring segments
      for (let r = 0; r < rings; r++) {
        const pts = projectedRings[r];
        ctx.beginPath();
        for (let p = 0; p < pointsPerRing; p++) {
          const pt = pts[p];
          if (p === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${goldColor}, ${0.12 + (r % 2 === 0 ? 0.15 : 0.05)})`;
        ctx.lineWidth = r === 0 || r === rings - 1 ? 2 : 1;
        ctx.stroke();
      }

      // Draw vertical fluting lines connecting the rings
      for (let p = 0; p < pointsPerRing; p++) {
        ctx.beginPath();
        for (let r = 0; r < rings; r++) {
          const pt = projectedRings[r][p];
          if (r === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const isAccent = p % 3 === 0;
        ctx.strokeStyle = isAccent
          ? `rgba(${goldColor}, 0.45)`
          : `rgba(${isDarkMode ? '255, 255, 255' : '80, 70, 60'}, 0.1)`;
        ctx.lineWidth = isAccent ? 1.5 : 0.8;
        ctx.stroke();
      }

      // 3. Floating Olympian Telemetry Particle Nodes along orbit
      const orbitNodes = 16;
      const orbitRadius = columnRadius * 1.55;
      for (let n = 0; n < orbitNodes; n++) {
        const angle = (n / orbitNodes) * Math.PI * 2 + time * 0.7 - scrollProgress * 3;
        const ox = Math.cos(angle) * orbitRadius;
        const oz = Math.sin(angle) * orbitRadius;
        const oy = Math.sin(angle * 2 + time) * 60;

        const cosY = Math.cos(rotY * 0.8);
        const sinY = Math.sin(rotY * 0.8);
        const rx = ox * cosY + oz * sinY;
        const rz = -ox * sinY + oz * cosY;

        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const ry = oy * cosX - rz * sinX;
        const rzFinal = oy * sinX + rz * cosX;

        const fov = 800;
        const scale = fov / (900 + rzFinal);
        const px = centerX + rx * scale;
        const py = centerY + ry * scale;

        // Draw glittering telemetry node
        ctx.beginPath();
        ctx.arc(px, py, 3.5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${goldColor}, 0.9)`;
        ctx.shadowColor = `rgba(${goldColor}, 0.8)`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connecting telemetry line to core
        if (n % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(centerX, centerY);
          ctx.strokeStyle = `rgba(${goldColor}, 0.12)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDarkMode, scrollProgress]);

  return (
    <section ref={containerRef} className="relative w-full h-[320vh]">
      {/* Sticky Fullscreen Scrollytelling Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Interactive Neoclassical 3D Architecture Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none brightness-105 contrast-115"
        />

        {/* Subtle Vignette & Darkening Gradients */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isDarkMode
              ? 'bg-[radial-gradient(circle_at_center,transparent_30%,#070a12_95%)]'
              : 'bg-[radial-gradient(circle_at_center,transparent_30%,#f5f2ea_95%)]'
          }`}
        />

        {/* Right Scrollytelling Progress Rail */}
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col items-center gap-3 font-cinzel">
          {[
            { num: 'I', label: 'Overview' },
            { num: 'II', label: 'Ingestion' },
            { num: 'III', label: 'Analytics' },
            { num: 'IV', label: 'Command' },
          ].map((step, idx) => {
            const isActive = activeStage === idx;
            return (
              <button
                key={step.num}
                onClick={() => {
                  if (containerRef.current) {
                    const targetScroll = (idx / 3.2) * (containerRef.current.offsetHeight - window.innerHeight);
                    window.scrollTo({ top: containerRef.current.offsetTop + targetScroll, behavior: 'smooth' });
                  }
                }}
                className="group flex items-center gap-2 cursor-pointer focus:outline-none"
                title={`Jump to Section ${step.num}`}
              >
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase transition-opacity ${
                    isActive ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover:opacity-100 text-g-textMuted'
                  }`}
                >
                  {step.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'border-amber-500 bg-amber-500/20 text-amber-500 scale-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'border-g-borderSubtle bg-g-surface text-g-textMuted group-hover:border-amber-500/50'
                  }`}
                >
                  {step.num}
                </div>
              </button>
            );
          })}

          {/* Quick Jump to Live Deck */}
          <button
            onClick={onEnterLiveDeck}
            className="mt-4 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/40 text-[10px] font-bold tracking-wider uppercase transition-all shadow-xs"
            title="Scroll directly to the live manufacturing dashboard"
          >
            Live Deck ↓
          </button>
        </div>

        {/* CHAPTER 1: Monumental Hero Intro (0% – 25% Scroll) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center px-4 transition-all duration-700 pointer-events-none ${
            activeStage === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12'
          }`}
        >
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Roman Laurel Wreath Insignia */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-0.5 shadow-xl mb-4 sm:mb-6 animate-pulse">
              <div className="w-full h-full bg-[#070a12] flex items-center justify-center rounded-[14px]">
                <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 2L4 5.5v6c0 5.5 3.5 10.5 8 11.5 4.5-1 8-6 8-11.5v-6l-8-3.5z" fill="currentColor" fillOpacity="0.2" />
                  <path d="M12 6.5v11M8 10l4-3.5 4 3.5M8 14.5l4 3.5 4-3.5" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            {/* Monumental Inscriptional Typography (Like The Obsidian in Brown Guy AI's video) */}
            <h1 className="font-cinzel font-black tracking-[0.18em] leading-none select-none text-[3.2rem] sm:text-[5.5rem] md:text-[7.5rem] lg:text-[9.5rem] drop-shadow-[0_15px_40px_rgba(212,175,55,0.3)]">
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700">
                SYNAPSYS
              </span>
            </h1>

            <p className="mt-3 sm:mt-5 text-sm sm:text-base md:text-lg font-cinzel font-semibold tracking-[0.25em] uppercase text-amber-500 dark:text-amber-400 max-w-2xl">
              Industrial Intelligence // Built At Monumental Scale
            </p>

            <p className="mt-2 text-xs sm:text-sm text-g-textSecondary max-w-xl font-sans">
              Precision supervisory manufacturing architecture. Continuous telemetry ingestion, ISO-22400 analytics, and zero-downtime control.
            </p>

            {/* Scroll Indicator Prompt */}
            <div className="mt-8 sm:mt-12 flex flex-col items-center gap-2 pointer-events-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={onEnterLiveDeck}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-black font-cinzel font-black text-xs tracking-[0.16em] uppercase shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  Enter SCADA Console ↓
                </button>
              </div>
              <span className="text-[11px] font-mono text-g-textMuted tracking-widest uppercase animate-bounce mt-3">
                ↓ Scroll to explore architecture
              </span>
            </div>
          </div>
        </div>

        {/* CHAPTER 2: High-Frequency Telemetry Ingestion (25% – 50% Scroll) */}
        <div
          className={`absolute inset-0 flex items-center justify-center sm:justify-start px-4 sm:px-12 lg:px-24 transition-all duration-700 pointer-events-none ${
            activeStage === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
          }`}
        >
          <div className="w-full max-w-lg monumental-card keystone-corner p-6 sm:p-8 backdrop-blur-xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between text-xs font-cinzel font-bold text-amber-500 mb-2">
              <span>Section I. Architecture</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                0.2ms Edge Latency
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-g-text tracking-wide mb-3">
              High-Frequency Telemetry Ingestion
            </h2>

            <p className="text-xs sm:text-sm text-g-textSecondary leading-relaxed font-sans mb-5">
              Direct fieldbus connectivity capturing spindle thermal curves, acoustic vibrations, and cycle variances across CNC milling, injection molding, and robotic arc cells.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle">
                <span className="block text-[10px] text-g-textMuted uppercase font-cinzel">Throughput</span>
                <span className="text-base font-bold text-amber-500 tabular-nums">500,000+</span>
                <span className="text-[10px] text-g-textSecondary block">points / second</span>
              </div>
              <div className="p-3 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle">
                <span className="block text-[10px] text-g-textMuted uppercase font-cinzel">Protocols</span>
                <span className="text-base font-bold text-g-blue">OPC-UA</span>
                <span className="text-[10px] text-g-textSecondary block">MQTT Sparkplug B</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHAPTER 3: ISO-22400 Golden Ratio Analytics (50% – 75% Scroll) */}
        <div
          className={`absolute inset-0 flex items-center justify-center sm:justify-end px-4 sm:px-12 lg:px-24 transition-all duration-700 pointer-events-none ${
            activeStage === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
          }`}
        >
          <div className="w-full max-w-lg monumental-card keystone-corner p-6 sm:p-8 backdrop-blur-xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between text-xs font-cinzel font-bold text-amber-500 mb-2">
              <span>Section II. Analytics</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                World-Class Baseline
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-g-text tracking-wide mb-3">
              ISO-22400 Plant Metrics
            </h2>

            <p className="text-xs sm:text-sm text-g-textSecondary leading-relaxed font-sans mb-5">
              Three-pillar mathematical OEE decomposition: Availability, Performance, and Quality tracked in real-time with automated bottleneck triage and financial downtime attribution.
            </p>

            <div className="grid grid-cols-3 gap-2.5 text-center font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle">
                <span className="text-[10px] text-g-textMuted uppercase font-cinzel block">Plant OEE</span>
                <span className="text-lg font-bold text-amber-500">{plantOee.toFixed(1)}%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle">
                <span className="text-[10px] text-g-textMuted uppercase font-cinzel block">Output</span>
                <span className="text-lg font-bold text-g-text">{totalOutput}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle">
                <span className="text-[10px] text-g-textMuted uppercase font-cinzel block">Alarms</span>
                <span className="text-lg font-bold text-emerald-500">{activeAlarmsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHAPTER 4: Supervisory Workspace Transition (75% – 100% Scroll) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center px-4 transition-all duration-700 pointer-events-none ${
            activeStage === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="w-full max-w-xl monumental-card keystone-corner p-7 sm:p-10 backdrop-blur-2xl shadow-2xl pointer-events-auto">
            <span className="text-xs font-cinzel font-bold text-amber-500 uppercase tracking-widest mb-1 block">
              Section III. Plant Operations
            </span>

            <h2 className="text-2xl sm:text-3xl font-bold font-cinzel text-g-text tracking-wide mb-3">
              Open Supervisory Console
            </h2>

            <p className="text-xs sm:text-sm text-g-textSecondary leading-relaxed font-sans mb-6">
              Full multi-tenant supervisory console with {totalMachines} active industrial assets, spatial 2D digital twin, ISA-18.2 dispatch alarms, and production shift handover reports.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onEnterLiveDeck}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-black font-cinzel font-black text-xs tracking-[0.18em] uppercase shadow-xl shadow-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch Live SCADA Console</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
