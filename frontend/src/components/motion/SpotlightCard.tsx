import React, { useCallback, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { dur, ease, hoverLift, useIsTouchDevice } from '../../lib/motion';

export interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  notch?: boolean;
  attention?: boolean;
  surface?: boolean;
  onClick?: () => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = React.memo(
  ({
    children,
    className = '',
    notch = true,
    attention = false,
    surface = true,
    onClick,
  }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const shouldReduce = useReducedMotion();
    const isTouch = useIsTouchDevice();
    const [isHovered, setIsHovered] = useState(false);

    const interactiveEnabled = !shouldReduce && !isTouch;

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!interactiveEnabled || e.pointerType === 'touch' || !cardRef.current) {
          return;
        }
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--mx', `${x}px`);
        cardRef.current.style.setProperty('--my', `${y}px`);
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
      },
      [interactiveEnabled]
    );

    const handlePointerEnter = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!interactiveEnabled || e.pointerType === 'touch') return;
        setIsHovered(true);
      },
      [interactiveEnabled]
    );

    const handlePointerLeave = useCallback(() => {
      setIsHovered(false);
    }, []);

    const surfaceClasses = surface
      ? `midnight-card ${notch ? 'stone-notch' : ''} ${attention ? 'card-attention' : ''}`
      : 'relative';

    return (
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        whileHover={interactiveEnabled ? hoverLift : undefined}
        style={{
          willChange: isHovered && interactiveEnabled ? 'transform' : 'auto',
        }}
        className={`${surfaceClasses} ${className}`}
      >
        {interactiveEnabled && (
          <>
            {/* Soft cursor-tracking radial spotlight (10% accent opacity) */}
            <motion.div
              aria-hidden="true"
              initial={false}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: dur.fast, ease }}
              className="pointer-events-none absolute inset-0 rounded-[inherit] z-0"
              style={{
                background:
                  'radial-gradient(380px circle at var(--mx, -999px) var(--my, -999px), color-mix(in srgb, var(--g-blue) 10%, transparent), transparent 65%)',
              }}
            />
            {/* Border accent highlight (40% accent opacity on hover, zero glow) */}
            <motion.div
              aria-hidden="true"
              initial={false}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: dur.fast, ease }}
              className="pointer-events-none absolute -inset-px rounded-[inherit] z-[1]"
              style={{
                border: '1px solid color-mix(in srgb, var(--g-blue) 40%, transparent)',
              }}
            />
          </>
        )}
        {children}
      </motion.div>
    );
  }
);

SpotlightCard.displayName = 'SpotlightCard';
