import React from 'react';
import {
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'framer-motion';
import { dur, ease, tabContent } from '../../lib/motion';

export interface SlidingTabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SlidingTabsProps<T extends string = string> {
  items: SlidingTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  layoutId: string;
  variant?: 'underline' | 'pill';
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
}

const SLIDING_SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
};

export interface SlidingTabIndicatorProps {
  layoutId: string;
  variant?: 'underline' | 'pill';
  className?: string;
}

export const SlidingTabIndicator: React.FC<SlidingTabIndicatorProps> =
  React.memo(({ layoutId, variant = 'underline', className = '' }) => {
    const shouldReduce = useReducedMotion();
    const transition = shouldReduce ? { duration: 0 } : SLIDING_SPRING;

    if (variant === 'pill') {
      return (
        <motion.span
          layoutId={layoutId}
          transition={transition}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-[inherit] ${
            className || 'bg-g-surface shadow-xs'
          }`}
        />
      );
    }

    return (
      <motion.span
        layoutId={layoutId}
        transition={transition}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 right-0 -bottom-[1px] h-[2px] rounded-full ${className}`}
        style={{
          backgroundColor: 'var(--g-blue)',
          boxShadow:
            '0 0 18px color-mix(in srgb, var(--g-blue) 18%, transparent)',
        }}
      />
    );
  });

SlidingTabIndicator.displayName = 'SlidingTabIndicator';

export const SlidingTabGroup: React.FC<{
  id: string;
  children: React.ReactNode;
}> = React.memo(({ id, children }) => (
  <LayoutGroup id={id}>{children}</LayoutGroup>
));

SlidingTabGroup.displayName = 'SlidingTabGroup';

export function SlidingTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  layoutId,
  variant = 'underline',
  className = '',
  tabClassName = '',
  activeTabClassName = '',
  inactiveTabClassName = '',
}: SlidingTabsProps<T>) {
  return (
    <LayoutGroup id={layoutId}>
      <div className={className}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              className={`relative cursor-pointer ${tabClassName} ${
                isActive ? activeTabClassName : inactiveTabClassName
              }`}
            >
              {variant === 'pill' && isActive && (
                <SlidingTabIndicator layoutId={`${layoutId}-ind`} variant="pill" />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {item.label}
              </span>
              {variant === 'underline' && isActive && (
                <SlidingTabIndicator
                  layoutId={`${layoutId}-ind`}
                  variant="underline"
                />
              )}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export interface SlidingTabContentProps {
  activeKey: string;
  children: React.ReactNode;
  className?: string;
  minHeightClass?: string;
}

export const SlidingTabContent: React.FC<SlidingTabContentProps> = React.memo(
  ({ activeKey, children, className = '', minHeightClass = '' }) => {
    const shouldReduce = useReducedMotion();

    if (shouldReduce) {
      return (
        <div key={activeKey} className={`${minHeightClass} ${className}`}>
          {children}
        </div>
      );
    }

    return (
      <div className={minHeightClass}>
        <motion.div
          key={activeKey}
          initial={tabContent.initial}
          animate={tabContent.animate}
          transition={{ duration: dur.fast, ease }}
          style={{ willChange: 'transform, opacity' }}
          className={className}
        >
          {children}
        </motion.div>
      </div>
    );
  }
);

SlidingTabContent.displayName = 'SlidingTabContent';
