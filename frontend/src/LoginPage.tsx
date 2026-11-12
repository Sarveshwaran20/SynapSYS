import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AuthSession, UserRole } from './types';
import {
  authenticateWorkspace,
  initiate2FASignup,
  verify2FASignup,
} from './lib/auth';
import { SynapsysLogo } from './SynapsysLogo';
import { dur, ease } from './lib/motion';
import {
  MotionButton,
  RevealGroup,
  RevealItem,
  RevealText,
  RevealWords,
} from './components/motion';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onBackHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  isDarkMode = true,
  onToggleTheme,
  onBackHome,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'otp_verify'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const shouldReduce = useReducedMotion();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await authenticateWorkspace({ email, password });
      onLoginSuccess(session);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Authentication failed. Please check credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both your work email and password.');
      return;
    }
    if (password.trim().length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
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

      setSuccessMessage(
        `2FA Security code dispatched to ${res.recipient}! An alert was sent stating ${fullName || email} is signing up.`
      );
      if (res.debug_otp_hint) {
        setOtpHint(res.debug_otp_hint);
      }
      setMode('otp_verify');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to dispatch 2FA security email. Try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setErrorMessage('Please enter the verification code sent to the company email.');
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

      setSuccessMessage('2FA Verified! Provisioning isolated company twin and signing in...');
      setTimeout(() => {
        onLoginSuccess(session);
      }, 700);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid verification code. Please check and retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = async (role: Extract<UserRole, 'demo' | 'operator'>) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const session = await authenticateWorkspace({
        email: '',
        password: '',
        directRole: role,
      });
      onLoginSuccess(session);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-g-bg text-g-text flex flex-col justify-between relative overflow-x-clip font-sans select-none transition-colors duration-200">
      {/* Subtle Engineering Blueprint Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 hero-blueprint-grid opacity-35" />
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full hero-ambient-glow-blue opacity-40" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full hero-ambient-glow-purple opacity-30" />
      </div>

      {/* Top Professional Navigation Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-g-border bg-g-surface/92 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          {onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="px-3 py-1.5 rounded-[6px] border border-g-border bg-g-surfaceElevated hover:border-g-blue text-[13px] text-g-textSecondary hover:text-g-text transition-colors cursor-pointer"
            >
              ← Overview
            </button>
          )}
          <SynapsysLogo variant="horizontal" size="md" isDarkMode={isDarkMode} />
        </div>

        <div className="flex items-center gap-3 text-[13px] font-sans text-g-textSecondary">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-[2px] bg-g-green"></span>
            <span className="text-g-text">SQLite + Firebase Cloud Ready</span>
          </div>
          <span className="hidden sm:inline text-g-border">|</span>
          <span className="hidden sm:inline text-g-textSecondary font-cinzel font-semibold text-[13px] tracking-wider">
            2FA Security Active
          </span>
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="w-9 h-9 rounded-[6px] border border-g-border bg-g-surfaceElevated hover:border-g-blue text-g-textSecondary hover:text-g-text flex items-center justify-center transition-colors cursor-pointer"
            >
              {isDarkMode ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Login / Sign Up Card Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 z-10">
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.base, ease }}
          className="w-full max-w-md lp-notch-card bg-g-surface border border-g-border border-t-2 border-t-g-blue rounded-[4px] shadow-2xl p-6 sm:p-8 relative"
        >
          {/* Form Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3">
              <SynapsysLogo variant="icon" size="lg" isDarkMode={isDarkMode} />
            </div>
            <RevealWords
              immediate
              as="h1"
              text={
                mode === 'signin'
                  ? 'Workspace Sign In'
                  : mode === 'signup'
                  ? 'Create Workspace Account'
                  : 'Two-Factor Authentication'
              }
              staggerDelay={0.045}
              delayChildren={0.04}
              className="text-xl font-bold text-g-text tracking-wider font-cinzel uppercase"
            />
            <RevealText immediate delay={0.12} className="text-sm text-g-textSecondary mt-1 font-sans">
              {mode === 'signin'
                ? "Enter your credentials to access your plant's supervisory workspace"
                : mode === 'signup'
                ? 'Register your organization with automated 2FA security dispatch'
                : 'Security code dispatched to company security supervisor'}
            </RevealText>

            {/* Mode Switcher Tabs */}
            {mode !== 'otp_verify' && (
              <div className="mt-4 flex p-1 bg-g-surfaceElevated border border-g-border rounded-lg max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-g-surface border border-g-border text-g-blue shadow-sm'
                      : 'text-g-textSecondary hover:text-g-text'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-g-surface border border-g-border text-g-blue shadow-sm'
                      : 'text-g-textSecondary hover:text-g-text'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-[4px] bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[13px] flex items-start gap-2 font-sans">
              <svg className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-[4px] bg-g-redLight border border-g-red/40 text-g-red text-[13px] flex items-center gap-2 font-sans">
              <svg className="w-4 h-4 text-g-red flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* OTP Hint Alert for Development / Testing */}
          {otpHint && mode === 'otp_verify' && (
            <div className="mb-4 p-3 rounded-[4px] bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[12px] font-mono flex items-center justify-between">
              <span>Security OTP Preview:</span>
              <strong className="text-sm font-bold tracking-widest">{otpHint}</strong>
            </div>
          )}

          {/* 1. OTP Verification Form */}
          {mode === 'otp_verify' ? (
            <form onSubmit={handleVerify2FA}>
              <RevealGroup immediate staggerDelay={0.05} delayChildren={0.08} className="space-y-4">
                <RevealItem>
                  <div className="p-3.5 rounded-lg bg-g-surfaceElevated border border-g-border space-y-1.5 text-xs">
                    <div className="flex justify-between text-g-textSecondary font-mono">
                      <span>Candidate:</span>
                      <strong className="text-g-text">{fullName || email}</strong>
                    </div>
                    <div className="flex justify-between text-g-textSecondary font-mono">
                      <span>Company:</span>
                      <strong className="text-g-text">{companyName || 'Industrial Facility'}</strong>
                    </div>
                    <div className="flex justify-between text-g-textSecondary font-mono">
                      <span>Alert Sent To:</span>
                      <span className="text-g-blue truncate max-w-[210px]">sarveshwaran.k2008@gmail.com</span>
                    </div>
                  </div>
                </RevealItem>

                <RevealItem>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1.5 font-sans">
                    Enter 6-Digit 2FA Code
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
                  />
                </RevealItem>

                <RevealItem>
                  <MotionButton
                    primary
                    loading={isLoading}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isLoading ? 'Verifying 2FA...' : 'Verify & Launch Workspace →'}
                  </MotionButton>
                </RevealItem>

                <RevealItem>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage(null);
                    }}
                    className="w-full text-center text-xs text-g-textSecondary hover:text-g-text font-mono cursor-pointer pt-1"
                  >
                    ← Edit Details / Cancel Request
                  </button>
                </RevealItem>
              </RevealGroup>
            </form>
          ) : (
            /* 2. Sign In or Sign Up Form */
            <form onSubmit={mode === 'signup' ? handleInitiateSignUp : handleSignIn}>
              <RevealGroup immediate staggerDelay={0.05} delayChildren={0.1} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <RevealItem>
                      <label className="block text-[13px] font-semibold text-g-textSecondary mb-1.5 font-sans">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2.5 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition-all font-sans placeholder:text-g-textMuted/60"
                      />
                    </RevealItem>

                    <RevealItem>
                      <label className="block text-[13px] font-semibold text-g-textSecondary mb-1.5 font-sans">
                        Company / Organization Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Coimbatore Precision Pumps Ltd"
                        className="w-full px-3 py-2.5 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition-all font-sans placeholder:text-g-textMuted/60"
                      />
                    </RevealItem>
                  </>
                )}

                <RevealItem>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1.5 font-sans">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-g-textMuted">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="director@coimbatoretooling.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition-all font-sans placeholder:text-g-textMuted/60"
                    />
                  </div>
                </RevealItem>

                <RevealItem>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[13px] font-semibold text-g-textSecondary font-sans">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[13px] text-g-blue hover:text-g-blueHover transition-colors font-sans cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-g-textMuted">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition-all font-sans placeholder:text-g-textMuted/60"
                    />
                  </div>
                </RevealItem>

                {/* 2FA Dispatch Notice */}
                {mode === 'signup' && (
                  <RevealItem className="p-3 rounded-[4px] bg-g-surfaceElevated border border-g-border text-g-textSecondary text-[13px] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-g-blue mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-g-text font-cinzel">2FA Company Dispatch:</strong> Submitting will send an immediate verification alert &amp; code to company supervisor (<span className="text-g-blue font-mono">sarveshwaran.k2008@gmail.com</span>).
                      </span>
                    </div>
                  </RevealItem>
                )}

                {/* Submit Button */}
                <RevealItem>
                  <MotionButton
                    primary
                    loading={isLoading}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 transition-colors shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        <span>{mode === 'signup' ? 'Sending 2FA Code...' : 'Authenticating...'}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        <span>{mode === 'signup' ? 'Send 2FA Code →' : 'Sign In to Workspace'}</span>
                      </>
                    )}
                  </MotionButton>
                </RevealItem>
              </RevealGroup>
            </form>
          )}

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-g-border" />
            </div>
            <span className="relative bg-g-surface px-3 text-[12px] uppercase tracking-wider text-g-textMuted">
              or demo exploration
            </span>
          </div>

          <RevealGroup immediate staggerDelay={0.06} delayChildren={0.22} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <RevealItem variant="grid">
              <MotionButton
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemoAccess('demo')}
                className="w-full py-2.5 px-3 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:border-g-blue hover:bg-g-surfaceSubtle text-g-text font-medium text-[13px] transition-colors cursor-pointer disabled:opacity-50"
              >
                Continue in Demo Mode
              </MotionButton>
            </RevealItem>
            <RevealItem variant="grid">
              <MotionButton
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemoAccess('operator')}
                className="w-full py-2.5 px-3 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:border-g-blue hover:bg-g-surfaceSubtle text-g-textSecondary hover:text-g-text font-medium text-[13px] transition-colors cursor-pointer disabled:opacity-50"
              >
                Shift Operator Demo
              </MotionButton>
            </RevealItem>
          </RevealGroup>
        </motion.div>
      </main>

      {/* Corporate Standards Footer */}
      <footer className="w-full px-6 py-4 border-t border-g-border bg-g-surface flex flex-wrap items-center justify-between gap-3 text-[13px] text-g-textSecondary font-sans z-10">
        <div>
          <span className="text-g-text font-medium">SynapSYS Enterprise Manufacturing Platform</span>
          <span className="mx-2 text-g-border">•</span>
          <span>Google Cloud Firestore + Multi-Tenant 2FA</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px]">
          <span>ISO-22400 (OEE)</span>
          <span className="text-g-border">•</span>
          <span>ISA-95 (MES)</span>
          <span className="text-g-border">•</span>
          <span>ISA-18.2 (Alarms)</span>
          <span className="text-g-border">•</span>
          <span>IEC-62541 (OPC-UA)</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
