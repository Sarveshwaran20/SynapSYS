import { useEffect, useRef, useState, type RefObject } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

export const ease = [0.22, 1, 0.36, 1] as const;

export const dur = {
  fast: 0.18,
  base: 0.35,
  slow: 0.6,
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export const fadeDown = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease } },
};

export const wordRise = {
  hidden: { opacity: 0, y: '0.42em' },
  show: { opacity: 1, y: '0em', transition: { duration: 0.42, ease } },
};

export const textSlide = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease } },
};

export const gridCell = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: 8, scale: 0.996 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease },
  },
};

export const stagger = (s = 0.06) => ({
  hidden: {},
  show: { transition: { staggerChildren: s } },
});

export const hoverLift = {
  y: -2,
  transition: { duration: dur.fast, ease },
};

export const tabContent = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.fast, ease } },
  exit: { opacity: 0, y: -10, transition: { duration: dur.fast, ease } },
};

export const popoverPanel = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.15, ease } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease } },
};

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15, ease } },
  exit: { opacity: 0, transition: { duration: 0.15, ease } },
};

export const modalPanel = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.15, ease } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease } },
};

export const drawerSlide = (side: 'left' | 'right' | 'top' = 'right') => {
  const offset =
    side === 'left'
      ? { x: '-100%', y: 0 }
      : side === 'right'
      ? { x: '100%', y: 0 }
      : { x: 0, y: -12 };

  return {
    initial: { ...offset, opacity: side === 'top' ? 0 : 1 },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease },
    },
    exit: {
      ...offset,
      opacity: side === 'top' ? 0 : 1,
      transition: { duration: 0.24, ease },
    },
  };
};

export const viewportOnce = {
  once: true,
  amount: 'some' as const,
};

// Shared document visibility tracker (pauses infinite animations when tab is hidden)
let visibilitySubscribers = new Set<(visible: boolean) => void>();
let visibilityListenerAttached = false;

function syncRootVisibilityAttribute(visible: boolean) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.tabHidden = visible ? 'false' : 'true';
  }
}

export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState<boolean>(() =>
    typeof document === 'undefined' ? true : !document.hidden
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    syncRootVisibilityAttribute(!document.hidden);

    const onVisibilityChange = () => {
      const isVis = !document.hidden;
      syncRootVisibilityAttribute(isVis);
      visibilitySubscribers.forEach((cb) => cb(isVis));
    };

    visibilitySubscribers.add(setVisible);
    if (!visibilityListenerAttached) {
      document.addEventListener('visibilitychange', onVisibilityChange);
      visibilityListenerAttached = true;
    }

    return () => {
      visibilitySubscribers.delete(setVisible);
      if (visibilitySubscribers.size === 0 && visibilityListenerAttached) {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        visibilityListenerAttached = false;
      }
    };
  }, []);

  return visible;
}

export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setIsTouch(!mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isTouch;
}

// Global concurrency cap (max 6 simultaneous infinite animations on screen)
const MAX_CONCURRENT_LOOPS = 6;
const activeLoops: symbol[] = [];
const loopChangeListeners = new Set<() => void>();

function notifyLoopListeners() {
  loopChangeListeners.forEach((cb) => cb());
}

/**
 * Coordinates infinite animations so:
 * 1) prefers-reduced-motion disables them
 * 2) hidden browser tabs pause them
 * 3) off-screen elements pause them
 * 4) at most 6 infinite animations run simultaneously on screen
 */
export function useLoopSlot(
  ref: RefObject<Element | null>,
  desired = true
): boolean {
  const shouldReduce = useReducedMotion();
  const docVisible = useDocumentVisible();
  const inView = useInView(ref, { once: false });
  const idRef = useRef<symbol>(Symbol('loop'));
  const [hasSlot, setHasSlot] = useState<boolean>(false);

  const eligible = Boolean(desired && !shouldReduce && docVisible && inView);

  useEffect(() => {
    const id = idRef.current;

    const evaluate = () => {
      const idx = activeLoops.indexOf(id);
      if (!eligible) {
        if (idx !== -1) {
          activeLoops.splice(idx, 1);
          setHasSlot(false);
          notifyLoopListeners();
        } else {
          setHasSlot(false);
        }
        return;
      }

      if (idx !== -1) {
        setHasSlot(true);
        return;
      }

      if (activeLoops.length < MAX_CONCURRENT_LOOPS) {
        activeLoops.push(id);
        setHasSlot(true);
      } else {
        setHasSlot(false);
      }
    };

    loopChangeListeners.add(evaluate);
    evaluate();

    return () => {
      loopChangeListeners.delete(evaluate);
      const idx = activeLoops.indexOf(id);
      if (idx !== -1) {
        activeLoops.splice(idx, 1);
        notifyLoopListeners();
      }
    };
  }, [eligible]);

  return eligible && hasSlot;
}

