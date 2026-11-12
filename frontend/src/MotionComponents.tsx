import React from 'react';

export {
  AnimatedNumber,
  SpotlightCard,
  MeanderDivider,
  StatusDot,
} from './components/motion';

// Circular Roman Numeral Medallion
export const RomanMedallion: React.FC<{
  numeral: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
}> = React.memo(({ numeral, size = 'md', active = false, className = '' }) => {
  const sizeClasses =
    size === 'sm'
      ? 'w-5 h-5 text-[10px]'
      : size === 'lg'
      ? 'w-7 h-7 text-xs'
      : 'w-6 h-6 text-[11px]';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-cinzel font-bold border transition-all duration-200 group-hover:scale-105 shrink-0 ${sizeClasses} ${
        active
          ? 'bg-g-blue/15 border-g-blue text-g-blue shadow-[0_0_10px_color-mix(in_srgb,var(--g-blue)_22%,transparent)]'
          : 'bg-g-surfaceElevated border-g-border text-g-textSecondary'
      } ${className}`}
    >
      {numeral}
    </span>
  );
});

RomanMedallion.displayName = 'RomanMedallion';
