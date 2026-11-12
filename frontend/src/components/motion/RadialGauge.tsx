import React, { useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { dur, ease } from '../../lib/motion';

export interface RadialGaugeProps {
  /** Value between 0 and 100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  colorVar?: string;
  trackColorVar?: string;
  showLabel?: boolean;
  labelClassName?: string;
  className?: string;
}

export const RadialGauge: React.FC<RadialGaugeProps> = React.memo(
  ({
    value,
    size = 54,
    strokeWidth = 4.5,
    colorVar = 'var(--g-blue)',
    trackColorVar = 'var(--g-border)',
    showLabel = false,
    labelClassName = '',
    className = '',
  }) => {
    const pct = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const targetOffset = circumference * (1 - pct / 100);

    const ref = useRef<HTMLDivElement>(null);
    const shouldReduce = useReducedMotion();
    const isInView = useInView(ref, { once: true });
    const hasCompletedInitialRef = useRef<boolean>(Boolean(shouldReduce));

    useEffect(() => {
      if (shouldReduce) {
        hasCompletedInitialRef.current = true;
      }
    }, [shouldReduce]);

    const useInitial = !hasCompletedInitialRef.current;

    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 overflow-visible"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColorVar}
            strokeWidth={strokeWidth}
            strokeOpacity={0.55}
          />
          {shouldReduce ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colorVar}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={targetOffset}
            />
          ) : (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colorVar}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{
                strokeDashoffset: isInView ? targetOffset : circumference,
              }}
              transition={{
                duration: useInitial ? 0.85 : dur.base,
                ease,
              }}
              onAnimationComplete={() => {
                if (isInView) hasCompletedInitialRef.current = true;
              }}
            />
          )}
        </svg>
        {showLabel && (
          <span
            className={`absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold tabular-nums text-g-text ${labelClassName}`}
          >
            {Math.round(pct)}%
          </span>
        )}
      </div>
    );
  }
);

RadialGauge.displayName = 'RadialGauge';

