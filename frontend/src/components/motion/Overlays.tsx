import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  drawerSlide,
  dur,
  ease,
  modalBackdrop,
  modalPanel,
  popoverPanel,
} from '../../lib/motion';

export interface MotionModalProps {
  isOpen: boolean;
  onBackdropClick?: () => void;
  backdropClassName?: string;
  panelClassName?: string;
  children: React.ReactNode | (() => React.ReactNode);
}

export const MotionModal: React.FC<MotionModalProps> = React.memo(
  ({
    isOpen,
    onBackdropClick,
    backdropClassName = '',
    panelClassName = '',
    children,
  }) => {
    const shouldReduce = useReducedMotion();

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={shouldReduce ? undefined : modalBackdrop}
            initial={shouldReduce ? false : 'initial'}
            animate="animate"
            exit={shouldReduce ? undefined : 'exit'}
            onClick={onBackdropClick}
            className={backdropClassName}
          >
            <motion.div
              variants={shouldReduce ? undefined : modalPanel}
              initial={shouldReduce ? false : 'initial'}
              animate="animate"
              exit={shouldReduce ? undefined : 'exit'}
              onClick={(e) => e.stopPropagation()}
              style={{ willChange: shouldReduce ? 'auto' : 'transform, opacity' }}
              className={panelClassName}
            >
              {typeof children === 'function' ? children() : children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

MotionModal.displayName = 'MotionModal';

export interface MotionDrawerProps {
  isOpen: boolean;
  side?: 'left' | 'right' | 'top';
  onClose?: () => void;
  backdropClassName?: string;
  panelClassName?: string;
  asAside?: boolean;
  showBackdrop?: boolean;
  children: React.ReactNode;
}

export const MotionDrawer: React.FC<MotionDrawerProps> = React.memo(
  ({
    isOpen,
    side = 'right',
    onClose,
    backdropClassName = '',
    panelClassName = '',
    asAside = false,
    showBackdrop = true,
    children,
  }) => {
    const shouldReduce = useReducedMotion();
    const slideVariants = drawerSlide(side);
    const PanelTag = asAside ? motion.aside : motion.div;

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {showBackdrop && (
              <motion.div
                variants={shouldReduce ? undefined : modalBackdrop}
                initial={shouldReduce ? false : 'initial'}
                animate="animate"
                exit={shouldReduce ? undefined : 'exit'}
                onClick={onClose}
                className={backdropClassName}
              />
            )}
            <PanelTag
              variants={shouldReduce ? undefined : slideVariants}
              initial={shouldReduce ? false : 'initial'}
              animate="animate"
              exit={shouldReduce ? undefined : 'exit'}
              style={{
                willChange: shouldReduce ? 'auto' : 'transform, opacity',
              }}
              className={panelClassName}
            >
              {children}
            </PanelTag>
          </>
        )}
      </AnimatePresence>
    );
  }
);

MotionDrawer.displayName = 'MotionDrawer';

export interface MotionPopoverProps {
  isOpen: boolean;
  className?: string;
  transformOrigin?: string;
  children: React.ReactNode;
}

export const MotionPopover: React.FC<MotionPopoverProps> = React.memo(
  ({
    isOpen,
    className = '',
    transformOrigin = 'top right',
    children,
  }) => {
    const shouldReduce = useReducedMotion();

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={shouldReduce ? undefined : popoverPanel}
            initial={shouldReduce ? false : 'initial'}
            animate="animate"
            exit={shouldReduce ? undefined : 'exit'}
            style={{
              transformOrigin,
              willChange: shouldReduce ? 'auto' : 'transform, opacity',
            }}
            className={className}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

MotionPopover.displayName = 'MotionPopover';

export interface MotionToastProps {
  visible: boolean;
  toastKey?: string;
  durationMs?: number;
  className?: string;
  progressColorVar?: string;
  children: React.ReactNode;
}

export const MotionToast: React.FC<MotionToastProps> = React.memo(
  ({
    visible,
    toastKey = 'toast',
    durationMs = 8000,
    className = '',
    progressColorVar = 'var(--g-green)',
    children,
  }) => {
    const shouldReduce = useReducedMotion();

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            key={toastKey}
            initial={shouldReduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduce ? undefined : { opacity: 0, x: 24 }}
            transition={{ duration: dur.fast, ease }}
            style={{ willChange: shouldReduce ? 'auto' : 'transform, opacity' }}
            className={`relative overflow-hidden ${className}`}
          >
            {children}
            {!shouldReduce && durationMs > 0 && (
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{
                  duration: durationMs / 1000,
                  ease: 'linear',
                }}
                style={{
                  transformOrigin: 'left',
                  backgroundColor: progressColorVar,
                  opacity: 0.7,
                }}
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px]"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

MotionToast.displayName = 'MotionToast';
