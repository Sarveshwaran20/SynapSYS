import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ease, viewportOnce } from '../../lib/motion';

export interface MotionSparklinePathProps {
  d: string;
  stroke: string;
  strokeWidth?: number;
}

export const MotionSparklinePath: React.FC<MotionSparklinePathProps> =
  React.memo(({ d, stroke, strokeWidth = 1.5 }) => {
    const shouldReduce = useReducedMotion();
    const [drawing, setDrawing] = useState(!shouldReduce);

    if (shouldReduce) {
      return (
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    return (
      <motion.path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.8, ease }}
        onAnimationComplete={() => setDrawing(false)}
        style={{ willChange: drawing ? 'stroke-dashoffset' : 'auto' }}
      />
    );
  });

MotionSparklinePath.displayName = 'MotionSparklinePath';

