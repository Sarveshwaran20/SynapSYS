import React from 'react';
import { SpotlightCard } from '../motion';

export interface TierCardProps {
  tierLabel: string;
  title: string;
  description: string;
  detail: string;
  highlight?: 'blue' | 'purple';
}

export const TierCard: React.FC<TierCardProps> = React.memo(
  ({ tierLabel, title, description, detail, highlight = 'blue' }) => {
    const labelColor =
      highlight === 'purple' ? 'var(--tyrian)' : 'var(--g-blue)';

    return (
      <SpotlightCard
        surface={false}
        notch={false}
        className="lp-notch-card p-6 h-full flex flex-col justify-between"
      >
        <div>
          <span
            className="inline-block text-[12px] font-medium uppercase tracking-[0.08em] mb-2"
            style={{ color: labelColor }}
          >
            {tierLabel}
          </span>
          <h3 className="text-[18px] font-cinzel font-semibold text-g-text leading-snug">
            {title}
          </h3>
          <p className="text-[15px] text-g-textSecondary leading-[1.6] mt-2">
            {description}
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-g-borderSubtle text-[13px] text-g-textMuted">
          {detail}
        </div>
      </SpotlightCard>
    );
  }
);

TierCard.displayName = 'TierCard';

