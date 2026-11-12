import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ease } from '../../lib/motion';
import { AnimatedNumber } from '../motion';

export interface OeeRingProps {
  /** OEE percentage between 0 and 100 */
  value: number;
  size?: number;
  label?: string;
}

export const OeeRing: React.FC<OeeRingProps> = React.memo(
  ({ value, size = 96, label = 'OEE' }) => {
    const safeValue = Number.isFinite(value)
      ? Math.max(0, Math.min(100, value))
      : 0;
    const ratio = safeValue / 100;

    const ringRef = useRef<SVGSVGElement>(null);
    const isInView = useInView(ringRef, { once: true, amount: 'some' });
    const shouldReduce = useReducedMotion();
    const [initialDrawn, setInitialDrawn] = useState(Boolean(shouldReduce));

    useEffect(() => {
      if (shouldReduce) {
        setInitialDrawn(true);
      }
    }, [shouldReduce]);

    const strokeColor =
      safeValue >= 85
        ? 'var(--g-green)'
        : safeValue >= 60
        ? 'var(--g-yellow)'
        : 'var(--g-red)';

    const strokeWidth = 6.5;
    const radius = (size - strokeWidth * 2) / 2;
    const cx = size / 2;
    const cy = size / 2;

    return (
      <div
        className="relative inline-flex items-center justify-center select-none"
        style={{ width: size, height: size }}
        aria-label={`${label} ${safeValue.toFixed(1)} percent`}
      >
        <svg
          ref={ringRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--g-border)"
            strokeWidth={strokeWidth}
          />
          {shouldReduce ? (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${ratio} 1`}
            />
          ) : (
            <motion.circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: isInView ? ratio : 0 }}
              transition={{
                duration: initialDrawn ? 0.5 : 0.9,
                ease,
              }}
              onAnimationComplete={() => {
                if (isInView && !initialDrawn) {
                  setInitialDrawn(true);
                }
              }}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatedNumber
            value={safeValue}
            decimals={1}
            suffix="%"
            className="font-cinzel text-[16px] font-bold text-g-text leading-none"
          />
          <span className="text-[12px] font-sans font-medium text-g-textMuted mt-0.5 leading-none">
            {label}
          </span>
        </div>
      </div>
    );
  }
);

OeeRing.displayName = 'OeeRing';

