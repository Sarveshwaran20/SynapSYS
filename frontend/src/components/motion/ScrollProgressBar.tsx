import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { dur, ease } from '../../lib/motion';

export interface ScrollProgressBarProps {
  showBackToTop?: boolean;
}

export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = React.memo(
  ({ showBackToTop = true }) => {
    const shouldReduce = useReducedMotion();
    const [progress, setProgress] = useState(0);
    const [visibleTopBtn, setVisibleTopBtn] = useState(false);

    useEffect(() => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
      }
      let rafId = 0;

      const updateProgress = () => {
        rafId = 0;
        const docEl = document.documentElement;
        const maxScroll = Math.max(
          1,
          (docEl?.scrollHeight || 0) - (window.innerHeight || 0)
        );
        const y = window.scrollY || 0;
        setProgress(Math.max(0, Math.min(1, y / maxScroll)));
        setVisibleTopBtn(y > 420);
      };

      const onScroll = () => {
        if (!rafId) {
          rafId = window.requestAnimationFrame(updateProgress);
        }
      };

      updateProgress();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', onScroll);
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }, []);

    return (
      <>
        <div
          className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-transparent"
          aria-hidden="true"
        >
          <div
            className="h-full origin-left transition-transform duration-75"
            style={{
              transform: `scaleX(${progress})`,
              background:
                'linear-gradient(90deg, var(--g-blue) 0%, var(--tyrian) 60%, var(--g-green) 100%)',
            }}
          />
        </div>

        {showBackToTop && visibleTopBtn && (
          <motion.button
            type="button"
            initial={shouldReduce ? false : { opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: dur.fast, ease }}
            whileHover={shouldReduce ? undefined : { y: -2, scale: 1.04 }}
            whileTap={shouldReduce ? undefined : { scale: 0.96 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="fixed bottom-6 right-5 z-40 px-3.5 py-2.5 rounded-full bg-g-surface/95 backdrop-blur-md border border-g-border shadow-lg text-g-text hover:border-g-blue/60 text-xs font-mono font-medium flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 text-g-blue"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 15.75l7.5-7.5 7.5 7.5"
              />
            </svg>
            <span className="hidden sm:inline">Top</span>
            <span className="text-[11px] text-g-textMuted tabular-nums">
              {Math.round(progress * 100)}%
            </span>
          </motion.button>
        )}
      </>
    );
  }
);

ScrollProgressBar.displayName = 'ScrollProgressBar';

