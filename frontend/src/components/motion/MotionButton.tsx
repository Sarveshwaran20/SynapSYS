import React, { useState } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { ease, useIsTouchDevice } from '../../lib/motion';

export interface MotionButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  primary?: boolean;
  loading?: boolean;
}

export const MotionButton: React.FC<MotionButtonProps> = React.memo(
  ({
    children,
    primary = false,
    loading = false,
    disabled,
    className = '',
    style,
    onMouseEnter,
    onMouseLeave,
    ...rest
  }) => {
    const shouldReduce = useReducedMotion();
    const isTouch = useIsTouchDevice();
    const [isHovered, setIsHovered] = useState(false);

    const isDisabled = Boolean(disabled || loading);
    const canHover = !isDisabled && !shouldReduce && !isTouch;

    return (
      <motion.button
        {...rest}
        disabled={isDisabled}
        whileTap={isDisabled || shouldReduce ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.1, ease }}
        onMouseEnter={(e) => {
          if (canHover) setIsHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          onMouseLeave?.(e);
        }}
        style={{
          filter: canHover && isHovered ? 'brightness(1.06)' : undefined,
          willChange: isHovered ? 'transform' : 'auto',
          ...style,
        }}
        className={`relative ${className}`}
      >
        {primary && !shouldReduce && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              boxShadow:
                '0 0 24px color-mix(in srgb, var(--g-blue) 14%, transparent)',
              opacity: canHover && isHovered ? 1 : 0,
              transition: 'opacity 200ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        )}
        {loading && (
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5 animate-spin shrink-0 mr-1.5 inline"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeOpacity="0.25"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

MotionButton.displayName = 'MotionButton';

