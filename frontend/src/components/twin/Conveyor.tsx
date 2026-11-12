import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLoopSlot } from '../../lib/motion';

export interface ConveyorProps {
  orientation?: 'horizontal' | 'vertical';
  active: boolean;
  rateLabel?: string;
  label?: string;
  staggerDelay?: number;
  className?: string;
}

export const Conveyor: React.FC<ConveyorProps> = React.memo(
  ({
    orientation = 'horizontal',
    active,
    rateLabel = '12 units/min',
    label = 'Conveyor link',
    staggerDelay = 0,
    className = '',
  }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const shouldAnimate = useLoopSlot(trackRef, active);

    const tooltipText = active ? `Transfer, active, ${rateLabel}` : 'Standby';
    const isHorizontal = orientation === 'horizontal';

    return (
      <div
        ref={trackRef}
        tabIndex={0}
        role="img"
        aria-label={`${label}: ${tooltipText}`}
        className={`group/conv relative inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-g-blue rounded-[4px] ${
          isHorizontal ? 'w-[48px] h-7' : 'w-7 h-[40px]'
        } ${className}`}
      >
        {/* 4px Rounded Track */}
        {isHorizontal ? (
          <div className="relative w-full h-1 rounded-full flex items-center justify-center">
            {active ? (
              <div
                className="w-full h-1 rounded-full"
                style={{ backgroundColor: 'var(--g-border)' }}
              />
            ) : (
              <div className="w-full border-t-2 border-dashed border-g-border opacity-75" />
            )}

            {/* Small directional chevrons */}
            <svg
              className="w-3.5 h-3.5 text-g-textMuted absolute pointer-events-none"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.5 4.5L10 8l-3.5 3.5"
              />
            </svg>

            {/* Travelling Dot for Active Transfer */}
            {active && shouldAnimate && (
              <motion.span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full absolute left-0"
                style={{
                  backgroundColor: 'var(--g-blue)',
                  boxShadow:
                    '0 0 7px color-mix(in srgb, var(--g-blue) 20%, transparent)',
                  willChange: 'transform, opacity',
                }}
                initial={{ x: 2, opacity: 0 }}
                animate={{ x: [2, 40], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: staggerDelay,
                }}
              />
            )}
          </div>
        ) : (
          <div className="relative h-full w-1 rounded-full flex flex-col items-center justify-center">
            {active ? (
              <div
                className="h-full w-1 rounded-full"
                style={{ backgroundColor: 'var(--g-border)' }}
              />
            ) : (
              <div className="h-full border-l-2 border-dashed border-g-border opacity-75" />
            )}

            <svg
              className="w-3.5 h-3.5 text-g-textMuted absolute pointer-events-none"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 6.5L8 10l3.5-3.5"
              />
            </svg>

            {active && shouldAnimate && (
              <motion.span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full absolute top-0"
                style={{
                  backgroundColor: 'var(--g-blue)',
                  boxShadow:
                    '0 0 7px color-mix(in srgb, var(--g-blue) 20%, transparent)',
                  willChange: 'transform, opacity',
                }}
                initial={{ y: 2, opacity: 0 }}
                animate={{ y: [2, 32], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: staggerDelay,
                }}
              />
            )}
          </div>
        )}

        {/* Accessible Hover / Focus Tooltip */}
        <span
          role="tooltip"
          className="pointer-events-none opacity-0 group-hover/conv:opacity-100 group-focus-visible/conv:opacity-100 transition-opacity duration-150 absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 px-2.5 py-1 rounded-[4px] bg-g-surfaceElevated border border-g-border text-[12px] font-medium text-g-text shadow-md"
        >
          {tooltipText}
        </span>
      </div>
    );
  }
);

Conveyor.displayName = 'Conveyor';

