import React, { useId } from 'react';

interface SynapsysLogoProps {
  variant?: 'icon' | 'horizontal' | 'hero';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isDarkMode?: boolean;
}

export const SynapsysLogo: React.FC<SynapsysLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  isDarkMode = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const sealGradId = `synapsys-seal-${uid}`;
  const auraGradId = `synapsys-aura-${uid}`;
  const conduitGradId = `synapsys-conduit-${uid}`;

  const iconSize =
    size === 'sm' ? 30 : size === 'lg' ? 40 : size === 'xl' ? 58 : 34;

  const titleClass =
    size === 'sm'
      ? 'text-[15px] tracking-[0.09em]'
      : size === 'lg'
      ? 'text-[20px] tracking-[0.11em]'
      : size === 'xl'
      ? 'text-[28px] sm:text-[34px] tracking-[0.15em]'
      : 'text-[17px] tracking-[0.1em]';

  const subtitleClass =
    size === 'sm'
      ? 'text-[10px] tracking-[0.14em]'
      : size === 'lg'
      ? 'text-[11px] tracking-[0.16em]'
      : size === 'xl'
      ? 'text-[12px] tracking-[0.2em]'
      : 'text-[11px] tracking-[0.15em]';

  const IconSvg = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-theme={isDarkMode ? 'dark' : 'light'}
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={sealGradId} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--g-surface-elevated)" />
          <stop offset="100%" stopColor="var(--g-surface)" />
        </linearGradient>
        <radialGradient id={auraGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--g-blue)" stopOpacity="0.32" />
          <stop offset="60%" stopColor="var(--tyrian)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--g-blue)" stopOpacity="0.02" />
        </radialGradient>
        <linearGradient id={conduitGradId} x1="15" y1="14" x2="33" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--g-blue)" />
          <stop offset="55%" stopColor="var(--g-blue)" />
          <stop offset="100%" stopColor="var(--tyrian)" />
        </linearGradient>
      </defs>

      {/* Outer Chamfered Octagon Architecture Seal */}
      <polygon
        points="15.3,4.2 32.7,4.2 43.8,15.3 43.8,32.7 32.7,43.8 15.3,43.8 4.2,32.7 4.2,15.3"
        fill={`url(#${sealGradId})`}
        stroke="var(--g-border)"
        strokeWidth="1.4"
      />
      <polygon
        points="16.4,6.4 31.6,6.4 41.6,16.4 41.6,31.6 31.6,41.6 16.4,41.6 6.4,31.6 6.4,16.4"
        fill={`url(#${auraGradId})`}
        stroke="var(--g-blue)"
        strokeOpacity="0.22"
        strokeWidth="0.9"
      />

      {/* Counter-posed Precision Telemetry Arcs */}
      <g className="origin-center transition-transform duration-500 group-hover:rotate-12">
        <path
          d="M 24 9.5 A 14.5 14.5 0 0 1 38.5 24"
          stroke="var(--g-blue)"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeOpacity="0.72"
        />
        <path
          d="M 24 38.5 A 14.5 14.5 0 0 1 9.5 24"
          stroke="var(--tyrian)"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeOpacity="0.72"
        />
        <path
          d="M 11.2 18.2 A 14.5 14.5 0 0 1 18.2 11.2"
          stroke="var(--g-border)"
          strokeWidth="1.1"
          strokeDasharray="2 2.4"
          strokeLinecap="round"
        />
        <path
          d="M 36.8 29.8 A 14.5 14.5 0 0 1 29.8 36.8"
          stroke="var(--g-border)"
          strokeWidth="1.1"
          strokeDasharray="2 2.4"
          strokeLinecap="round"
        />
      </g>

      {/* Cardinal Precision Registration Ticks */}
      <line x1="24" y1="2.2" x2="24" y2="5.6" stroke="var(--g-blue)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="24" y1="42.4" x2="24" y2="45.8" stroke="var(--tyrian)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2.2" y1="24" x2="5.6" y2="24" stroke="var(--g-border)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="42.4" y1="24" x2="45.8" y2="24" stroke="var(--g-border)" strokeWidth="1.2" strokeLinecap="round" />

      {/* Sculpted Neural Synapse "S"-Conduit */}
      <path
        d="M 31 15.5 H 22 L 17.5 20 V 21.5 L 30.5 26.5 V 28 L 26 32.5 H 17"
        stroke={`url(#${conduitGradId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Input / Output Fieldbus Terminal Nodes */}
      <circle cx="31.5" cy="15.5" r="2.6" fill="var(--g-surface)" stroke="var(--g-blue)" strokeWidth="1.6" />
      <circle cx="16.5" cy="32.5" r="2.6" fill="var(--g-surface)" stroke="var(--tyrian)" strokeWidth="1.6" />

      {/* Live Central Synapse Junction Pulse */}
      <circle
        cx="24"
        cy="24"
        r="5.2"
        fill="var(--g-blue)"
        fillOpacity="0.22"
        className="synapsys-core-pulse"
      />
      <circle
        cx="24"
        cy="24"
        r="2.8"
        fill="var(--g-text)"
        stroke="var(--g-surface)"
        strokeWidth="1.2"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`group inline-flex items-center ${className}`}>{IconSvg}</div>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={`group inline-flex items-center gap-4 sm:gap-5 select-none ${className}`}
      >
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute -inset-2.5 rounded-full border border-dashed border-g-blue/40 synapsys-slow-spin"
          />
          <span
            aria-hidden="true"
            className="absolute -inset-4 rounded-full border border-dotted border-g-border/80 synapsys-reverse-spin"
          />
          <div className="relative z-10 p-1.5 rounded-2xl bg-g-surface/85 border border-g-border shadow-softAegean">
            {IconSvg}
          </div>
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2.5">
            <span
              className={`font-cinzel font-bold leading-none text-g-text ${titleClass}`}
            >
              SYNAPSYS
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-g-surfaceElevated border border-g-border text-[11px] font-mono font-medium text-g-blue">
              <span className="w-1.5 h-1.5 rounded-full bg-g-blue" />
              <span>SCADA PLATFORM</span>
            </span>
          </div>
          <span
            className={`font-sans font-medium uppercase text-g-textMuted leading-tight mt-1.5 ${subtitleClass}`}
          >
            Industrial Intelligence &amp; Supervisory Telemetry
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-center gap-3 select-none ${className}`}>
      {IconSvg}
      <div className="flex flex-col">
        <span
          className={`font-cinzel font-bold leading-none text-g-text ${titleClass}`}
        >
          SYNAPSYS
        </span>
        <span
          className={`font-sans font-medium uppercase text-g-textMuted leading-tight mt-1 ${subtitleClass}`}
        >
          Industrial SCADA
        </span>
      </div>
    </div>
  );
};

export default SynapsysLogo;
