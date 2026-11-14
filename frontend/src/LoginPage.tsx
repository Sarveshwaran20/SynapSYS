import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AuthSession, UserRole } from './types';
import {
  authenticateWorkspace,
  initiate2FASignup,
  verify2FASignup,
} from './lib/auth';
import { SynapsysLogo } from './SynapsysLogo';
import { dur, ease } from './lib/motion';

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
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailDeliveryInfo, setEmailDeliveryInfo] = useState<{
    delivered: boolean;
    recipient: string;
    deliveryStatus?: string;
    deliveryMessage?: string;
    debugOtpHint?: string;
  } | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const shouldReduce = useReducedMotion();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both your work email and password.');
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

      setEmailDeliveryInfo({
        delivered: Boolean(res.delivered),
        recipient: res.recipient || 'sarveshwaran.k2008@gmail.com',
        deliveryStatus: res.delivery_status,
        deliveryMessage: res.delivery_message,
        debugOtpHint: res.debug_otp_hint,
      });

      if (res.delivered) {
        setSuccessMessage(
          `Security code dispatched to ${res.recipient} via SMTP! Please check your email inbox.`
        );
      } else {
        setSuccessMessage(null);
      }

      // Explicitly reset OTP digits: autofill disabled so admin must enter manually from email
      setOtpDigits(['', '', '', '', '', '']);
      setMode('otp_verify');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to initiate 2FA security registration. Try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullCode = otpDigits.join('').trim();
    if (fullCode.length < 6) {
      setErrorMessage('Please enter all 6 digits of the 2FA confirmation code.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await verify2FASignup({
        email: email.trim(),
        otpCode: fullCode,
        fullName: fullName.trim() || undefined,
        companyName: companyName.trim() || undefined,
      });

      setSuccessMessage('2FA Verified! Provisioning isolated company twin and signing in...');
      setTimeout(() => {
        onLoginSuccess(session);
      }, 700);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid 2FA verification code. Please check and retry.'
      );
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

    // Handle full paste
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

    // Auto advance to next cell
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
    <div className="min-h-screen w-full bg-g-bg text-g-text flex flex-col justify-between relative overflow-x-clip font-sans select-none transition-colors duration-200">
      {/* Animated SCADA Blueprint & Radar Orbit Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 hero-blueprint-grid opacity-35" />
        {/* Floating gradient orbs with slow motion */}
        <motion.div
          animate={shouldReduce ? undefined : { x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-[540px] h-[540px] rounded-full hero-ambient-glow-blue opacity-35 blur-3xl"
        />
        <motion.div
          animate={shouldReduce ? undefined : { x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-48 -left-48 w-[520px] h-[520px] rounded-full hero-ambient-glow-purple opacity-25 blur-3xl"
        />

        {/* Concentric rotating radar rings in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none opacity-20">
          <motion.div
            animate={shouldReduce ? undefined : { rotate: 360 }}
            transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
            className="w-full h-full rounded-full border border-dashed border-aegean/40 flex items-center justify-center"
          >
            <div className="w-[500px] h-[500px] rounded-full border border-silver/20 flex items-center justify-center">
              <div className="w-[300px] h-[300px] rounded-full border border-dashed border-aegean/30"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Top Professional Navigation Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-g-border bg-g-surface/92 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          {onBackHome && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onBackHome}
              className="px-3 py-1.5 rounded-[6px] border border-g-border bg-g-surfaceElevated hover:border-g-blue text-[13px] text-g-textSecondary hover:text-g-text transition-colors cursor-pointer"
            >
              ← Overview
            </motion.button>
          )}
          <SynapsysLogo variant="horizontal" size="md" isDarkMode={isDarkMode} />
        </div>

        <div className="flex items-center gap-3 text-[13px] font-sans text-g-textSecondary">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-[2px] bg-g-green"></span>
            <span className="text-g-text font-medium">SQLite + Firebase Cloud Ingestion</span>
          </div>
          <span className="hidden sm:inline text-g-border">|</span>
          <span className="hidden sm:inline text-g-textSecondary font-cinzel font-semibold text-[13px] tracking-wider">
            2FA Security Engine
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

      {/* Main Login / Sign Up Card with Custom Transitions */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 z-10">
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: dur.base, ease }}
          className="w-full max-w-md lp-notch-card bg-g-surface border border-g-border border-t-2 border-t-g-blue rounded-[6px] shadow-2xl p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Subtle animated scanning laser line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-aegean to-transparent opacity-75 animate-pulse" />

          {/* Form Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3">
              <SynapsysLogo variant="icon" size="lg" isDarkMode={isDarkMode} />
            </div>

            <h1 className="text-xl font-bold text-g-text tracking-wider font-cinzel uppercase">
              {mode === 'signin'
                ? 'Workspace Sign In'
                : mode === 'signup'
                ? 'Create Workspace Account'
                : 'Two-Factor Authentication'}
            </h1>
            <p className="text-xs text-g-textSecondary mt-1 font-sans">
              {mode === 'signin'
                ? "Enter your credentials to access your plant's supervisory workspace"
                : mode === 'signup'
                ? 'Register your organization with automated 2FA security dispatch'
                : 'Security verification code for corporate supervisor'}
            </p>

            {/* Custom Animated Mode Switcher Tabs */}
            {mode !== 'otp_verify' && (
              <div className="mt-5 relative flex p-1 bg-g-surfaceElevated border border-g-border rounded-lg max-w-xs mx-auto">
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
                      className="absolute inset-0 bg-g-surface border border-g-border rounded-md shadow-sm"
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
                      className="absolute inset-0 bg-g-surface border border-g-border rounded-md shadow-sm"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">Sign Up (2FA)</span>
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
                className="mb-4 p-3 rounded-[4px] bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 font-sans overflow-hidden"
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
                className="mb-4 p-3 rounded-[4px] bg-g-redLight border border-g-red/40 text-g-red text-xs flex items-center gap-2 font-sans overflow-hidden"
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
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                {/* Delivery Telemetry HUD Card */}
                <div className="p-3.5 rounded-lg bg-g-surfaceElevated border border-g-border space-y-2 text-xs font-mono">
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
                </div>

                {/* 6 Digit Segmented Cells with Autofill Disabled */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-g-textSecondary font-sans">
                      Enter 6-Digit 2FA Code
                    </label>
                    <span className="text-[10px] font-mono text-silver/80">
                      Autofill Disabled &bull; Manual Entry Required
                    </span>
                  </div>
                  <div className="flex justify-center gap-2">
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
                        whileFocus={{ scale: 1.05 }}
                        className={`w-11 h-12 text-center text-xl font-mono font-bold rounded-lg border bg-g-surfaceElevated text-g-text focus:outline-none transition-all ${
                          digit
                            ? 'border-emerald-500/70 bg-emerald-500/5 text-emerald-300 shadow-xs'
                            : 'border-g-border focus:border-aegean focus:ring-1 focus:ring-aegean'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Button */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      <span>Verifying 2FA Code...</span>
                    </>
                  ) : (
                    <span>Verify &amp; Launch Workspace →</span>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className="w-full text-center text-xs text-g-textSecondary hover:text-g-text font-mono cursor-pointer pt-1"
                >
                  ← Edit Registration Details
                </button>
              </motion.form>
            ) : mode === 'signup' ? (
              /* STEP 1A: Sign Up Form */
              <motion.form
                key="signup"
                onSubmit={handleInitiateSignUp}
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1 font-sans">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-aegean focus:ring-1 focus:ring-aegean transition-all font-sans placeholder:text-g-textMuted/60"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1 font-sans">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Coimbatore Precision Tooling"
                    className="w-full px-3 py-2 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-aegean focus:ring-1 focus:ring-aegean transition-all font-sans placeholder:text-g-textMuted/60"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1 font-sans">
                    Work Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@coimbatoretooling.in"
                    className="w-full px-3 py-2 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-aegean focus:ring-1 focus:ring-aegean transition-all font-sans placeholder:text-g-textMuted/60"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-semibold text-g-textSecondary font-sans">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-g-blue hover:underline cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
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
                    className="w-full px-3 py-2 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-aegean focus:ring-1 focus:ring-aegean transition-all font-sans placeholder:text-g-textMuted/60"
                  />
                </div>

                {/* 2FA Dispatch Notice */}
                <div className="p-3 rounded-[4px] bg-g-surfaceElevated border border-g-border text-g-textSecondary text-xs leading-relaxed font-sans">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-aegean mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-g-text font-cinzel">2FA Supervisor Guard:</strong> Submitting registers your account and dispatches a 6-digit confirmation challenge to supervisor (<span className="text-aegean font-mono">sarveshwaran.k2008@gmail.com</span>).
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      <span>Initiating 2FA Security Challenge...</span>
                    </>
                  ) : (
                    <span>Create Account &amp; Send 2FA Code →</span>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              /* STEP 1B: Sign In Form */
              <motion.form
                key="signin"
                onSubmit={handleSignIn}
                initial={{ opacity: 0, x: -20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[13px] font-semibold text-g-textSecondary mb-1 font-sans">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@coimbatoretooling.in"
                    className="w-full px-3 py-2.5 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-aegean focus:ring-1 focus:ring-aegean transition-all font-sans placeholder:text-g-textMuted/60"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-semibold text-g-textSecondary font-sans">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-g-blue hover:underline cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
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
                    className="w-full px-3 py-2.5 bg-g-surfaceElevated border border-g-border rounded-[4px] text-g-text text-sm focus:outline-none focus:border-aegean focus:ring-1 focus:ring-aegean transition-all font-sans placeholder:text-g-textMuted/60"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-[8px] bg-g-blue hover:bg-g-blueHover text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 transition-colors shadow-sm"
                >
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoAccess('demo')}
              className="w-full py-2.5 px-3 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:border-g-blue hover:bg-g-surfaceSubtle text-g-text font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              Continue in Demo Mode
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoAccess('operator')}
              className="w-full py-2.5 px-3 rounded-[8px] border border-g-border bg-g-surfaceElevated hover:border-g-blue hover:bg-g-surfaceSubtle text-g-textSecondary hover:text-g-text font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              Shift Operator Demo
            </motion.button>
          </div>
        </motion.div>
      </main>

      {/* Corporate Standards Footer */}
      <footer className="w-full px-6 py-4 border-t border-g-border bg-g-surface flex flex-wrap items-center justify-between gap-3 text-xs text-g-textSecondary font-sans z-10">
        <div>
          <span className="text-g-text font-medium">SynapSYS Enterprise Manufacturing Platform</span>
          <span className="mx-2 text-g-border">•</span>
          <span>Google Cloud Firestore + Multi-Tenant 2FA</span>
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
