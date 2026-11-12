import React, { useId } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SynapsysLogo } from '../SynapsysLogo';
import { UserProfile } from '../types';
import { dur, ease, useDocumentVisible } from '../lib/motion';
import { StatusDot } from './motion/StatusDot';

export interface AuthBootStage {
  id: string;
  label: string;
  detail: string;
}

export const AUTH_BOOT_STAGES: readonly AuthBootStage[] = [
  {
    id: 'auth',
    label: 'Tenant Authentication',
    detail: 'Verifying operator session and multi-tenant scope...',
  },
  {
    id: 'topology',
    label: 'Facility Topology',
    detail: 'Mapping assigned production sites and shop-floor bays...',
  },
  {
    id: 'fieldbus',
    label: 'Fieldbus Stream',
    detail: 'Subscribing to OPC-UA & MQTT Sparkplug B ingestion...',
  },
  {
    id: 'telemetry',
    label: 'OEE & Alarms',
    detail: 'Hydrating ISO-22400 baseline and ISA-18.2 alarm triage...',
  },
] as const;

export interface AuthLoadingPageProps {
  user?: UserProfile | null;
  facilityName?: string;
  isDarkMode?: boolean;
  progress: number;
  activeStageIndex: number;
  stages?: readonly AuthBootStage[];
}

const PROGRESS_RING_RADIUS = 54;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

export const AuthLoadingPage: React.FC<AuthLoadingPageProps> = ({
  user,
  facilityName,
  isDarkMode = true,
  progress,
  activeStageIndex,
  stages = AUTH_BOOT_STAGES,
}) => {
  const uid = useId().replace(/:/g, '');
  const sealGradId = `auth-seal-${uid}`;
  const auraGradId = `auth-aura-${uid}`;
  const conduitGradId = `auth-conduit-${uid}`;

  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();
  const animateAmbient = !shouldReduce && isDocVisible;

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const boundedStageIdx = Math.max(0, Math.min(stages.length - 1, activeStageIndex));
  const currentStage = stages[boundedStageIdx];
  const isComplete = clampedProgress >= 100;

  const strokeOffset =
    PROGRESS_RING_CIRCUMFERENCE * (1 - clampedProgress / 100);

  const companyLabel = user?.company_name || 'SynapSYS Enterprise';
  const operatorLabel = user?.full_name || 'Demo Explorer';
  const roleLabel = (user?.role || 'demo').toUpperCase();
  const facilityLabel =
    facilityName || user?.assigned_facility || 'synapsys-mfg-prod-us';

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: dur.fast, ease }}
      className="min-h-screen w-full overflow-x-clip bg-g-bg text-g-text relative flex flex-col justify-between select-none transition-colors duration-200"
      role="status"
      aria-live="polite"
      aria-label={`Signing in to ${companyLabel}, initialization ${Math.round(clampedProgress)}%`}
    >
      {/* Fixed Engineering Blueprint Grid & Ambient Corner Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 hero-blueprint-grid opacity-40" />
        <div className="absolute inset-0 marble-drift-layer opacity-80" />
        <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full hero-ambient-glow-blue opacity-45" />
        <div className="absolute -bottom-48 -left-48 w-[540px] h-[540px] rounded-full hero-ambient-glow-purple opacity-35" />
      </div>

      {/* Top Live Sweep Accent Bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-30 bg-g-border/40 overflow-hidden pointer-events-none">
        <div
          className={`h-full w-1/3 ${animateAmbient ? 'auth-scan-sweep' : 'hidden'}`}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--g-blue) 45%, var(--laurel) 80%, transparent 100%)',
          }}
        />
      </div>

      {/* Minimal Top Session Header */}
      <header className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-10 py-5 flex items-center justify-between gap-4">
        <SynapsysLogo variant="horizontal" size="md" isDarkMode={isDarkMode} />

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-[4px] border border-g-border bg-g-surface/90 backdrop-blur-sm">
          <StatusDot status={isComplete ? 'running' : 'live'} size="sm" />
          <span className="font-mono text-[12px] text-g-textSecondary tracking-wide">
            {isComplete ? 'Workspace Ready' : 'Establishing Session'}
          </span>
        </div>
      </header>

      {/* Center Architectural Seal + Initialization Telemetry Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Animated Octagonal Telemetry Seal */}
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: dur.base, ease }}
          className="relative flex items-center justify-center mb-7"
        >
          {/* Ambient radial halo centered behind seal */}
          <div
            className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full pointer-events-none blur-2xl opacity-45"
            style={{
              background:
                'radial-gradient(circle, color-mix(in srgb, var(--g-blue) 28%, transparent) 0%, color-mix(in srgb, var(--tyrian) 14%, transparent) 52%, transparent 72%)',
            }}
            aria-hidden="true"
          />

          <svg
            viewBox="0 0 160 160"
            className="w-36 h-36 sm:w-44 sm:h-44 relative z-10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={sealGradId}
                x1="34"
                y1="34"
                x2="126"
                y2="126"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="var(--g-surface-elevated)" />
                <stop offset="100%" stopColor="var(--g-surface)" />
              </linearGradient>
              <radialGradient id={auraGradId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--g-blue)" stopOpacity="0.34" />
                <stop offset="65%" stopColor="var(--tyrian)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="var(--g-blue)" stopOpacity="0.02" />
              </radialGradient>
              <linearGradient
                id={conduitGradId}
                x1="62"
                y1="56"
                x2="98"
                y2="104"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="var(--g-blue)" />
                <stop offset="55%" stopColor="var(--g-blue)" />
                <stop offset="100%" stopColor="var(--laurel)" />
              </linearGradient>
            </defs>

            {/* Layer 1: Outer Clockwise Reticle Ring */}
            <g
              className={animateAmbient ? 'auth-orbit-spin' : ''}
              style={{ transformOrigin: '80px 80px' }}
            >
              <circle
                cx="80"
                cy="80"
                r="72"
                stroke="var(--g-border)"
                strokeWidth="1.2"
                strokeDasharray="2.5 5.5"
                strokeOpacity="0.8"
              />
              <circle cx="80" cy="8" r="2.6" fill="var(--g-blue)" />
              <circle cx="152" cy="80" r="2.3" fill="var(--tyrian)" fillOpacity="0.85" />
              <circle cx="80" cy="152" r="2.6" fill="var(--laurel)" />
              <circle cx="8" cy="80" r="2.3" fill="var(--g-blue)" fillOpacity="0.7" />
            </g>

            {/* Layer 2: Counter-Rotating Precision Telemetry Arcs */}
            <g
              className={animateAmbient ? 'auth-orbit-reverse' : ''}
              style={{ transformOrigin: '80px 80px' }}
            >
              <path
                d="M 80 18 A 62 62 0 0 1 138.2 58.6"
                stroke="var(--g-blue)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeOpacity="0.75"
              />
              <path
                d="M 80 142 A 62 62 0 0 1 21.8 101.4"
                stroke="var(--tyrian)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeOpacity="0.75"
              />
              <path
                d="M 27.6 47.4 A 62 62 0 0 1 48.2 26.8"
                stroke="var(--g-border)"
                strokeWidth="1.25"
                strokeDasharray="3 3"
                strokeLinecap="round"
              />
              <path
                d="M 132.4 112.6 A 62 62 0 0 1 111.8 133.2"
                stroke="var(--g-border)"
                strokeWidth="1.25"
                strokeDasharray="3 3"
                strokeLinecap="round"
              />
            </g>

            {/* Layer 3: Calibration Progress Track & Active Sweep Arc */}
            <circle
              cx="80"
              cy="80"
              r={PROGRESS_RING_RADIUS}
              stroke="var(--g-border)"
              strokeOpacity="0.45"
              strokeWidth="2.5"
            />
            <circle
              cx="80"
              cy="80"
              r={PROGRESS_RING_RADIUS}
              stroke={isComplete ? 'var(--laurel)' : 'var(--g-blue)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 80 80)"
              style={{
                transition: shouldReduce
                  ? 'none'
                  : 'stroke-dashoffset 280ms cubic-bezier(0.22, 1, 0.36, 1), stroke 240ms ease',
              }}
            />

            {/* Layer 4: Chamfered Octagonal Seal Frame */}
            <polygon
              points="61.8,36 98.2,36 124,61.8 124,98.2 98.2,124 61.8,124 36,98.2 36,61.8"
              fill={`url(#${sealGradId})`}
              stroke="var(--g-border)"
              strokeWidth="1.5"
            />
            <polygon
              points="64.5,41 95.5,41 119,64.5 119,95.5 95.5,119 64.5,119 41,95.5 41,64.5"
              fill={`url(#${auraGradId})`}
              stroke="var(--g-blue)"
              strokeOpacity="0.28"
              strokeWidth="1"
            />

            {/* Cardinal Terminal Stage Pins (light up sequentially per boot stage) */}
            <line
              x1="80"
              y1="38"
              x2="80"
              y2="46"
              stroke={boundedStageIdx >= 0 ? 'var(--laurel)' : 'var(--g-border)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="122"
              y1="80"
              x2="114"
              y2="80"
              stroke={boundedStageIdx >= 1 ? 'var(--laurel)' : 'var(--g-border)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="80"
              y1="122"
              x2="80"
              y2="114"
              stroke={boundedStageIdx >= 2 ? 'var(--laurel)' : 'var(--g-border)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="38"
              y1="80"
              x2="46"
              y2="80"
              stroke={isComplete || boundedStageIdx >= 3 ? 'var(--laurel)' : 'var(--g-border)'}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Layer 5: Sculpted Fieldbus "S" Conduit & Synapse Core */}
            <motion.path
              d="M 94.5 62.5 H 74.5 L 65.5 71.5 V 74.5 L 94.5 85.5 V 88.5 L 85.5 97.5 H 65.5"
              stroke={`url(#${conduitGradId})`}
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{
                pathLength: shouldReduce ? 1 : 0,
                opacity: shouldReduce ? 1 : 0.45,
              }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: shouldReduce ? 0 : 0.75, ease }}
            />
            <circle cx="94.5" cy="62.5" r="3" fill="var(--g-blue)" />
            <circle cx="65.5" cy="97.5" r="3" fill="var(--laurel)" />
            <circle
              cx="80"
              cy="80"
              r="5"
              fill="var(--g-blue)"
              className={animateAmbient ? 'synapsys-core-pulse' : 'opacity-65'}
            />
            <circle cx="80" cy="80" r="2.2" fill="var(--g-surface)" />
          </svg>
        </motion.div>

        {/* Identity Badge & Stage Header */}
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.base, delay: shouldReduce ? 0 : 0.08, ease }}
          className="text-center max-w-lg mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border border-g-border bg-g-surfaceElevated mb-3">
            <span className="font-mono text-[12px] font-medium text-g-text">
              {companyLabel}
            </span>
            <span className="text-g-border">·</span>
            <span className="font-mono text-[12px] font-semibold text-g-blue">
              {roleLabel}
            </span>
          </div>

          <h1 className="font-cinzel font-bold text-[22px] sm:text-[26px] tracking-wide text-g-text leading-snug mb-2">
            Synchronizing plant workspace
          </h1>

          <div className="min-h-[24px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentStage.id}
                initial={shouldReduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduce ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: shouldReduce ? 0 : 0.16, ease }}
                className="text-[14px] text-g-textSecondary"
              >
                {currentStage.detail}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Notched Session Boot Checklist Card */}
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.base, delay: shouldReduce ? 0 : 0.14, ease }}
          className="lp-notch-card w-full max-w-md p-5 sm:p-6 shadow-xl"
        >
          {/* Progress Header */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-g-textMuted">
              Session initialization
            </span>
            <span className="font-mono text-[14px] font-semibold text-g-blue tabular-nums">
              {Math.round(clampedProgress)}%
            </span>
          </div>

          {/* GPU-Only Progress Bar (scaleX) */}
          <div className="h-2 w-full rounded-full bg-g-surfaceElevated border border-g-border/50 overflow-hidden mb-5">
            <motion.div
              className="h-full w-full origin-left rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, var(--g-blue) 0%, var(--laurel) 100%)',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: clampedProgress / 100 }}
              transition={{ duration: shouldReduce ? 0 : 0.28, ease }}
            />
          </div>

          {/* 4 Handshake Pipeline Steps */}
          <ul className="space-y-2.5 mb-5" aria-label="Initialization steps">
            {stages.map((stage, idx) => {
              const stepDone = isComplete || idx < boundedStageIdx;
              const stepActive = !isComplete && idx === boundedStageIdx;
              return (
                <li
                  key={stage.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-[4px] border transition-colors duration-200 ${
                    stepActive
                      ? 'bg-g-surfaceElevated border-g-blue/40'
                      : stepDone
                      ? 'bg-g-surfaceSubtle/60 border-g-border/60'
                      : 'bg-transparent border-g-border/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {stepDone ? (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: 'var(--g-green-light)',
                          borderColor: 'color-mix(in srgb, var(--laurel) 45%, transparent)',
                          color: 'var(--laurel)',
                        }}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    ) : stepActive ? (
                      <span className="w-5 h-5 flex items-center justify-center shrink-0">
                        <StatusDot status="live" size="sm" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-g-textMuted/60" />
                      </span>
                    )}

                    <span
                      className={`text-[13px] truncate ${
                        stepActive
                          ? 'text-g-text font-medium'
                          : stepDone
                          ? 'text-g-textSecondary'
                          : 'text-g-textMuted'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[12px] shrink-0 ${
                      stepDone
                        ? 'text-laurel font-medium'
                        : stepActive
                        ? 'text-g-blue font-medium'
                        : 'text-g-textMuted'
                    }`}
                  >
                    {stepDone ? 'SYNCED' : stepActive ? 'ACTIVE' : 'QUEUED'}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Operator & Site Metadata Strip */}
          <div className="pt-3.5 border-t border-g-border flex flex-wrap items-center justify-between gap-2 text-[12px] text-g-textSecondary">
            <span className="truncate">
              Operator: <strong className="text-g-text font-medium">{operatorLabel}</strong>
            </span>
            <span className="font-mono text-g-textMuted truncate max-w-[200px]">
              {facilityLabel}
            </span>
          </div>
        </motion.div>
      </main>

      {/* Subtle Industrial Protocol Footer */}
      <footer className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-10 py-4 text-center text-[12px] text-g-textMuted">
        ISO-22400 OEE · ISA-95 MES · ISA-18.2 Alarms · IEC-62541 OPC-UA Sparkplug B
      </footer>
    </motion.div>
  );
};

export default AuthLoadingPage;

