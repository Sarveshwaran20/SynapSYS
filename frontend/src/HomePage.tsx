import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AuthSession, UserRole } from './types';
import {
  authenticateWorkspace,
  initiate2FASignup,
  verify2FASignup,
} from './lib/auth';
import { SynapsysLogo } from './SynapsysLogo';
import { ease, fadeDown, useDocumentVisible, viewportOnce } from './lib/motion';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AnimatedNumber,
  ChunkSectionFallback,
  LazySection,
  MeanderDivider,
  MotionButton,
  MotionModal,
  Reveal,
  RevealGroup,
  RevealItem,
  RevealText,
  RevealWords,
  ScrollProgressBar,
  SlidingTabGroup,
  SlidingTabIndicator,
  SpotlightCard,
  StatusDot,
} from './components/motion';
import {
  DemoPlantData,
  FeatureCard,
  HeroPreview,
  type ProductModuleId,
  ProtocolMarqueeRibbon,
  StepCard,
  TierCard,
} from './components/landing';

const LazyLandingScrollBackground = lazy(() =>
  import('./components/landing/LandingScrollBackground').then((m) => ({
    default: m.LandingScrollBackground,
  }))
);

const LazyFeatureSpotlightDeck = lazy(() =>
  import('./components/landing/FeatureSpotlightDeck').then((m) => ({
    default: m.FeatureSpotlightDeck,
  }))
);

const LazyTelemetrySandboxLab = lazy(() =>
  import('./components/landing/TelemetrySandboxLab').then((m) => ({
    default: m.TelemetrySandboxLab,
  }))
);

export interface HomePageProps {
  onLoginSuccess: (session: AuthSession) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenFullLogin?: () => void;
}

export const DEMO_DATA = {
  brand: 'SynapSYS',
  hero: {
    eyebrow: 'Industrial intelligence platform',
    headline: 'See every machine. Understand every minute.',
    subheadline:
      'Monitor equipment across your plant, measure live OEE, and catch downtime before it stops a line.',
    primaryCta: 'Open dashboard',
    secondaryCta: 'Explore features',
    trustPoints: [
      'OPC-UA and MQTT ready',
      'ISO 22400 OEE',
      'Works with any PLC',
    ],
  },
  plants: [
    {
      id: 'plant-a',
      label: 'Plant A',
      subtitle: 'Machining',
      oee: 88.4,
      availability: 93.2,
      performance: 96.1,
      quality: 98.7,
      throughput: '1,420 pcs/hr',
      latency: '12 ms sync',
      machines: [
        {
          id: 'm-101',
          name: 'Milling cell',
          status: 'Running',
          metric: '21.6 kW',
          sparkPath: 'M2 14 L12 11 L22 13 L32 8 L42 10 L52 6 L62 7',
        },
        {
          id: 'm-102',
          name: 'Turning center',
          status: 'Running',
          metric: '18.4 kW',
          sparkPath: 'M2 15 L12 13 L22 10 L32 11 L42 9 L52 8 L62 6',
        },
        {
          id: 'm-103',
          name: 'Multi-spindle',
          status: 'Standby',
          metric: '4.1 kW',
          sparkPath: 'M2 16 L12 16 L22 15 L32 16 L42 16 L52 15 L62 16',
        },
        {
          id: 'm-104',
          name: 'Finish grinder',
          status: 'Running',
          metric: '51.2 °C',
          sparkPath: 'M2 13 L12 12 L22 10 L32 9 L42 11 L52 7 L62 8',
        },
      ],
    },
    {
      id: 'plant-b',
      label: 'Plant B',
      subtitle: 'Polymers',
      oee: 84.6,
      availability: 91.4,
      performance: 94.0,
      quality: 98.5,
      throughput: '2,180 pcs/hr',
      latency: '14 ms sync',
      machines: [
        {
          id: 'm-201',
          name: 'Injection press',
          status: 'Running',
          metric: '184 °C',
          sparkPath: 'M2 12 L12 10 L22 11 L32 9 L42 10 L52 8 L62 9',
        },
        {
          id: 'm-202',
          name: 'Molding line',
          status: 'Fault',
          metric: '64.8 °C',
          sparkPath: 'M2 15 L12 12 L22 14 L32 7 L42 5 L52 4 L62 3',
        },
        {
          id: 'm-203',
          name: 'Extrusion unit',
          status: 'Running',
          metric: '26.2 kW',
          sparkPath: 'M2 14 L12 13 L22 12 L32 11 L42 10 L52 9 L62 9',
        },
        {
          id: 'm-204',
          name: 'Forming station',
          status: 'Running',
          metric: '15.8 kW',
          sparkPath: 'M2 15 L12 14 L22 12 L32 13 L42 10 L52 9 L62 8',
        },
      ],
    },
    {
      id: 'plant-c',
      label: 'Plant C',
      subtitle: 'Assembly',
      oee: 91.2,
      availability: 95.1,
      performance: 96.6,
      quality: 99.3,
      throughput: '960 units/hr',
      latency: '9 ms sync',
      machines: [
        {
          id: 'm-301',
          name: 'Transfer station',
          status: 'Running',
          metric: '14.2 kW',
          sparkPath: 'M2 15 L12 13 L22 11 L32 10 L42 9 L52 7 L62 6',
        },
        {
          id: 'm-302',
          name: 'Joining cell',
          status: 'Running',
          metric: '19.5 kW',
          sparkPath: 'M2 13 L12 12 L22 11 L32 8 L42 9 L52 7 L62 6',
        },
        {
          id: 'm-303',
          name: 'Fastening rig',
          status: 'Running',
          metric: '11.8 kW',
          sparkPath: 'M2 14 L12 12 L22 13 L32 11 L42 9 L52 8 L62 7',
        },
        {
          id: 'm-304',
          name: 'End-of-line bench',
          status: 'Running',
          metric: '42.6 °C',
          sparkPath: 'M2 14 L12 14 L22 12 L32 11 L42 10 L52 9 L62 8',
        },
      ],
    },
    {
      id: 'plant-d',
      label: 'Plant D',
      subtitle: 'Packaging',
      oee: 86.9,
      availability: 92.8,
      performance: 94.7,
      quality: 98.9,
      throughput: '3,480 packs/hr',
      latency: '11 ms sync',
      machines: [
        {
          id: 'm-401',
          name: 'Rotary filler',
          status: 'Running',
          metric: '16.9 kW',
          sparkPath: 'M2 13 L12 11 L22 12 L32 9 L42 8 L52 9 L62 7',
        },
        {
          id: 'm-402',
          name: 'Case erector',
          status: 'Running',
          metric: '12.4 kW',
          sparkPath: 'M2 15 L12 14 L22 13 L32 10 L42 11 L52 9 L62 8',
        },
        {
          id: 'm-403',
          name: 'Palletizing cell',
          status: 'Standby',
          metric: '3.4 kW',
          sparkPath: 'M2 16 L12 16 L22 16 L32 15 L42 16 L52 16 L62 15',
        },
        {
          id: 'm-404',
          name: 'Vision labeler',
          status: 'Running',
          metric: '99.4% pass',
          sparkPath: 'M2 12 L12 11 L22 10 L32 9 L42 9 L52 7 L62 6',
        },
      ],
    },
  ] as DemoPlantData[],
  features: [
    {
      id: 'monitoring',
      title: 'Real-time monitoring',
      description:
        'Watch live power, temperature, cycle time, and run status from every floor asset in one place.',
      accent: 'blue' as const,
    },
    {
      id: 'oee',
      title: 'OEE analytics',
      description:
        'Break down Availability, Performance, and Quality to see where shift minutes are won or lost.',
      accent: 'blue' as const,
    },
    {
      id: 'twin',
      title: 'Digital twin',
      description:
        'View bays, material conveyors, and autonomous transfer routes on a clear spatial floor map.',
      accent: 'purple' as const,
    },
    {
      id: 'predictive',
      title: 'Predictive health',
      description:
        'Spot rising vibration or bearing heat early so maintenance happens during planned stops.',
      accent: 'blue' as const,
    },
    {
      id: 'workorders',
      title: 'Work orders',
      description:
        'Track batch targets, finished parts, and active shift progress alongside machine state.',
      accent: 'blue' as const,
    },
    {
      id: 'alerts',
      title: 'Alerts and incidents',
      description:
        'Surface threshold breaches immediately with guided triage and one-click acknowledgment.',
      accent: 'purple' as const,
    },
  ],
  steps: [
    {
      numeral: 'I',
      title: 'Connect',
      subtitle: 'PLCs and sensors',
      description:
        'Link floor controllers and gauges over standard protocols without stopping active production.',
    },
    {
      numeral: 'II',
      title: 'Analyze',
      subtitle: 'ISO 22400 OEE',
      description:
        'Turn raw machine tags into clean Availability, Performance, and Quality metrics continuously.',
    },
    {
      numeral: 'III',
      title: 'Act',
      subtitle: 'Alerts and work orders',
      description:
        'Notify operators when lines drift and schedule maintenance before small faults stop output.',
    },
  ],
  tiers: [
    {
      tierLabel: 'Tier I · Field',
      title: 'Edge',
      description:
        'Lightweight polling collectors read machine registers directly on the plant network with local buffering.',
      detail: 'OPC-UA, MQTT Sparkplug B, Modbus TCP',
      highlight: 'blue' as const,
    },
    {
      tierLabel: 'Tier II · Stream',
      title: 'Ingestion',
      description:
        'Structured telemetry streams normalize time-series events and keep ordered delivery through network blips.',
      detail: 'Sub-second schema validation & replay',
      highlight: 'purple' as const,
    },
    {
      tierLabel: 'Tier III · Cloud & Analytics',
      title: 'Firebase Cloud & Realtime',
      description:
        'Mirror multi-plant telemetry, OEE waterfalls, operator auth, and alarm audits to Google Cloud Firestore with automatic local SQLite fallback.',
      detail: 'Firestore REST & Realtime listeners + live OEE console',
      highlight: 'blue' as const,
    },
  ],
  kpis: [
    {
      id: 'kpi-oee',
      value: 87.8,
      decimals: 1,
      suffix: '%',
      label: 'Fleet demo OEE',
      note: 'Demo data',
    },
    {
      id: 'kpi-sync',
      value: 12,
      decimals: 0,
      suffix: ' ms',
      label: 'Median ingestion sync',
      note: 'Demo data',
    },
    {
      id: 'kpi-uptime',
      value: 99.9,
      decimals: 1,
      suffix: '%',
      label: 'Collector availability',
      note: 'Demo data',
    },
    {
      id: 'kpi-assets',
      value: 16,
      decimals: 0,
      suffix: '',
      label: 'Monitored demo bays',
      note: 'Demo data',
    },
  ],
  cta: {
    title: 'Clear operational visibility for your plant',
    subtitle:
      'Explore live demo telemetry, inspect individual bays, and test shift workflows in minutes.',
    primary: 'Open dashboard',
    secondary: 'Launch demo session',
  },
  footerColumns: [
    {
      heading: 'Platform',
      links: [
        { label: 'Features', target: 'features' },
        { label: 'How it works', target: 'how-it-works' },
        { label: 'Architecture', target: 'architecture' },
      ],
    },
    {
      heading: 'Operations',
      links: [
        { label: 'Live KPIs', target: 'kpis' },
        { label: 'Digital twin', target: 'features' },
        { label: 'OEE analytics', target: 'features' },
      ],
    },
    {
      heading: 'Standards',
      links: [
        { label: 'OPC-UA & MQTT', target: 'architecture' },
        { label: 'ISO 22400 OEE', target: 'how-it-works' },
        { label: 'Workspace sign in', target: 'login' },
      ],
    },
  ],
};

function renderFeatureIcon(id: string): React.ReactNode {
  switch (id) {
    case 'monitoring':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3-7 4 14 3-7h4" />
        </svg>
      );
    case 'oee':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 9 9h-9V3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 4.1A9 9 0 0 1 20 8h-4V4.1z" />
        </svg>
      );
    case 'twin':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="7" height="7" rx="1" />
          <rect x="14" y="4" width="7" height="7" rx="1" />
          <rect x="3" y="13" width="7" height="7" rx="1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 16.5h7M17.5 13v7" />
        </svg>
      );
    case 'predictive':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'workorders':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      );
  }
}

const SectionBackdropNumeral: React.FC<{ numeral: string }> = React.memo(
  ({ numeral }) => {
    const shouldReduce = useReducedMotion();
    return (
      <motion.div
        aria-hidden="true"
        initial={shouldReduce ? false : { opacity: 0, y: 18, scale: 0.96 }}
        whileInView={{ opacity: 0.04, y: 0, scale: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.6, ease }}
        className="pointer-events-none select-none hidden md:block absolute -top-2 right-4 sm:right-8 font-cinzel font-bold text-[120px] lg:text-[160px] leading-none text-g-text opacity-[0.04]"
      >
        {numeral}
      </motion.div>
    );
  }
);

SectionBackdropNumeral.displayName = 'SectionBackdropNumeral';

export const HomePage: React.FC<HomePageProps> = ({
  onLoginSuccess,
  isDarkMode,
  onToggleTheme,
  onOpenFullLogin,
}) => {
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState<boolean>(false);
  const [activeNavSection, setActiveNavSection] = useState<
    'features' | 'how-it-works' | 'architecture' | 'signal-lab' | 'kpis'
  >('features');
  const [activePlantId, setActivePlantId] =
    useState<DemoPlantData['id']>('plant-a');
  const [activeFeatureModule, setActiveFeatureModule] =
    useState<ProductModuleId>('monitoring');
  const [liveOeeOffset, setLiveOeeOffset] = useState<number>(0);
  const [mountBackdrop, setMountBackdrop] = useState<boolean>(false);
  const [hydratedSections, setHydratedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(() => setMountBackdrop(true), { timeout: 600 });
      return () => win.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(() => setMountBackdrop(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  // Corporate credential & sign up form state
  const [modalAuthMode, setModalAuthMode] = useState<'signin' | 'signup' | 'otp_verify'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleOpenLogin = useCallback(() => {
    if (onOpenFullLogin) {
      onOpenFullLogin();
    } else {
      setShowLoginModal(true);
    }
  }, [onOpenFullLogin]);

  const isDocVisible = useDocumentVisible();
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const sections: Array<
      'features' | 'how-it-works' | 'architecture' | 'signal-lab' | 'kpis'
    > = [
        'features',
        'how-it-works',
        'architecture',
        'signal-lab',
        'kpis',
      ];
    const onScroll = () => {
      setIsHeaderScrolled(window.scrollY > 8);
      const anchorY = 160;
      let current:
        | 'features'
        | 'how-it-works'
        | 'architecture'
        | 'signal-lab'
        | 'kpis' = 'features';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= anchorY) {
          current = id;
        }
      }
      setActiveNavSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Subtle live demo tick for preview widget (paused when hidden or reduced motion)
  useEffect(() => {
    if (!isDocVisible || shouldReduce) return;
    let step = 0;
    const offsets = [0, 0.2, -0.1, 0.3, 0.1];
    const timer = window.setInterval(() => {
      step = (step + 1) % offsets.length;
      setLiveOeeOffset(offsets[step]);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [isDocVisible, shouldReduce]);

  const handleAuthSubmit = async (
    e?: React.FormEvent,
    directRole?: UserRole
  ) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (directRole) {
      setIsLoading(true);
      try {
        const session = await authenticateWorkspace({
          email: '',
          password: '',
          directRole,
        });
        setShowLoginModal(false);
        onLoginSuccess(session);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setAuthError('Enter your work email and password, or launch Demo Mode above.');
      return;
    }

    if (modalAuthMode === 'signup') {
      if (password.trim().length < 6) {
        setAuthError('Password must be at least 6 characters long.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await initiate2FASignup({
          email: email.trim(),
          password: password.trim(),
          fullName: fullName.trim() || undefined,
          companyName: companyName.trim() || undefined,
        });
        setAuthSuccess(`2FA security code dispatched to ${res.recipient}! An alert was sent to supervisor.`);
        if (res.debug_otp_hint) setOtpHint(res.debug_otp_hint);
        setModalAuthMode('otp_verify');
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Failed to initiate 2FA registration.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const session = await authenticateWorkspace({ email, password });
      setShowLoginModal(false);
      onLoginSuccess(session);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setAuthError('Enter the 6-digit verification code sent to the company email.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await verify2FASignup({
        email: email.trim(),
        otpCode: otpCode.trim(),
        fullName: fullName.trim() || undefined,
        companyName: companyName.trim() || undefined,
      });
      setAuthSuccess('2FA verified! Loading isolated company workspace...');
      setTimeout(() => {
        setShowLoginModal(false);
        onLoginSuccess(session);
      }, 600);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid or expired 2FA code.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'login') {
      setShowLoginModal(true);
      return;
    }
    setHydratedSections((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-g-bg text-g-text font-sans selection:bg-g-blue selection:text-white relative flex flex-col">
      {/* Deferred Multi-Layer Scroll-Linked Classical & Blueprint Background */}
      {mountBackdrop && (
        <Suspense fallback={null}>
          <LazyLandingScrollBackground />
        </Suspense>
      )}

      {/* Top Reading Telemetry Progress Rail & Magnetic Return Pill */}
      <ScrollProgressBar />

      {/* Top Sticky Navigation Bar */}
      <motion.header
        variants={fadeDown}
        initial={shouldReduce ? false : 'hidden'}
        animate="show"
        className={`sticky top-0 z-40 w-full bg-g-surface/92 border-b header-scroll-transition ${isHeaderScrolled
          ? 'backdrop-blur-md border-g-border shadow-xs'
          : 'border-g-borderSubtle backdrop-blur-sm'
          }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue rounded-[6px] py-1 pr-2 shrink-0"
            aria-label="SynapSYS home"
          >
            <SynapsysLogo
              variant="horizontal"
              size="md"
              isDarkMode={isDarkMode}
            />
          </button>

          {/* Desktop Navigation with Smooth Active Glide */}
          <SlidingTabGroup id="lp-header-nav">
            <nav
              className="hidden md:flex items-center gap-1 lg:gap-1.5 px-2 py-1 rounded-[8px] bg-g-surfaceElevated/55 border border-g-borderSubtle text-[14px] font-medium"
              aria-label="Primary landing navigation"
            >
              {(
                [
                  { id: 'features', label: 'Features' },
                  { id: 'how-it-works', label: 'How it works' },
                  { id: 'architecture', label: 'Architecture' },
                  { id: 'signal-lab', label: 'Signal Lab' },
                  { id: 'kpis', label: 'Live KPIs' },
                ] as const
              ).map((item) => {
                const isNavActive = activeNavSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNavSection(item.id);
                      scrollToSection(item.id);
                    }}
                    className={`relative px-3.5 py-2 rounded-[6px] transition-colors cursor-pointer whitespace-nowrap ${isNavActive
                      ? 'text-g-text'
                      : 'text-g-textSecondary hover:text-g-text'
                      }`}
                  >
                    {isNavActive && (
                      <SlidingTabIndicator
                        layoutId="lp-nav-active-pill"
                        variant="pill"
                        className="bg-g-surface border border-g-border shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </SlidingTabGroup>

          {/* Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-g-surfaceElevated/60 border border-g-borderSubtle text-[12px] font-medium text-g-textSecondary">
              <StatusDot status="live" />
              <span>Demo live</span>
            </span>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={
                isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'
              }
              title={
                isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'
              }
              className="w-10 h-10 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle text-g-textSecondary hover:text-g-text flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
            >
              {isDarkMode ? (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  />
                </svg>
              )}
            </button>

            <MotionButton
              primary
              type="button"
              onClick={handleOpenLogin}
              className="h-10 px-4 sm:px-5 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white text-[14px] font-medium inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
            >
              <span>{DEMO_DATA.hero.primaryCta}</span>
            </MotionButton>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="md:hidden w-10 h-10 rounded-[8px] border border-g-border bg-g-surfaceElevated text-g-text flex items-center justify-center cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16M4 12h16M4 17h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease }}
            className="md:hidden border-t border-g-border bg-g-surface px-4 py-4 space-y-2"
          >
            {[
              { id: 'features', label: 'Features' },
              { id: 'how-it-works', label: 'How it works' },
              { id: 'architecture', label: 'Architecture' },
              { id: 'signal-lab', label: 'Signal Lab' },
              { id: 'kpis', label: 'Live KPIs' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left px-3 py-2 rounded-[8px] text-[15px] text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </motion.header>

      <main className="relative z-10 flex-1">
        {/* ================================================================
            HERO SECTION (Logo Lockup Before Everything + 55% / 45% Split)
            ================================================================ */}
        <section className="pt-8 pb-12 lg:pt-12 lg:pb-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          {/* Opening SynapSYS Brand Crest Before Everything */}
          <Reveal immediate className="mb-10 lg:mb-12">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-full flex items-center justify-center gap-4 sm:gap-6">
                <span
                  aria-hidden="true"
                  className="hidden sm:block flex-1 h-px max-w-[180px]"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, var(--g-border) 100%)',
                  }}
                />
                <motion.div
                  whileHover={shouldReduce ? undefined : { scale: 1.02 }}
                  transition={{ duration: 0.2, ease }}
                  className="px-5 py-3 rounded-xl bg-g-surface/75 backdrop-blur-md border border-g-border shadow-card-stone"
                >
                  <SynapsysLogo
                    variant="hero"
                    size="xl"
                    isDarkMode={isDarkMode}
                  />
                </motion.div>
                <span
                  aria-hidden="true"
                  className="hidden sm:block flex-1 h-px max-w-[180px]"
                  style={{
                    background:
                      'linear-gradient(90deg, var(--g-border) 0%, transparent 100%)',
                  }}
                />
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-[11fr_9fr] gap-12 lg:gap-12 items-center">
            {/* Left Column (55%): Editorial Pitch */}
            <div className="space-y-6">
              <Reveal immediate delay={0.05}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-g-surface border border-g-border text-[12px] font-medium uppercase tracking-[0.08em] text-g-textSecondary">
                  <StatusDot status="live" />
                  <span>{DEMO_DATA.hero.eyebrow}</span>
                </span>
              </Reveal>

              <RevealWords
                immediate
                as="h1"
                text={DEMO_DATA.hero.headline}
                staggerDelay={0.045}
                delayChildren={0.08}
                className="font-cinzel text-[36px] sm:text-[48px] lg:text-[56px] font-bold text-g-text leading-[1.12] tracking-tight"
              />

              <RevealText immediate delay={0.18} className="text-[18px] text-g-textSecondary leading-[1.6] max-w-[60ch]">
                {DEMO_DATA.hero.subheadline}
              </RevealText>

              <Reveal immediate delay={0.26}>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <MotionButton
                    primary
                    type="button"
                    onClick={handleOpenLogin}
                    className="h-12 px-6 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white text-[15px] font-medium inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
                  >
                    <span>{DEMO_DATA.hero.primaryCta}</span>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </MotionButton>

                  <MotionButton
                    type="button"
                    onClick={() => scrollToSection('features')}
                    className="h-12 px-6 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle text-g-text text-[15px] font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
                  >
                    <span>{DEMO_DATA.hero.secondaryCta}</span>
                  </MotionButton>
                </div>
              </Reveal>

              {/* Quiet Row of 3 Trust Points */}
              <RevealGroup
                as="ul"
                immediate
                staggerDelay={0.07}
                delayChildren={0.3}
                className="flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-2 text-[14px] text-g-textSecondary"
              >
                {DEMO_DATA.hero.trustPoints.map((point) => (
                  <RevealItem as="li" key={point} className="inline-flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-g-blue flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{point}</span>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>

            {/* Right Column (45%): Single Faint Glow + Live Plant Demo Preview */}
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-10 rounded-full hero-ambient-glow"
                aria-hidden="true"
              />
              <Reveal immediate delay={0.14} className="relative z-10">
                <HeroPreview
                  plants={DEMO_DATA.plants}
                  activePlantId={activePlantId}
                  onSelectPlant={setActivePlantId}
                  liveOeeOffset={liveOeeOffset}
                />
              </Reveal>
            </div>
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <MeanderDivider opacity={0.35} />
        </div>

        {/* Continuous Industrial Protocol & Supabase Standards Ticker */}
        <section aria-label="Supported industrial standards">
          <ProtocolMarqueeRibbon />
        </section>

        {/* ================================================================
            SECTION I: FEATURES (3x2 grid)
            ================================================================ */}
        <section
          id="features"
          className="relative py-14 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto"
        >
          <SectionBackdropNumeral numeral="I" />
          <Reveal className="mb-12 space-y-3">
            <div className="inline-flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-g-border bg-g-surfaceElevated font-cinzel text-[12px] font-bold text-g-text flex items-center justify-center">
                I
              </span>
              <span className="text-[12px] uppercase tracking-[0.08em] text-g-textMuted font-medium">
                Features
              </span>
            </div>
            <RevealWords
              as="h2"
              text="Built for shop floor clarity"
              staggerDelay={0.04}
              className="font-cinzel text-[28px] sm:text-[36px] font-bold text-g-text leading-tight"
            />
            <RevealText delay={0.1} className="text-[16px] text-g-textSecondary leading-[1.6] max-w-[65ch]">
              Everything operators and plant engineers need to track equipment output across lines. Select any capability card to inspect its live schema and telemetry payload.
            </RevealText>
          </Reveal>

          <LazySection
            forceMount={Boolean(hydratedSections.features)}
            label="Loading platform capabilities..."
            minHeight={420}
          >
            <RevealGroup
              staggerDelay={0.06}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {DEMO_DATA.features.map((feat) => {
                const moduleMap: Record<string, { mod: ProductModuleId; tag: string }> = {
                  monitoring: { mod: 'monitoring', tag: 'Live SCADA' },
                  oee: { mod: 'oee', tag: 'ISO-22400' },
                  twin: { mod: 'twin', tag: 'Spatial Floor' },
                  predictive: { mod: 'predictive', tag: 'Anomaly AI' },
                  workorders: { mod: 'workorders', tag: 'MES Batch' },
                  alerts: { mod: 'firebase', tag: 'Cloud DB' },
                };
                const mapped = moduleMap[feat.id] || { mod: 'monitoring' as ProductModuleId, tag: 'Module' };
                return (
                  <RevealItem key={feat.id} variant="grid" className="h-full">
                    <FeatureCard
                      title={feat.title}
                      description={feat.description}
                      accent={feat.accent}
                      icon={renderFeatureIcon(feat.id)}
                      tag={mapped.tag}
                      active={activeFeatureModule === mapped.mod}
                      onSelect={() => setActiveFeatureModule(mapped.mod)}
                    />
                  </RevealItem>
                );
              })}
            </RevealGroup>

            <Suspense
              fallback={
                <ChunkSectionFallback
                  label="Loading interactive architecture spotlight..."
                  minHeight={260}
                  className="mt-8"
                />
              }
            >
              <Reveal delay={0.12}>
                <LazyFeatureSpotlightDeck
                  activeId={activeFeatureModule}
                  onSelectId={setActiveFeatureModule}
                  onLaunchDemo={() => handleAuthSubmit(undefined, 'demo')}
                />
              </Reveal>
            </Suspense>
          </LazySection>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <MeanderDivider opacity={0.35} />
        </div>

        {/* ================================================================
            SECTION II: HOW IT WORKS (3 connected steps)
            ================================================================ */}
        <section
          id="how-it-works"
          className="relative py-14 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto"
        >
          <SectionBackdropNumeral numeral="II" />
          <Reveal className="mb-12 space-y-3">
            <div className="inline-flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-g-border bg-g-surfaceElevated font-cinzel text-[12px] font-bold text-g-text flex items-center justify-center">
                II
              </span>
              <span className="text-[12px] uppercase tracking-[0.08em] text-g-textMuted font-medium">
                How it works
              </span>
            </div>
            <RevealWords
              as="h2"
              text="From raw tags to shift decisions"
              staggerDelay={0.04}
              className="font-cinzel text-[28px] sm:text-[36px] font-bold text-g-text leading-tight"
            />
            <RevealText delay={0.1} className="text-[16px] text-g-textSecondary leading-[1.6] max-w-[65ch]">
              Deploy non-invasively beside existing plant controls in three direct stages.
            </RevealText>
          </Reveal>

          <LazySection
            forceMount={Boolean(hydratedSections['how-it-works'])}
            label="Loading deployment workflow..."
            minHeight={240}
          >
            <div className="relative">
              {/* Scroll-drawn connecting line behind step cards on desktop */}
              <motion.div
                initial={shouldReduce ? { scaleX: 1 } : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={viewportOnce}
                transition={{ duration: 0.85, ease }}
                style={{ transformOrigin: 'left' }}
                className="hidden md:block absolute top-11 left-12 right-12 h-px bg-g-border z-0"
                aria-hidden="true"
              />

              <RevealGroup
                staggerDelay={0.06}
                className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {DEMO_DATA.steps.map((step) => (
                  <RevealItem key={step.numeral} variant="grid" className="h-full">
                    <StepCard
                      numeral={step.numeral}
                      title={step.title}
                      subtitle={step.subtitle}
                      description={step.description}
                    />
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </LazySection>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <MeanderDivider opacity={0.35} />
        </div>

        {/* ================================================================
            SECTION III: ARCHITECTURE (Edge -> Ingestion -> Analytics)
            ================================================================ */}
        <section
          id="architecture"
          className="relative py-14 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto"
        >
          <SectionBackdropNumeral numeral="III" />
          <Reveal className="mb-12 space-y-3">
            <div className="inline-flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-g-border bg-g-surfaceElevated font-cinzel text-[12px] font-bold text-g-text flex items-center justify-center">
                III
              </span>
              <span className="text-[12px] uppercase tracking-[0.08em] text-g-textMuted font-medium">
                Architecture
              </span>
            </div>
            <RevealWords
              as="h2"
              text="Three-tier industrial data pipeline"
              staggerDelay={0.04}
              className="font-cinzel text-[28px] sm:text-[36px] font-bold text-g-text leading-tight"
            />
            <RevealText delay={0.1} className="text-[16px] text-g-textSecondary leading-[1.6] max-w-[65ch]">
              Built to separate plant-floor polling cleanly from storage and visualization.
            </RevealText>
          </Reveal>

          <LazySection
            forceMount={Boolean(hydratedSections.architecture)}
            label="Loading three-tier architecture..."
            minHeight={240}
          >
            <RevealGroup
              staggerDelay={0.06}
              className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 lg:gap-5 items-stretch"
            >
              {DEMO_DATA.tiers.map((tier, idx) => (
                <React.Fragment key={tier.title}>
                  <RevealItem variant="grid" className="h-full">
                    <TierCard
                      tierLabel={tier.tierLabel}
                      title={tier.title}
                      description={tier.description}
                      detail={tier.detail}
                      highlight={tier.highlight}
                    />
                  </RevealItem>

                  {idx < DEMO_DATA.tiers.length - 1 && (
                    <div
                      className="flex items-center justify-center py-2 lg:py-0 text-g-blue"
                      aria-hidden="true"
                    >
                      <div className="relative flex items-center justify-center w-8 h-8 lg:w-12 lg:h-6">
                        <span className="hidden lg:block w-full h-px bg-g-border" />
                        <span className="lg:hidden h-full w-px bg-g-border" />
                        {!shouldReduce && isDocVisible && (
                          <>
                            <motion.span
                              animate={{ x: [-14, 14], opacity: [0, 1, 0] }}
                              transition={{
                                duration: 1.8,
                                repeat: Infinity,
                                ease: 'linear',
                                delay: idx * 0.45,
                              }}
                              className="hidden lg:block absolute w-2 h-2 rounded-full bg-g-blue"
                            />
                            <motion.span
                              animate={{ y: [-10, 10], opacity: [0, 1, 0] }}
                              transition={{
                                duration: 1.8,
                                repeat: Infinity,
                                ease: 'linear',
                                delay: idx * 0.45,
                              }}
                              className="lg:hidden absolute w-2 h-2 rounded-full bg-g-blue"
                            />
                          </>
                        )}
                        <svg
                          className="relative z-10 w-4 h-4 rotate-90 lg:rotate-0 bg-g-bg rounded-full p-0.5 text-g-textSecondary"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </RevealGroup>
          </LazySection>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <MeanderDivider opacity={0.35} />
        </div>

        {/* ================================================================
            SECTION IV: INTERACTIVE SIGNAL LAB & OEE WHAT-IF WORKBENCH
            ================================================================ */}
        <section
          id="signal-lab"
          className="relative py-14 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto"
        >
          <SectionBackdropNumeral numeral="IV" />
          <Reveal className="mb-10 space-y-3">
            <div className="inline-flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-g-border bg-g-surfaceElevated font-cinzel text-[12px] font-bold text-g-text flex items-center justify-center">
                IV
              </span>
              <span className="text-[12px] uppercase tracking-[0.08em] text-g-textMuted font-medium">
                Signal Lab
              </span>
            </div>
            <RevealWords
              as="h2"
              text="Simulate equipment behavior before deployment"
              staggerDelay={0.04}
              className="font-cinzel text-[28px] sm:text-[36px] font-bold text-g-text leading-tight"
            />
            <RevealText delay={0.1} className="text-[16px] text-g-textSecondary leading-[1.6] max-w-[65ch]">
              Test high-speed boost, bearing wear drift, or thermal interlock states and watch SynapSYS compute live OEE and financial impact in real time.
            </RevealText>
          </Reveal>

          <LazySection
            forceMount={Boolean(hydratedSections['signal-lab'])}
            label="Loading interactive telemetry bench chunk..."
            minHeight={360}
          >
            <Reveal delay={0.08}>
              <LazyTelemetrySandboxLab onLaunchDemo={() => handleAuthSubmit(undefined, 'demo')} />
            </Reveal>
          </LazySection>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <MeanderDivider opacity={0.35} />
        </div>

        {/* ================================================================
            SECTION V: LIVE KPIS (4 Stat Cards, Demo data)
            ================================================================ */}
        <section
          id="kpis"
          className="relative py-14 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto"
        >
          <SectionBackdropNumeral numeral="V" />
          <Reveal className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full border border-g-border bg-g-surfaceElevated font-cinzel text-[12px] font-bold text-g-text flex items-center justify-center">
                  V
                </span>
                <span className="text-[12px] uppercase tracking-[0.08em] text-g-textMuted font-medium">
                  Live KPIs
                </span>
              </div>
              <RevealWords
                as="h2"
                text="Measurable output across every shift"
                staggerDelay={0.04}
                className="font-cinzel text-[28px] sm:text-[36px] font-bold text-g-text leading-tight"
              />
              <RevealText delay={0.1} className="text-[16px] text-g-textSecondary leading-[1.6] max-w-[65ch]">
                Standardized metrics summarize performance consistently across heterogeneous lines.
              </RevealText>
            </div>

            <span className="self-start sm:self-end px-3 py-1 rounded-[4px] bg-g-surfaceElevated border border-g-border text-[12px] font-medium text-g-textSecondary">
              Demo data
            </span>
          </Reveal>

          <LazySection
            forceMount={Boolean(hydratedSections.kpis)}
            label="Loading KPI summary chunk..."
            minHeight={200}
          >
            <RevealGroup
              staggerDelay={0.06}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {DEMO_DATA.kpis.map((kpi) => (
                <RevealItem key={kpi.id} variant="grid">
                  <SpotlightCard
                    surface={false}
                    notch={false}
                    className="lp-notch-card p-6 h-full flex flex-col justify-between"
                  >
                    <div>
                      <AnimatedNumber
                        value={kpi.value}
                        decimals={kpi.decimals}
                        suffix={kpi.suffix}
                        className="font-cinzel text-[32px] font-bold text-g-text leading-none"
                      />
                      <p className="text-[15px] font-medium text-g-textSecondary mt-3">
                        {kpi.label}
                      </p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-g-borderSubtle text-[12px] text-g-textMuted">
                      {kpi.note}
                    </div>
                  </SpotlightCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </LazySection>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <MeanderDivider opacity={0.35} />
        </div>

        {/* ================================================================
            SECTION VI: FINAL CALL TO ACTION
            ================================================================ */}
        <section className="relative py-14 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          <SectionBackdropNumeral numeral="VI" />
          <Reveal className="lp-notch-card p-8 sm:p-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <span className="w-6 h-6 rounded-full border border-g-border bg-g-surfaceElevated font-cinzel text-[12px] font-bold text-g-text flex items-center justify-center">
                VI
              </span>
              <span className="text-[12px] uppercase tracking-[0.08em] text-g-textMuted font-medium">
                Get started
              </span>
            </div>

            <RevealWords
              as="h2"
              text={DEMO_DATA.cta.title}
              staggerDelay={0.04}
              className="font-cinzel text-[28px] sm:text-[36px] font-bold text-g-text leading-tight"
            />
            <RevealText delay={0.1} className="text-[16px] text-g-textSecondary leading-[1.6] max-w-[55ch] mx-auto mt-3">
              {DEMO_DATA.cta.subtitle}
            </RevealText>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <MotionButton
                primary
                type="button"
                onClick={handleOpenLogin}
                className="h-12 px-7 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white text-[15px] font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
              >
                <span>{DEMO_DATA.cta.primary}</span>
              </MotionButton>

              <MotionButton
                type="button"
                onClick={() => handleAuthSubmit(undefined, 'demo')}
                className="h-12 px-6 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle text-g-text text-[15px] font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
              >
                <span>{DEMO_DATA.cta.secondary}</span>
              </MotionButton>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Meander Fretwork Strip Above Footer */}
      <div className="w-full relative z-10">
        <MeanderDivider opacity={0.45} />
      </div>

      {/* Simple Generic Footer */}
      <footer className="relative z-10 border-t border-g-border bg-g-surfaceSubtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <RevealGroup
            staggerDelay={0.05}
            className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-g-borderSubtle"
          >
            <RevealItem variant="grid" className="md:col-span-5 space-y-3">
              <SynapsysLogo
                variant="horizontal"
                size="md"
                isDarkMode={isDarkMode}
              />
              <p className="text-[14px] text-g-textSecondary leading-[1.6] max-w-[40ch]">
                Industrial telemetry, live OEE analytics, and spatial asset visibility for modern plants.
              </p>
            </RevealItem>

            <RevealItem variant="grid" className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {DEMO_DATA.footerColumns.map((col) => (
                <div key={col.heading} className="space-y-3">
                  <h3 className="font-cinzel text-[13px] font-semibold text-g-text tracking-wide">
                    {col.heading}
                  </h3>
                  <ul className="space-y-2 text-[14px] text-g-textSecondary">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(link.target)}
                          className="hover:text-g-text transition-colors cursor-pointer"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </RevealItem>
          </RevealGroup>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-g-textMuted">
            <span>© {new Date().getFullYear()} {DEMO_DATA.brand}. All rights reserved.</span>
            <span>Simulated public showcase</span>
          </div>
        </div>
      </footer>

      {/* Sign In Modal Dialog (Preserved Auth Flow) */}
      <MotionModal
        isOpen={showLoginModal}
        onBackdropClick={() => setShowLoginModal(false)}
        backdropClassName="fixed inset-0 z-50 bg-g-bg/80 backdrop-blur-md flex items-center justify-center p-4"
        panelClassName="lp-notch-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-g-surface border border-g-border shadow-2xl relative"
      >
        <button
          type="button"
          onClick={() => setShowLoginModal(false)}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 w-8 h-8 rounded-[8px] text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <SynapsysLogo variant="icon" size="md" isDarkMode={isDarkMode} />
          <div>
            <h3 className="font-cinzel font-bold text-[18px] text-g-text">
              Workspace access
            </h3>
            <p className="text-[13px] text-g-textSecondary">
              {modalAuthMode === 'otp_verify'
                ? 'Enter 2-Factor Authentication Code'
                : modalAuthMode === 'signup'
                ? 'Create company account with 2FA'
                : 'Sign in to open the live dashboard'}
            </p>
          </div>
        </div>

        {/* Tab switcher: Sign In vs Sign Up */}
        {modalAuthMode !== 'otp_verify' && (
          <div className="grid grid-cols-2 p-1 mb-5 rounded-[8px] bg-g-surfaceElevated border border-g-border">
            <button
              type="button"
              onClick={() => {
                setModalAuthMode('signin');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`py-1.5 text-[13px] font-medium rounded-[6px] transition-all cursor-pointer ${
                modalAuthMode === 'signin'
                  ? 'bg-g-blue text-white shadow-sm'
                  : 'text-g-textSecondary hover:text-g-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setModalAuthMode('signup');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`py-1.5 text-[13px] font-medium rounded-[6px] transition-all cursor-pointer ${
                modalAuthMode === 'signup'
                  ? 'bg-g-blue text-white shadow-sm'
                  : 'text-g-textSecondary hover:text-g-text'
              }`}
            >
              Sign Up (2FA)
            </button>
          </div>
        )}

        {authError && (
          <div className="mb-4 p-3 rounded-[6px] bg-g-redLight border border-g-red/40 text-g-red text-[13px]">
            {authError}
          </div>
        )}

        {authSuccess && (
          <div className="mb-4 p-3 rounded-[6px] bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[13px]">
            {authSuccess}
          </div>
        )}

        {modalAuthMode === 'otp_verify' ? (
          <form onSubmit={handleModalVerify2FA} className="space-y-4">
            <div className="p-3 rounded-[6px] bg-g-blue/10 border border-g-blue/30 text-[12px] text-g-textSecondary leading-relaxed">
              A 6-digit 2FA code was generated and sent to the supervisor email{' '}
              <strong className="text-g-text font-mono">sarveshwaran.k2008@gmail.com</strong>{' '}
              for company <strong className="text-g-text">{companyName || 'SynapSYS Enterprise'}</strong>.
            </div>

            {otpHint && (
              <div className="p-2.5 rounded-[6px] bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center justify-between">
                <span>Security Alert / OTP: <strong>{otpHint}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpCode(otpHint)}
                  className="underline hover:text-white cursor-pointer ml-2"
                >
                  Autofill
                </button>
              </div>
            )}

            <div>
              <label htmlFor="modal-otp" className="block text-[13px] font-medium text-g-textSecondary mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                id="modal-otp"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-[4px] bg-g-surfaceElevated border border-g-border text-g-text text-[18px] tracking-[0.3em] text-center font-mono focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
                placeholder="000000"
                required
              />
            </div>

            <MotionButton
              primary
              loading={isLoading}
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white text-[14px] font-medium cursor-pointer"
            >
              {isLoading ? 'Verifying...' : 'Verify 2FA & Launch Workspace →'}
            </MotionButton>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalAuthMode('signup');
                  setOtpCode('');
                  setAuthError(null);
                }}
                className="text-[12px] text-g-textMuted hover:text-g-text transition-colors cursor-pointer"
              >
                ← Edit sign-up details
              </button>
            </div>
          </form>
        ) : modalAuthMode === 'signup' ? (
          <form onSubmit={(e) => handleAuthSubmit(e)} className="space-y-3.5">
            <div>
              <label htmlFor="modal-signup-name" className="block text-[13px] font-medium text-g-textSecondary mb-1">
                Full Name
              </label>
              <input
                id="modal-signup-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-g-surfaceElevated border border-g-border text-g-text text-[14px] focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
                placeholder="Sarveshwaran K"
              />
            </div>

            <div>
              <label htmlFor="modal-signup-company" className="block text-[13px] font-medium text-g-textSecondary mb-1">
                Company / Plant Name
              </label>
              <input
                id="modal-signup-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-g-surfaceElevated border border-g-border text-g-text text-[14px] focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
                placeholder="e.g. Coimbatore Tooling & Die Works"
              />
              <span className="text-[11px] text-g-textMuted mt-0.5 block">
                Provisions a distinct, isolated industrial dashboard with your company branding.
              </span>
            </div>

            <div>
              <label htmlFor="modal-signup-email" className="block text-[13px] font-medium text-g-textSecondary mb-1">
                Work Email
              </label>
              <input
                id="modal-signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-g-surfaceElevated border border-g-border text-g-text text-[14px] focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
                placeholder="operator@coimbatoretooling.in"
                required
              />
            </div>

            <div>
              <label htmlFor="modal-signup-password" className="block text-[13px] font-medium text-g-textSecondary mb-1">
                Password
              </label>
              <input
                id="modal-signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-g-surfaceElevated border border-g-border text-g-text text-[14px] focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-1">
              <MotionButton
                primary
                loading={isLoading}
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white text-[14px] font-medium cursor-pointer"
              >
                {isLoading ? 'Sending Security Code...' : 'Send 2FA Security Code →'}
              </MotionButton>
            </div>

            <p className="text-[11px] text-g-textMuted text-center leading-relaxed">
              A 2FA code & notification will be dispatched to <strong>sarveshwaran.k2008@gmail.com</strong>.
            </p>
          </form>
        ) : (
          <div>
            <div className="mb-6 space-y-2.5">
              <span className="block text-[12px] font-medium uppercase tracking-[0.08em] text-g-textMuted">
                Demo access
              </span>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleAuthSubmit(undefined, 'demo')}
                className="w-full h-10 px-4 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white text-[14px] font-medium cursor-pointer transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
              >
                Enter Demo Mode
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleAuthSubmit(undefined, 'operator')}
                className="w-full h-10 px-4 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle text-g-text text-[14px] font-medium cursor-pointer transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue"
              >
                Sign in as Shift Operator
              </button>
            </div>

            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-g-border" />
              </div>
              <span className="relative bg-g-surface px-3 text-[13px] text-g-textMuted">
                or account credentials
              </span>
            </div>

            <form onSubmit={(e) => handleAuthSubmit(e)} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[13px] font-medium text-g-textSecondary mb-1.5"
                >
                  Work email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-g-surfaceElevated border border-g-border text-g-text text-[14px] focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[13px] font-medium text-g-textSecondary mb-1.5"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[4px] bg-g-surfaceElevated border border-g-border text-g-text text-[14px] focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
                  placeholder="••••••••"
                  required
                />
              </div>

              <MotionButton
                primary
                loading={isLoading}
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white text-[14px] font-medium cursor-pointer"
              >
                {isLoading ? 'Signing in...' : 'Open dashboard'}
              </MotionButton>
            </form>
          </div>
        )}
      </MotionModal>
    </div>
  );
};

export default HomePage;
