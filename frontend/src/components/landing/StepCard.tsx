import React from 'react';
import { SpotlightCard } from '../motion';

export interface StepCardProps {
  numeral: string;
  title: string;
  subtitle: string;
  description: string;
}

export const StepCard: React.FC<StepCardProps> = React.memo(
  ({ numeral, title, subtitle, description }) => {
    return (
      <SpotlightCard
        surface={false}
        notch={false}
        className="group lp-notch-card p-6 h-full flex flex-col"
      >
        <div className="flex items-center gap-3.5 mb-4">
          <span
            className="w-10 h-10 rounded-full border border-g-border bg-g-surfaceElevated font-cinzel text-[14px] font-bold text-g-text flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:border-g-blue/60"
            aria-hidden="true"
          >
            {numeral}
          </span>
          <div className="min-w-0">
            <h3 className="text-[18px] font-cinzel font-semibold text-g-text leading-tight">
              {title}
            </h3>
            <span className="text-[13px] text-g-blue font-medium block mt-0.5">
              {subtitle}
            </span>
          </div>
        </div>
        <p className="text-[15px] text-g-textSecondary leading-[1.6]">
          {description}
        </p>
      </SpotlightCard>
    );
  }
);

StepCard.displayName = 'StepCard';

