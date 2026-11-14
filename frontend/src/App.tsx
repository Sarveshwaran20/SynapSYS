import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChunkRouteFallback, PageTransition } from './components/motion';
import { useDynamicFavicon } from './lib/favicon';
import { AuthSession, UserProfile } from './types';

const LazyHomePage = lazy(() =>
  import('./HomePage').then((m) => ({ default: m.HomePage }))
);
const LazyLoginPage = lazy(() =>
  import('./LoginPage').then((m) => ({ default: m.LoginPage }))
);
const LazyAuthLoadingPage = lazy(() =>
  import('./components/AuthLoadingPage').then((m) => ({
    default: m.AuthLoadingPage,
  }))
);
const LazyDashboardWorkspace = lazy(() => import('./DashboardWorkspace'));
const LazyPlantSetupOnboarding = lazy(() =>
  import('./components/onboarding/PlantSetupOnboarding').then((m) => ({
    default: m.PlantSetupOnboarding,
  }))
);

function getSavedFacilityName(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const projectId = localStorage.getItem('synapsys_current_project');
    const rawSites = localStorage.getItem('synapsys_production_sites');
    if (!rawSites) return undefined;
    const parsed = JSON.parse(rawSites);
    if (!Array.isArray(parsed)) return undefined;
    const match = projectId
      ? parsed.find((s: { id?: string; name?: string }) => s?.id === projectId)
      : parsed[0];
    return typeof match?.name === 'string' ? match.name : undefined;
  } catch {
    return undefined;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synapsys_auth_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore invalid stored payload
        }
      }
    }
    return null;
  });

  const [authTransitionSession, setAuthTransitionSession] =
    useState<AuthSession | null>(null);
  const [authLoadProgress, setAuthLoadProgress] = useState<number>(0);
  const [authLoadStage, setAuthLoadStage] = useState<number>(0);
  const [showPublicShowcase, setShowPublicShowcase] = useState<boolean>(false);
  const [isLoginRoute, setIsLoginRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname === '/login' ||
      window.location.search.includes('page=login') ||
      window.location.hash === '#login'
    );
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synapsys_theme');
      if (saved) return saved === 'dark';
      return true;
    }
    return true;
  });

  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const syncRoute = () => {
      setIsLoginRoute(
        window.location.pathname === '/login' ||
          window.location.search.includes('page=login') ||
          window.location.hash === '#login'
      );
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('synapsys_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('synapsys_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const beginAuthenticatedTransition = useCallback((session: AuthSession) => {
    // Warm up the dashboard workspace chunk while the animated boot loader plays
    void import('./DashboardWorkspace');
    setAuthLoadProgress(16);
    setAuthLoadStage(0);
    setAuthTransitionSession(session);
    setShowPublicShowcase(false);
    setIsLoginRoute(false);
    if (
      typeof window !== 'undefined' &&
      (window.location.pathname === '/login' ||
        window.location.search.includes('page=login') ||
        window.location.hash === '#login')
    ) {
      window.history?.replaceState?.(null, '', '/');
    }
    setCurrentUser(session.user);
  }, []);

  const openFullLoginPage = useCallback(() => {
    void import('./LoginPage');
    setIsLoginRoute(true);
    if (typeof window !== 'undefined') {
      window.history?.pushState?.(null, '', '/login');
    }
  }, []);

  const backToOverviewPage = useCallback(() => {
    setIsLoginRoute(false);
    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      window.history?.pushState?.(null, '', '/');
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore offline logout failures
    }
    localStorage.removeItem('synapsys_auth_token');
    localStorage.removeItem('synapsys_auth_user');
    localStorage.removeItem('synapsys_production_sites');
    localStorage.removeItem('synapsys_current_project');
    setAuthTransitionSession(null);
    setAuthLoadProgress(0);
    setAuthLoadStage(0);
    setShowPublicShowcase(false);
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    if (!authTransitionSession) return;
    let cancelled = false;

    if (shouldReduce) {
      setAuthLoadStage(3);
      setAuthLoadProgress(100);
      const quickTimer = window.setTimeout(() => {
        if (!cancelled) setAuthTransitionSession(null);
      }, 240);
      return () => {
        cancelled = true;
        window.clearTimeout(quickTimer);
      };
    }

    setAuthLoadStage(0);
    setAuthLoadProgress(16);

    const t1 = window.setTimeout(() => {
      if (cancelled) return;
      setAuthLoadStage(1);
      setAuthLoadProgress(42);
    }, 340);

    const t2 = window.setTimeout(() => {
      if (cancelled) return;
      setAuthLoadStage(2);
      setAuthLoadProgress(72);
    }, 780);

    const t3 = window.setTimeout(() => {
      if (cancelled) return;
      setAuthLoadStage(3);
      setAuthLoadProgress(92);
    }, 1240);

    const tDone = window.setTimeout(() => {
      if (cancelled) return;
      setAuthLoadStage(3);
      setAuthLoadProgress(100);
    }, 1620);

    const tExit = window.setTimeout(() => {
      if (cancelled) return;
      setAuthTransitionSession(null);
    }, 1900);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(tDone);
      window.clearTimeout(tExit);
    };
  }, [authTransitionSession, shouldReduce]);

  const showDashboardFavicon =
    Boolean(currentUser) && !authTransitionSession && !showPublicShowcase;

  useDynamicFavicon({
    enabled: !showDashboardFavicon,
    mode: authTransitionSession
      ? 'loading'
      : !currentUser && isLoginRoute
      ? 'login'
      : 'landing',
    status: authTransitionSession ? 'syncing' : 'nominal',
    isDarkMode,
  });

  if (authTransitionSession) {
    return (
      <Suspense fallback={<ChunkRouteFallback label="Initializing auth sequence..." />}>
        <PageTransition pageKey="page-auth-loading">
          <LazyAuthLoadingPage
            user={authTransitionSession.user}
            facilityName={getSavedFacilityName()}
            isDarkMode={isDarkMode}
            progress={authLoadProgress}
            activeStageIndex={authLoadStage}
          />
        </PageTransition>
      </Suspense>
    );
  }

  if (!currentUser && isLoginRoute) {
    return (
      <Suspense fallback={<ChunkRouteFallback label="Loading workspace sign-in..." />}>
        <PageTransition pageKey="page-login">
          <LazyLoginPage
            onLoginSuccess={beginAuthenticatedTransition}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            onBackHome={backToOverviewPage}
          />
        </PageTransition>
      </Suspense>
    );
  }

  if (!currentUser) {
    return (
      <Suspense fallback={<ChunkRouteFallback label="Loading SynapSYS overview..." />}>
        <PageTransition pageKey="page-home">
          <LazyHomePage
            onLoginSuccess={beginAuthenticatedTransition}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            onOpenFullLogin={openFullLoginPage}
          />
        </PageTransition>
      </Suspense>
    );
  }

  if (showPublicShowcase) {
    return (
      <Suspense fallback={<ChunkRouteFallback label="Loading public showcase..." />}>
        <PageTransition pageKey="page-showcase" className="relative">
          <div className="fixed top-3 right-3 sm:top-4 sm:right-6 z-50">
            <button
              onClick={() => setShowPublicShowcase(false)}
              className="px-3.5 sm:px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-medium text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Return to Dashboard</span>
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>
          <LazyHomePage
            onLoginSuccess={beginAuthenticatedTransition}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        </PageTransition>
      </Suspense>
    );
  }

  // Check if non-demo corporate organization requires initial plant setup and commissioning
  const isDemoWorkspace = currentUser.company_domain === 'synapsys.com';
  const needsPlantSetup = Boolean(
    !isDemoWorkspace &&
    (!currentUser.assigned_facility || currentUser.assigned_facility === '')
  );

  if (needsPlantSetup) {
    return (
      <Suspense fallback={<ChunkRouteFallback label="Loading plant setup wizard..." />}>
        <PageTransition pageKey="page-plant-onboarding">
          <LazyPlantSetupOnboarding
            currentUser={currentUser}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            onPlantCommissioned={(site) => {
              const updated = { ...currentUser, assigned_facility: site.id };
              setCurrentUser(updated);
              localStorage.setItem('synapsys_auth_user', JSON.stringify(updated));
              localStorage.setItem('synapsys_current_project', site.id);
              localStorage.setItem('synapsys_production_sites', JSON.stringify([site]));
            }}
          />
        </PageTransition>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ChunkRouteFallback label="Loading SCADA workspace chunk..." />}>
      <LazyDashboardWorkspace
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onOpenShowcase={() => setShowPublicShowcase(true)}
      />
    </Suspense>
  );
}
