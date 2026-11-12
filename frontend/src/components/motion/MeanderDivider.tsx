import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ease, viewportOnce } from '../../lib/motion';

export interface MeanderDividerProps {
  className?: string;
  opacity?: number;
}

const MEANDER_UNITS = 60;
const UNIT_WIDTH = 24;
const VIEWBOX_WIDTH = MEANDER_UNITS * UNIT_WIDTH;

function buildMeanderPath(): string {
  const segments: string[] = [];
  for (let i = 0; i < MEANDER_UNITS; i++) {
    const x = i * UNIT_WIDTH;
    segments.push(
      `M${x} 7h10V3H${x + 4}v2h4V4H${x + 6}M${x + 12} 7h10V3h-6v2h4V4h-2`
    );
  }
  return segments.join('');
}

export const MeanderDivider: React.FC<MeanderDividerProps> = React.memo(
  ({ className = '', opacity = 0.8 }) => {
    const shouldReduce = useReducedMotion();
    const [animating, setAnimating] = useState(!shouldReduce);
    const pathData = useMemo(() => buildMeanderPath(), []);

    return (
      <div
        className={`w-full h-2 overflow-hidden ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      >
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} 8`}
          preserveAspectRatio="xMinYMid slice"
          className="w-full h-2 block"
          fill="none"
        >
          <motion.path
            d={pathData}
            stroke="var(--g-border)"
            strokeWidth="1"
            strokeLinecap="square"
            initial={shouldReduce ? { pathLength: 1 } : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={viewportOnce}
            transition={{
              duration: shouldReduce ? 0 : 1.2,
              ease,
            }}
            onAnimationComplete={() => setAnimating(false)}
            style={{ willChange: animating ? 'stroke-dashoffset' : 'auto' }}
          />
        </svg>
      </div>
    );
  }
);

MeanderDivider.displayName = 'MeanderDivider';

