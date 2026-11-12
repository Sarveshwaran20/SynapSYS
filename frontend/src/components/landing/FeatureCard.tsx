import React from 'react';
import { SpotlightCard } from '../motion';

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent?: 'blue' | 'purple';
  active?: boolean;
  onSelect?: () => void;
  tag?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = React.memo(
  ({ title, description, icon, accent = 'blue', active = false, onSelect, tag }) => {
    const iconColor =
      accent === 'purple' ? 'var(--tyrian)' : 'var(--g-blue)';

    const cardContent = (
      <SpotlightCard
        surface={false}
        notch={false}
        className={`group lp-notch-card p-6 h-full flex flex-col justify-between transition-all duration-200 ${onSelect ? 'cursor-pointer' : ''
          } ${active
            ? 'ring-2 ring-g-blue/60 border-g-blue/70 shadow-md'
            : ''
          }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-4">
            <div
              className="w-11 h-11 rounded-[6px] bg-g-surfaceElevated border border-g-border flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105"
              style={{ color: iconColor }}
              aria-hidden="true"
            >
              {icon}
            </div>
            {tag && (
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${active
                    ? 'bg-g-blue/15 text-g-blue border-g-blue/35'
                    : 'bg-g-surfaceElevated text-g-textMuted border-g-border'
                  }`}
              >
                {tag}
              </span>
            )}
          </div>
          <h3 className="text-[17px] font-cinzel font-semibold text-g-text leading-snug">
            {title}
          </h3>
          <p className="text-[15px] text-g-textSecondary leading-[1.6] mt-2">
            {description}
          </p>
        </div>
        {onSelect && (
          <div className="mt-4 pt-3 border-t border-g-borderSubtle flex items-center justify-between text-[11px] font-mono">
            <span className={active ? 'text-g-blue font-semibold' : 'text-g-textMuted group-hover:text-g-blue transition-colors'}>
              {active ? 'Inspecting module below' : 'Inspect architecture →'}
            </span>
          </div>
        )}
      </SpotlightCard>
    );

    if (!onSelect) return cardContent;

    return (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={active}
        onClick={onSelect}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        className="h-full rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
      >
        {cardContent}
      </div>
    );
  }
);

FeatureCard.displayName = 'FeatureCard';

