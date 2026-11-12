import React, { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { ease } from '../../lib/motion';

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

function formatNum(n: number, decimals: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = React.memo(
  ({ value, decimals = 1, prefix = '', suffix = '', className = '' }) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const shouldReduce = useReducedMotion();
    const wrapRef = useRef<HTMLSpanElement>(null);
    const valueRef = useRef<HTMLSpanElement>(null);
    const isInView = useInView(wrapRef, { once: true });

    const currentValRef = useRef<number>(shouldReduce ? safeValue : 0);
    const hasCompletedInitialRef = useRef<boolean>(Boolean(shouldReduce));
    const lastAnimatedTargetRef = useRef<number | null>(
      shouldReduce ? safeValue : null
    );

    useEffect(() => {
      if (shouldReduce) {
        currentValRef.current = safeValue;
        hasCompletedInitialRef.current = true;
        lastAnimatedTargetRef.current = safeValue;
        if (valueRef.current) {
          valueRef.current.textContent = formatNum(safeValue, decimals);
        }
        return;
      }

      if (!isInView) return;

      const from = currentValRef.current;
      const to = safeValue;

      if (from === to && lastAnimatedTargetRef.current === to) {
        if (valueRef.current) {
          valueRef.current.textContent = formatNum(to, decimals);
        }
        return;
      }

      const isInitialRun = !hasCompletedInitialRef.current && from === 0;
      lastAnimatedTargetRef.current = to;

      const controls = animate(from, to, {
        duration: isInitialRun ? 0.9 : 0.4,
        ease: isInitialRun ? 'easeOut' : ease,
        onUpdate: (latest) => {
          currentValRef.current = latest;
          if (valueRef.current) {
            valueRef.current.textContent = formatNum(latest, decimals);
          }
        },
        onComplete: () => {
          currentValRef.current = to;
          hasCompletedInitialRef.current = true;
          if (valueRef.current) {
            valueRef.current.textContent = formatNum(to, decimals);
          }
        },
      });

      return () => {
        controls.stop();
      };
    }, [safeValue, decimals, isInView, shouldReduce]);

    const initialText = formatNum(shouldReduce ? safeValue : 0, decimals);

    return (
      <span
        ref={wrapRef}
        style={{ fontVariantNumeric: 'tabular-nums' }}
        className={`tabular-nums tracking-tight ${className}`}
      >
        {prefix}
        <span ref={valueRef}>{initialText}</span>
        {suffix}
      </span>
    );
  }
);

AnimatedNumber.displayName = 'AnimatedNumber';

