import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLoopSlot } from '../../lib/motion';

export interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = React.memo(
  ({ className = '', children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const canPulse = useLoopSlot(ref, true);

    if (!canPulse) {
      return (
        <div ref={ref} className={`opacity-65 ${className}`}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        animate={{ opacity: [0.45, 0.85, 0.45] }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ willChange: 'opacity' }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

