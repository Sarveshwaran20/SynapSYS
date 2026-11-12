import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { dur, ease } from '../../lib/motion';

export interface GrowBarProps {
  /** Progress percentage from 0 to 100 */
  value: number;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}

export const GrowBar: React.FC<GrowBarProps> = React.memo(
  ({ value, className = '', delay = 0, style }) => {
    const safePct = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    const targetScale = safePct / 100;

    const ref = useRef<HTMLDivElement>(null);
    const shouldReduce = useReducedMotion();
    const isInView = useInView(ref, { once: true });
    const hasCompletedInitialRef = useRef<boolean>(Boolean(shouldReduce));
    const [isAnimating, setIsAnimating] = useState<boolean>(!shouldReduce);

    useEffect(() => {
      if (shouldReduce) {
        hasCompletedInitialRef.current = true;
        setIsAnimating(false);
      }
    }, [shouldReduce]);

    const useInitialDuration = !hasCompletedInitialRef.current;

    if (shouldReduce) {
      return (
        <div
          ref={ref}
          className={`w-full ${className}`}
          style={{
            transform: `scaleX(${targetScale})`,
            transformOrigin: 'left',
            ...style,
          }}
        />
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isInView ? targetScale : 0 }}
        transition={{
          duration: useInitialDuration ? 0.7 : dur.base,
          delay: useInitialDuration ? delay : 0,
          ease,
        }}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={() => {
          if (isInView) {
            hasCompletedInitialRef.current = true;
          }
          setIsAnimating(false);
        }}
        style={{
          originX: 0,
          transformOrigin: 'left',
          willChange: isAnimating ? 'transform' : 'auto',
          ...style,
        }}
        className={`w-full ${className}`}
      />
    );
  }
);

GrowBar.displayName = 'GrowBar';

