import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { AuthSession, UserRole } from './types';
import {
  authenticateWorkspace,
  initiate2FASignup,
  verify2FASignup,
} from './lib/auth';
import { SynapsysLogo } from './SynapsysLogo';
import { dur, ease } from './lib/motion';
import { SingularityBackdrop } from './components/dashboard/SingularityBackdrop';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onBackHome?: () => void;
}

const formContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const formItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [-8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.45 },
  },
};

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
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shakeCard, setShakeCard] = useState(false);
  const [shakeOtp, setShakeOtp] = useState(false);
  const [emailDeliveryInfo, setEmailDeliveryInfo] = useState<{
    delivered: boolean;
    recipient: string;
    deliveryStatus?: string;
    deliveryMessage?: string;
    debugOtpHint?: string;
  } | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const shouldReduce = useReducedMotion();

  const triggerCardShake = () => {
    setShakeCard(true);
    setTimeout(() => setShakeCard(false), 500);
  };

  const triggerOtpShake = () => {
    setShakeOtp(true);
    setTimeout(() => setShakeOtp(false), 500);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both your work email and password.');
      triggerCardShake();
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
      triggerCardShake();
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
      triggerCardShake();
      return;
    }
    if (password.trim().length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      triggerCardShake();
      return;
    }

    setIsLoading(true);
    try {
      const res = await initiate2FASignup({
        email: email.trim(),
        password: password.trim(),
        fullName: fullName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        role: selectedRole,
      });

      setEmailDeliveryInfo({
        delivered: Boolean(res.delivered),
        recipient: res.recipient || 'sarveshwaran.k2008@gmail.com',
        deliveryStatus: res.delivery_status,
        deliveryMessage: res.delivery_message,
        debugOtpHint: res.debug_otp_hint,
      });

      if (res.delivered) {
        setSuccessMessage(
          `Security code dispatched to ${res.recipient} via SMTP. Please check your email inbox.`
        );
      } else {
        setSuccessMessage(null);
      }

      setOtpDigits(['', '', '', '', '', '']);
      setMode('otp_verify');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to initiate security registration. Please try again.'
      );
      triggerCardShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullCode = otpDigits.join('').trim();
    if (fullCode.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      triggerOtpShake();
      return;
    }

    setIsLoading(true);
    try {
      const session = await verify2FASignup({
        email: email.trim(),
        otpCode: fullCode,
        fullName: fullName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        role: selectedRole,
      });

      setSuccessMessage('Verification confirmed. Initializing plant workspace...');
      setTimeout(() => {
        onLoginSuccess(session);
      }, 700);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid verification code. Please check and retry.'
      );
      triggerOtpShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const next = [...otpDigits];
      chars.forEach((c, i) => {
        if (index + i < 6) next[index + i] = c;
      });
      setOtpDigits(next);
      const focusTarget = Math.min(5, index + chars.length);
      otpInputRefs.current[focusTarget]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = cleaned[0];
    setOtpDigits(next);

    if (index < 5 && cleaned) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
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
    <div
      className="min-h-screen w-full bg-g-bg text-g-text flex flex-col justify-between relative overflow-x-clip font-sans select-none transition-colors duration-200"
    >
      {/* Unified Industrial SCADA Animated Backdrop */}
      <SingularityBackdrop isDarkMode={isDarkMode} enabled={true} intensity={0.65} />

      {/* Subtle Ambient Vignette & Center Spotlight Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Top Professional Navigation Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-g-border bg-g-surface/92 backdrop-blur-md z-10 transition-colors">
        <div className="flex items-center gap-4">
          {onBackHome && (
            <motion.button
              whileHover={{ scale: 1.03, x: -2 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onBackHome}
              className="px-3 py-1.5 rounded-lg border border-g-border bg-g-surfaceElevated hover:border-g-blue text-[13px] text-g-textSecondary hover:text-g-text transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Overview</span>
            </motion.button>
          )}
          <SynapsysLogo variant="horizontal" size="md" isDarkMode={isDarkMode} />
        </div>

        <div className="flex items-center gap-3 text-[13px] font-sans text-g-textSecondary">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-g-surfaceElevated border border-g-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-g-text font-medium text-xs">System Operational</span>
          </div>
          <span className="hidden sm:inline text-g-border">|</span>
          <span className="hidden sm:inline text-g-textSecondary font-cinzel font-semibold text-[13px] tracking-wider">
            Enterprise Security
          </span>
          {onToggleTheme && (
            <motion.button
              whileHover={{ scale: 1.08, rotate: 15 }}
              whileTap={{ scale: 0.92, rotate: -15 }}
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="w-9 h-9 rounded-lg border border-g-border bg-g-surfaceElevated hover:border-g-blue text-g-textSecondary hover:text-g-text flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              {isDarkMode ? (
                <svg className="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </motion.button>
          )}
        </div>
      </header>

      {/* Main Login / Sign Up Card with Custom Transitions */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 z-10">
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={
            shakeCard
              ? { opacity: 1, y: 0, scale: 1, x: [-8, 8, -6, 6, -3, 3, 0] }
              : { opacity: 1, y: 0, scale: 1, x: 0 }
          }
          transition={{
            opacity: { duration: dur.base, ease },
            y: { duration: dur.base, ease },
            scale: { duration: dur.base, ease },
            x: { duration: 0.45 },
          }}
          className="w-full max-w-md bg-g-surface border border-g-border rounded-xl shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 hover:border-g-borderHover"
        >
          {/* High-tech top border beam shimmer animation */}
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden bg-g-border">
            <motion.div
              animate={shouldReduce ? undefined : { x: ['-100%', '200%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2/3 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            />
          </div>

          {/* Form Header */}
          <div className="text-center mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="inline-flex items-center justify-center mb-3"
            >
              <SynapsysLogo variant="icon" size="lg" isDarkMode={isDarkMode} />
            </motion.div>

            <motion.h1
              key={mode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-bold text-g-text tracking-wider font-cinzel uppercase"
            >
              {mode === 'signin'
                ? 'Workspace Sign In'
                : mode === 'signup'
                ? 'Create Workspace Account'
                : 'Security Verification'}
            </motion.h1>
            <p className="text-xs text-g-textSecondary mt-1 font-sans">
              {mode === 'signin'
                ? "Enter your credentials to access your plant's supervisory workspace"
                : mode === 'signup'
                ? 'Register your organization to provision plant workspace'
                : 'Enter the verification code sent to your authorized supervisor'}
            </p>

            {/* Custom Animated Mode Switcher Tabs */}
            {mode !== 'otp_verify' && (
              <div className="mt-5 relative flex p-1 bg-g-surfaceElevated border border-g-border rounded-lg max-w-xs mx-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`relative flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors z-10 cursor-pointer ${
                    mode === 'signin' ? 'text-g-blue font-bold' : 'text-g-textSecondary hover:text-g-text'
                  }`}
                >
                  {mode === 'signin' && (
                    <motion.div
                      layoutId="auth-tab-pill"
                      className="absolute inset-0 bg-g-surface border border-g-border rounded-md shadow-xs"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`relative flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors z-10 cursor-pointer ${
                    mode === 'signup' ? 'text-g-blue font-bold' : 'text-g-textSecondary hover:text-g-text'
                  }`}
                >
                  {mode === 'signup' && (
                    <motion.div
                      layoutId="auth-tab-pill"
                      className="absolute inset-0 bg-g-surface border border-g-border rounded-md shadow-xs"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">Sign Up</span>
                </button>
              </div>
            )}
          </div>

          {/* Animated Alerts */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                transition={{ duration: 0.25, ease }}
                className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 font-sans overflow-hidden shadow-xs"
              >
                <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{successMessage}</span>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                transition={{ duration: 0.25, ease }}
                className="mb-4 p-3 rounded-lg bg-g-redLight border border-g-red/40 text-g-red text-xs flex items-center gap-2 font-sans overflow-hidden shadow-xs"
              >
                <svg className="w-4 h-4 text-g-red shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Form Content */}
          <AnimatePresence mode="wait">
            {mode === 'otp_verify' ? (
              /* STEP 2: 2FA Verification Form */
              <motion.form
                key="otp_verify"
                onSubmit={handleVerify2FA}
                variants={formContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                {/* Delivery Telemetry HUD Card */}
                <motion.div
                  variants={formItemVariants}
                  className="p-3.5 rounded-lg bg-g-surfaceElevated border border-g-border space-y-2 text-xs font-mono"
                >
                  <div className="flex justify-between text-g-textSecondary">
                    <span>Supervisor:</span>
                    <strong className="text-cyan-300">sarveshwaran.k2008@gmail.com</strong>
                  </div>
                  <div className="flex justify-between text-g-textSecondary">
                    <span>Candidate:</span>
                    <strong className="text-g-text">{fullName || email}</strong>
                  </div>

                  {/* Delivery Status Indicator */}
                  {emailDeliveryInfo?.delivered ? (
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Live email dispatched to sarveshwaran.k2008@gmail.com via SMTP.</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] space-y-1 font-sans">
                      <div className="flex items-center justify-between font-mono">
                        <strong className="text-amber-300 uppercase tracking-wider text-[10px]">
                          Live SMTP Delivery: Unconfigured
                        </strong>
                      </div>
                      <p className="text-[11px] text-silver leading-relaxed">
                        No email was received at <strong className="text-marble">sarveshwaran.k2008@gmail.com</strong> because SMTP credentials (SMTP_USER/SMTP_PASS) are not set in .env. Enter verification code manually.
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* 6 Digit Segmented Cells with Autofill Disabled */}
                <motion.div variants={formItemVariants}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-g-textSecondary font-sans">
                      Enter 6-Digit Verification Code
                    </label>
                    <span className="text-[10px] font-mono text-silver/80">
                      Manual Entry Required
                    </span>
                  </div>
                  <motion.div
                    variants={shakeVariants}
                    animate={shakeOtp ? 'shake' : 'idle'}
                    className="flex justify-center gap-2"
                  >
                    {otpDigits.map((digit, idx) => (
                      <motion.input
                        key={idx}
                        ref={(el) => { otpInputRefs.current[idx] = el; }}
                        type="text"
                        name={`scada_2fa_digit_${idx}`}
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        whileFocus={{ scale: 1.08 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                        className={`w-11 h-12 text-center text-xl font-mono font-bold rounded-lg border bg-g-surfaceElevated text-g-text focus:outline-none transition-all shadow-xs ${
                          digit
                            ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-300 ring-2 ring-emerald-500/20'
                            : 'border-g-border focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25'
                        }`}
                      />
                    ))}
                  </motion.div>
                </motion.div>

                {/* Verify Button */}
                <motion.div variants={formItemVariants}>
                  <motion.button
                    whileHover={shouldReduce ? undefined : { scale: 1.015, boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)' }}
                    whileTap={shouldReduce ? undefined : { scale: 0.985 }}
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm overflow-hidden group"
                  >
                    {!shouldReduce && (
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                    )}
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <span>Verify &amp; Access Workspace →</span>
                    )}
                  </motion.button>
                </motion.div>

                <motion.div variants={formItemVariants}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage(null);
                    }}
                    className="w-full text-center text-xs text-g-textSecondary hover:text-g-text font-mono cursor-pointer pt-1 transition-colors"
                  >
                    ← Edit Registration Details
                  </button>
                </motion.div>
              </motion.form>
            ) : mode === 'signup' ? (
              /* STEP 1A: Sign Up Form */
              <motion.form
                key="signup"
                onSubmit={handleInitiateSignUp}
                variants={formContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <motion.div variants={formItemVariants}>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1 font-sans flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2.5 bg-g-surfaceElevated border border-g-border rounded-lg text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-2 focus:ring-g-blue/20 transition-all font-sans placeholder:text-g-textMuted/60 hover:border-g-borderHover shadow-xs"
                  />
                </motion.div>

                <motion.div variants={formItemVariants}>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1 font-sans flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01M8 3h8l2 4H6l2-4z" />
                    </svg>
                    <span>Company / Organization</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Coimbatore Precision Tooling"
                    className="w-full px-3.5 py-2.5 bg-g-surfaceElevated border border-g-border rounded-lg text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-2 focus:ring-g-blue/20 transition-all font-sans placeholder:text-g-textMuted/60 hover:border-g-borderHover shadow-xs"
                  />
                </motion.div>

                <motion.div variants={formItemVariants}>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1.5 font-sans flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Sign Up Role &amp; Authority *</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <motion.button
                      whileHover={shouldReduce ? undefined : { y: -2 }}
                      whileTap={shouldReduce ? undefined : { scale: 0.98 }}
                      type="button"
                      onClick={() => setSelectedRole('owner')}
                      className={`relative p-2.5 rounded-lg border text-left transition-all cursor-pointer overflow-hidden ${
                        selectedRole === 'owner'
                          ? 'border-g-blue bg-g-blue/15 text-g-text shadow-xs ring-1 ring-g-blue/30'
                          : 'border-g-border bg-g-surfaceElevated hover:border-g-borderHover text-g-textSecondary'
                      }`}
                    >
                      {selectedRole === 'owner' && (
                        <motion.div
                          layoutId="role-indicator-glow"
                          className="absolute inset-0 bg-g-blue/10 border-2 border-g-blue rounded-lg pointer-events-none"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold font-sans">Company Owner</span>
                        {selectedRole === 'owner' && <span className="w-2 h-2 rounded-full bg-g-blue" />}
                      </div>
                      <p className="relative z-10 text-[10px] text-g-textMuted leading-tight font-sans">
                        Authorizes plant setup &amp; full organization control
                      </p>
                    </motion.button>

                    <motion.button
                      whileHover={shouldReduce ? undefined : { y: -2 }}
                      whileTap={shouldReduce ? undefined : { scale: 0.98 }}
                      type="button"
                      onClick={() => setSelectedRole('manager')}
                      className={`relative p-2.5 rounded-lg border text-left transition-all cursor-pointer overflow-hidden ${
                        selectedRole === 'manager'
                          ? 'border-g-blue bg-g-blue/15 text-g-text shadow-xs ring-1 ring-g-blue/30'
                          : 'border-g-border bg-g-surfaceElevated hover:border-g-borderHover text-g-textSecondary'
                      }`}
                    >
                      {selectedRole === 'manager' && (
                        <motion.div
                          layoutId="role-indicator-glow"
                          className="absolute inset-0 bg-g-blue/10 border-2 border-g-blue rounded-lg pointer-events-none"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold font-sans">Plant Manager</span>
                        {selectedRole === 'manager' && <span className="w-2 h-2 rounded-full bg-g-blue" />}
                      </div>
                      <p className="relative z-10 text-[10px] text-g-textMuted leading-tight font-sans">
                        Authorizes plant setup &amp; facility operations
                      </p>
                    </motion.button>

                    <motion.button
                      whileHover={shouldReduce ? undefined : { y: -2 }}
                      whileTap={shouldReduce ? undefined : { scale: 0.98 }}
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={`relative p-2.5 rounded-lg border text-left transition-all cursor-pointer overflow-hidden ${
                        selectedRole === 'admin'
                          ? 'border-g-blue bg-g-blue/15 text-g-text shadow-xs ring-1 ring-g-blue/30'
                          : 'border-g-border bg-g-surfaceElevated hover:border-g-borderHover text-g-textSecondary'
                      }`}
                    >
                      {selectedRole === 'admin' && (
                        <motion.div
                          layoutId="role-indicator-glow"
                          className="absolute inset-0 bg-g-blue/10 border-2 border-g-blue rounded-lg pointer-events-none"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold font-sans">Plant Supervisor</span>
                        {selectedRole === 'admin' && <span className="w-2 h-2 rounded-full bg-g-blue" />}
                      </div>
                      <p className="relative z-10 text-[10px] text-g-textMuted leading-tight font-sans">
                        Authorizes plant setup &amp; shift supervisory control
                      </p>
                    </motion.button>
                  </div>
                  <p className="text-[11px] text-amber-500/90 font-sans mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>Owners, Managers &amp; Admins initialize and run the plant. Once active, staff can log in.</span>
                  </p>
                </motion.div>

                <motion.div variants={formItemVariants}>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1 font-sans flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>Work Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@coimbatoretooling.in"
                    className="w-full px-3.5 py-2.5 bg-g-surfaceElevated border border-g-border rounded-lg text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-2 focus:ring-g-blue/20 transition-all font-sans placeholder:text-g-textMuted/60 hover:border-g-borderHover shadow-xs"
                  />
                </motion.div>

                <motion.div variants={formItemVariants}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-semibold text-g-textSecondary font-sans flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Password *</span>
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-g-blue hover:text-g-blueHover transition-colors cursor-pointer font-medium"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </motion.button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-g-surfaceElevated border border-g-border rounded-lg text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-2 focus:ring-g-blue/20 transition-all font-sans placeholder:text-g-textMuted/60 hover:border-g-borderHover shadow-xs"
                  />
                </motion.div>

                {/* Security Verification Notice */}
                <motion.div
                  variants={formItemVariants}
                  className="p-3 rounded-lg bg-g-surfaceElevated border border-g-border text-g-textSecondary text-xs leading-relaxed font-sans shadow-xs"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 animate-pulse" />
                    <span>
                      <strong className="text-g-text font-cinzel">Supervisor Authorization:</strong> Registration creates your profile and dispatches a 6-digit confirmation code to supervisor (<span className="text-cyan-400 font-mono">sarveshwaran.k2008@gmail.com</span>).
                    </span>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={formItemVariants}>
                  <motion.button
                    whileHover={shouldReduce ? undefined : { scale: 1.015, boxShadow: '0 0 20px rgba(76, 141, 246, 0.35)' }}
                    whileTap={shouldReduce ? undefined : { scale: 0.985 }}
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full py-2.5 px-4 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm overflow-hidden group"
                  >
                    {!shouldReduce && (
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                    )}
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        <span>Creating Workspace Account...</span>
                      </>
                    ) : (
                      <span>Create Account &amp; Continue →</span>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            ) : (
              /* STEP 1B: Sign In Form */
              <motion.form
                key="signin"
                onSubmit={handleSignIn}
                variants={formContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <motion.div variants={formItemVariants}>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1 font-sans flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>Work Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@coimbatoretooling.in"
                    className="w-full px-3.5 py-2.5 bg-g-surfaceElevated border border-g-border rounded-lg text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-2 focus:ring-g-blue/20 transition-all font-sans placeholder:text-g-textMuted/60 hover:border-g-borderHover shadow-xs"
                  />
                </motion.div>

                <motion.div variants={formItemVariants}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-semibold text-g-textSecondary font-sans flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Password</span>
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-g-blue hover:text-g-blueHover transition-colors cursor-pointer font-medium"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </motion.button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-g-surfaceElevated border border-g-border rounded-lg text-g-text text-sm focus:outline-none focus:border-g-blue focus:ring-2 focus:ring-g-blue/20 transition-all font-sans placeholder:text-g-textMuted/60 hover:border-g-borderHover shadow-xs"
                  />
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={formItemVariants}>
                  <motion.button
                    whileHover={shouldReduce ? undefined : { scale: 1.015, boxShadow: '0 0 20px rgba(76, 141, 246, 0.35)' }}
                    whileTap={shouldReduce ? undefined : { scale: 0.985 }}
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full py-2.5 px-4 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 transition-all shadow-sm overflow-hidden group"
                  >
                    {!shouldReduce && (
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                    )}
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        <span>Authenticating Workspace...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        <span>Sign In to Workspace</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Quick Demo Access Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-g-border" />
            </div>
            <span className="relative bg-g-surface px-3 text-[11px] uppercase tracking-wider text-g-textMuted font-mono">
              or instant demo access
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <motion.button
              whileHover={shouldReduce ? undefined : { y: -2, borderColor: 'var(--g-blue)' }}
              whileTap={shouldReduce ? undefined : { scale: 0.98 }}
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoAccess('demo')}
              className="group w-full py-2.5 px-3 rounded-lg border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle text-g-text font-medium text-xs transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-between"
            >
              <span>Continue in Demo Mode</span>
              <span className="text-g-textMuted group-hover:text-g-blue group-hover:translate-x-1 transition-all">→</span>
            </motion.button>
            <motion.button
              whileHover={shouldReduce ? undefined : { y: -2, borderColor: 'var(--g-blue)' }}
              whileTap={shouldReduce ? undefined : { scale: 0.98 }}
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoAccess('operator')}
              className="group w-full py-2.5 px-3 rounded-lg border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle text-g-textSecondary hover:text-g-text font-medium text-xs transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-between"
            >
              <span>Shift Operator Demo</span>
              <span className="text-g-textMuted group-hover:text-g-blue group-hover:translate-x-1 transition-all">→</span>
            </motion.button>
          </div>
        </motion.div>
      </main>

      {/* Corporate Standards Footer */}
      <footer className="w-full px-6 py-4 border-t border-g-border bg-g-surface/92 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-g-textSecondary font-sans z-10 transition-colors">
        <div>
          <span className="text-g-text font-medium">SynapSYS Enterprise Manufacturing Platform</span>
          <span className="mx-2 text-g-border">•</span>
          <span>High-Availability Industrial Edge</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
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
