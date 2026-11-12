import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  ease,
  fadeDown,
  fadeUp,
  gridCell,
  pageTransition,
  stagger,
  textSlide,
  viewportOnce,
  wordRise,
} from '../../lib/motion';

type MotionTag =
  | 'div'
  | 'section'
  | 'header'
  | 'footer'
  | 'article'
  | 'aside'
  | 'nav'
  | 'span'
  | 'li'
  | 'main'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'p'
  | 'ul';

const MOTION_ELEMENTS = {
  div: motion.div,
  section: motion.section,
  header: motion.header,
  footer: motion.footer,
  article: motion.article,
  aside: motion.aside,
  nav: motion.nav,
  span: motion.span,
  li: motion.li,
  main: motion.main,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  ul: motion.ul,
} as const;

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  as?: MotionTag;
  className?: string;
  direction?: 'up' | 'down';
  immediate?: boolean;
}

export const Reveal: React.FC<RevealProps> = React.memo(
  ({
    children,
    delay = 0,
    as = 'div',
    className = '',
    direction = 'up',
    immediate = false,
  }) => {
    const shouldReduce = useReducedMotion();
    const [animating, setAnimating] = useState(!shouldReduce);
    const Component = MOTION_ELEMENTS[as] || motion.div;

    const variants = useMemo<Variants>(() => {
      const base = direction === 'down' ? fadeDown : fadeUp;
      if (!delay) return base;
      const showState = base.show as {
        opacity: number;
        y: number;
        transition: { duration: number; ease: typeof ease };
      };
      return {
        hidden: base.hidden,
        show: {
          ...showState,
          transition: {
            ...showState.transition,
            delay,
          },
        },
      };
    }, [delay, direction]);

    if (shouldReduce) {
      const Tag = as as keyof JSX.IntrinsicElements;
      return <Tag className={className}>{children}</Tag>;
    }

    return (
      <Component
        variants={variants}
        initial="hidden"
        animate={immediate ? 'show' : undefined}
        whileInView={immediate ? undefined : 'show'}
        viewport={immediate ? undefined : viewportOnce}
        onAnimationComplete={() => setAnimating(false)}
        style={{ willChange: animating ? 'transform, opacity' : 'auto' }}
        className={className}
      >
        {children}
      </Component>
    );
  }
);

Reveal.displayName = 'Reveal';

export interface RevealGroupProps {
  children: React.ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  as?: MotionTag;
  className?: string;
  immediate?: boolean;
}

export const RevealGroup: React.FC<RevealGroupProps> = React.memo(
  ({
    children,
    staggerDelay = 0.06,
    delayChildren = 0,
    as = 'div',
    className = '',
    immediate = false,
  }) => {
    const shouldReduce = useReducedMotion();
    const Component = MOTION_ELEMENTS[as] || motion.div;

    const variants = useMemo<Variants>(() => {
      const base = stagger(staggerDelay);
      return {
        hidden: {},
        show: {
          transition: {
            ...base.show.transition,
            delayChildren,
          },
        },
      };
    }, [staggerDelay, delayChildren]);

    if (shouldReduce) {
      const Tag = as as keyof JSX.IntrinsicElements;
      return <Tag className={className}>{children}</Tag>;
    }

    return (
      <Component
        variants={variants}
        initial="hidden"
        animate={immediate ? 'show' : undefined}
        whileInView={immediate ? undefined : 'show'}
        viewport={immediate ? undefined : viewportOnce}
        className={className}
      >
        {children}
      </Component>
    );
  }
);

RevealGroup.displayName = 'RevealGroup';

export interface RevealItemProps {
  children: React.ReactNode;
  as?: MotionTag;
  className?: string;
  variant?: 'fade' | 'grid';
}

export const RevealItem: React.FC<RevealItemProps> = React.memo(
  ({ children, as = 'div', className = '', variant = 'fade' }) => {
    const shouldReduce = useReducedMotion();
    const [animating, setAnimating] = useState(!shouldReduce);
    const Component = MOTION_ELEMENTS[as] || motion.div;

    if (shouldReduce) {
      const Tag = as as keyof JSX.IntrinsicElements;
      return <Tag className={className}>{children}</Tag>;
    }

    return (
      <Component
        variants={variant === 'grid' ? gridCell : fadeUp}
        onAnimationComplete={() => setAnimating(false)}
        style={{ willChange: animating ? 'transform, opacity' : 'auto' }}
        className={className}
      >
        {children}
      </Component>
    );
  }
);

RevealItem.displayName = 'RevealItem';

export interface RevealWordsProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'span' | 'p';
  className?: string;
  wordClassName?: string;
  staggerDelay?: number;
  delayChildren?: number;
  immediate?: boolean;
}

export const RevealWords: React.FC<RevealWordsProps> = React.memo(
  ({
    text,
    as = 'h1',
    className = '',
    wordClassName = '',
    staggerDelay = 0.04,
    delayChildren = 0,
    immediate = false,
  }) => {
    const shouldReduce = useReducedMotion();
    const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
    const Component = MOTION_ELEMENTS[as] || motion.div;

    const containerVariants = useMemo<Variants>(
      () => ({
        hidden: {},
        show: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }),
      [staggerDelay, delayChildren]
    );

    if (shouldReduce) {
      const Tag = as as keyof JSX.IntrinsicElements;
      return <Tag className={className}>{text}</Tag>;
    }

    return (
      <Component
        variants={containerVariants}
        initial="hidden"
        animate={immediate ? 'show' : undefined}
        whileInView={immediate ? undefined : 'show'}
        viewport={immediate ? undefined : viewportOnce}
        className={className}
      >
        {words.map((word, idx) => (
          <React.Fragment key={`${idx}-${word}`}>
            <span className="inline-block overflow-hidden align-bottom">
              <motion.span
                variants={wordRise}
                className={`inline-block ${wordClassName}`}
              >
                {word}
              </motion.span>
            </span>
            {idx < words.length - 1 ? ' ' : null}
          </React.Fragment>
        ))}
      </Component>
    );
  }
);

RevealWords.displayName = 'RevealWords';

export interface RevealTextProps {
  children: React.ReactNode;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'div';
  delay?: number;
  immediate?: boolean;
  className?: string;
}

export const RevealText: React.FC<RevealTextProps> = React.memo(
  ({
    children,
    as = 'p',
    delay = 0,
    immediate = false,
    className = '',
  }) => {
    const shouldReduce = useReducedMotion();
    const Component = MOTION_ELEMENTS[as] || motion.p;

    const variants = useMemo<Variants>(
      () => ({
        hidden: textSlide.hidden,
        show: {
          ...textSlide.show,
          transition: {
            ...textSlide.show.transition,
            delay,
          },
        },
      }),
      [delay]
    );

    if (shouldReduce) {
      const Tag = as as keyof JSX.IntrinsicElements;
      return <Tag className={className}>{children}</Tag>;
    }

    return (
      <Component
        variants={variants}
        initial="hidden"
        animate={immediate ? 'show' : undefined}
        whileInView={immediate ? undefined : 'show'}
        viewport={immediate ? undefined : viewportOnce}
        className={className}
      >
        {children}
      </Component>
    );
  }
);

RevealText.displayName = 'RevealText';

export interface PageTransitionProps {
  pageKey: string;
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = React.memo(
  ({ pageKey, children, className = '' }) => {
    const shouldReduce = useReducedMotion();
    if (shouldReduce) {
      return <div className={className}>{children}</div>;
    }

    return (
      <motion.div
        key={pageKey}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);

PageTransition.displayName = 'PageTransition';
