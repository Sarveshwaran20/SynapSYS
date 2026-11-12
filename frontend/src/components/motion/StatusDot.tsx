import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ease, useLoopSlot } from '../../lib/motion';

export type StatusDotVariant =
  | 'running'
  | 'live'
  | 'alarm'
  | 'standby'
  | 'down'
  | 'idle';

export interface StatusDotProps {
  status: StatusDotVariant;
  label?: string;
  className?: string;
  dotClassName?: string;
  size?: 'sm' | 'md';
}

const DOT_TOKEN_MAP: Record<
  StatusDotVariant,
  { core: string; ring: string; glow: string | undefined; looping: boolean }
> = {
  running: {
    core: 'var(--g-green)',
    ring: 'color-mix(in srgb, var(--g-green) 15%, transparent)',
    glow: '0 0 6px color-mix(in srgb, var(--g-green) 18%, transparent)',
    looping: true,
  },
  live: {
    core: 'var(--g-blue)',
    ring: 'color-mix(in srgb, var(--g-blue) 15%, transparent)',
    glow: '0 0 8px color-mix(in srgb, var(--g-blue) 18%, transparent)',
    looping: true,
  },
  alarm: {
    core: 'var(--g-red)',
    ring: 'color-mix(in srgb, var(--g-red) 18%, transparent)',
    glow: '0 0 8px color-mix(in srgb, var(--g-red) 18%, transparent)',
    looping: true,
  },
  standby: {
    core: 'var(--g-yellow)',
    ring: 'transparent',
    glow: undefined,
    looping: false,
  },
  idle: {
    core: 'var(--g-yellow)',
    ring: 'transparent',
    glow: undefined,
    looping: false,
  },
  down: {
    core: 'var(--g-red)',
    ring: 'transparent',
    glow: undefined,
    looping: false,
  },
};

export const StatusDot: React.FC<StatusDotProps> = React.memo(
  ({ status, label, className = '', dotClassName = '', size = 'sm' }) => {
    const dotRef = useRef<HTMLSpanElement>(null);
    const tokens = DOT_TOKEN_MAP[status] || DOT_TOKEN_MAP.standby;
    const shouldPulse = useLoopSlot(dotRef, tokens.looping);

    const sizeClass = size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2';

    return (
      <span
        ref={dotRef}
        className={`inline-flex items-center gap-2 shrink-0 ${className}`}
      >
        <span className={`relative flex items-center justify-center ${sizeClass}`}>
          {shouldPulse && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                backgroundColor: tokens.ring,
                willChange: 'transform, opacity',
              }}
              animate={{
                scale: [1, 2.2, 1],
                opacity: status === 'alarm' ? [0.85, 0, 0.85] : [0.7, 0, 0.7],
              }}
              transition={{
                duration: status === 'alarm' ? 1.8 : 2.4,
                repeat: Infinity,
                ease,
              }}
            />
          )}
          <span
            className={`relative inline-flex rounded-full ${sizeClass} ${dotClassName}`}
            style={{
              backgroundColor: tokens.core,
              boxShadow: tokens.glow,
            }}
          />
        </span>
        {label && <span className="text-xs font-medium text-g-textSecondary">{label}</span>}
      </span>
    );
  }
);

StatusDot.displayName = 'StatusDot';

