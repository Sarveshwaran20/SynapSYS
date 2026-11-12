import React from 'react';

export interface ExpansionCardProps {
  bayLabel?: string;
  onAddAsset: () => void;
}

export const ExpansionCard: React.FC<ExpansionCardProps> = React.memo(
  ({ bayLabel = 'Expansion bay', onAddAsset }) => {
    return (
      <article
        onClick={onAddAsset}
        className="twin-expansion-slot group h-full min-h-[380px] flex flex-col justify-between p-6 rounded-[12px] bg-g-surface cursor-pointer focus-within:ring-2 focus-within:ring-g-blue focus-within:ring-offset-2 focus-within:ring-offset-g-bg"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-medium text-g-textMuted">
            {bayLabel}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-g-border bg-g-surfaceElevated text-[12px] font-medium text-g-textSecondary">
            Available
          </span>
        </div>

        <div className="flex flex-col items-center text-center my-auto py-6">
          <div
            className="w-14 h-14 rounded-full border border-g-border bg-g-surfaceElevated flex items-center justify-center mb-4 text-g-blue transition-colors group-hover:border-g-blue/50"
            aria-hidden="true"
          >
            <svg
              className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>

          <h4 className="font-cinzel text-[16px] font-semibold text-g-text">
            Commission new bay
          </h4>

          <p className="text-[13px] text-g-textMuted mt-1.5 max-w-[260px] leading-relaxed">
            Supports OPC-UA, Modbus TCP, Sparkplug B
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddAsset();
            }}
            aria-label={`Add asset to ${bayLabel}`}
            className="twin-btn-primary-glow w-full h-10 px-4 rounded-[8px] bg-g-blue hover:bg-g-blueHover active:scale-[0.98] text-[14px] font-medium text-white inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
          >
            <span>Add asset to bay</span>
          </button>
        </div>
      </article>
    );
  }
);

ExpansionCard.displayName = 'ExpansionCard';

