import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLoopSlot } from '../../lib/motion';
import { StatusDot } from '../motion';

export interface AgvTrackProps {
  agvName?: string;
  voltage?: string;
  speed?: string;
}

export const AgvTrack: React.FC<AgvTrackProps> = React.memo(
  ({ agvName = 'AGV-04 Fleet runner', voltage = '48V', speed = '0.8 m/s' }) => {
    const laneRef = useRef<HTMLDivElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);
    const [hoveredOrFocused, setHoveredOrFocused] = useState(false);
    const [maxOffset, setMaxOffset] = useState(110);

    const canAnimate = useLoopSlot(laneRef, !hoveredOrFocused);

    useEffect(() => {
      const updateBounds = () => {
        const laneWidth = laneRef.current?.clientWidth ?? 0;
        const pillWidth = pillRef.current?.offsetWidth ?? 260;
        const available = Math.max(0, (laneWidth - pillWidth - 24) / 2);
        setMaxOffset(Math.min(180, available));
      };

      updateBounds();
      if (typeof ResizeObserver === 'undefined') return;

      const observer = new ResizeObserver(updateBounds);
      if (laneRef.current) observer.observe(laneRef.current);
      if (pillRef.current) observer.observe(pillRef.current);
      return () => observer.disconnect();
    }, []);

    return (
      <div className="pt-6 mt-6 border-t border-g-borderSubtle">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          {/* Track Label Placed Outside the Moving Path */}
          <div className="flex-shrink-0">
            <span className="font-cinzel text-[12px] font-semibold uppercase tracking-[0.1em] text-g-textMuted">
              Autonomous track lane 02
            </span>
          </div>

          {/* Dedicated Track Lane Container */}
          <div
            ref={laneRef}
            className="relative flex-1 min-w-0 h-14 flex items-center justify-center"
            onMouseEnter={() => setHoveredOrFocused(true)}
            onMouseLeave={() => setHoveredOrFocused(false)}
          >
            {/* Two Thin Parallel Rails with Dashed Center Line */}
            <div
              className="w-full h-9 border-y border-g-border rounded-[4px] flex items-center px-3"
              aria-hidden="true"
            >
              <div className="w-full border-t border-dashed border-g-borderSubtle" />
            </div>

            {/* Gliding AGV Pill Card */}
            <motion.div
              ref={pillRef}
              tabIndex={0}
              role="group"
              aria-label={`${agvName}, ${voltage}, ${speed}, running`}
              onFocus={() => setHoveredOrFocused(true)}
              onBlur={() => setHoveredOrFocused(false)}
              className="group/agv absolute z-10 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-g-surfaceElevated border border-g-border text-[13px] whitespace-nowrap shadow-sm cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
              style={{ willChange: canAnimate ? 'transform' : 'auto' }}
              animate={
                canAnimate && maxOffset > 8
                  ? { x: [-maxOffset, maxOffset] }
                  : { x: 0 }
              }
              transition={
                canAnimate && maxOffset > 8
                  ? {
                      duration: 8,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    }
                  : { duration: 0.35 }
              }
            >
              <StatusDot status="running" size="sm" />
              <span className="font-medium text-g-text">{agvName}</span>
              <span
                className="text-g-border"
                aria-hidden="true"
              >
                ·
              </span>
              <span className="text-[12px] text-g-textSecondary tabular-nums">
                {voltage}
              </span>
              <span className="text-[12px] text-g-textSecondary tabular-nums">
                {speed}
              </span>

              <span
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover/agv:opacity-100 group-focus-visible/agv:opacity-100 transition-opacity duration-150 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 px-2.5 py-1 rounded-[4px] bg-g-surface border border-g-border text-[12px] font-medium text-g-text shadow-md"
              >
                Active route · Paused for inspection · {voltage} · {speed}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }
);

AgvTrack.displayName = 'AgvTrack';

