import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import FinFlowLogo from '../components/FinFlowLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const Auth = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' || searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);
  const isLogin = mode === 'login';

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  // Registration Form State
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [registerErrors, setRegisterErrors] = useState({});

  // Async & Server State
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const navigate = useNavigate();

  // Unique IDs for WCAG Label-Input Pairing
  const idPrefix = useId();
  const loginEmailId = `${idPrefix}-login-email`;
  const loginPasswordId = `${idPrefix}-login-password`;
  const registerNameId = `${idPrefix}-register-name`;
  const registerEmailId = `${idPrefix}-register-email`;
  const registerPasswordId = `${idPrefix}-register-password`;
  const registerConfirmPasswordId = `${idPrefix}-register-confirm-password`;

  // Validation Helpers
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'bg-border' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, text: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, text: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, text: 'Good', color: 'bg-indigo-500' };
      case 4:
        return { score: 100, text: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, text: '', color: 'bg-border' };
    }
  };

  const strength = getPasswordStrength(registerPassword);

  // Switch between Login and Register
  const handleTabChange = (targetMode) => {
    setMode(targetMode);
    setServerError('');
    setLoginErrors({});
    setRegisterErrors({});
  };

  // Quick Demo Credentials Fill for Testing & QA
  const fillDemoCredentials = () => {
    setLoginEmail('qa.tester.auto@gmail.com');
    setLoginPassword('Password123!');
    setLoginErrors({});
    setServerError('');
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Duplicate submission guard
    setServerError('');

    if (isLogin) {
      const errors = {};
      if (!loginEmail.trim()) {
        errors.email = 'Email address is required.';
      } else if (!isValidEmail(loginEmail)) {
        errors.email = 'Please enter a valid email address.';
      }
      if (!loginPassword) {
        errors.password = 'Password is required.';
      }

      if (Object.keys(errors).length > 0) {
        setLoginErrors(errors);
        return;
      }
      setLoginErrors({});
    } else {
      const errors = {};
      if (!registerName.trim()) {
        errors.name = 'Full name is required.';
      } else if (registerName.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters.';
      }
      if (!registerEmail.trim()) {
        errors.email = 'Email address is required.';
      } else if (!isValidEmail(registerEmail)) {
        errors.email = 'Please enter a valid email address.';
      }
      if (!registerPassword) {
        errors.password = 'Password is required.';
      } else if (registerPassword.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }
      if (registerPassword !== registerConfirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }

      if (Object.keys(errors).length > 0) {
        setRegisterErrors(errors);
        return;
      }
      setRegisterErrors({});
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const payload = isLogin 
        ? { email: loginEmail.trim().toLowerCase(), password: loginPassword }
        : { name: registerName.trim(), email: registerEmail.trim().toLowerCase(), password: registerPassword };

      const response = await axios.post(endpoint, payload, { withCredentials: true });

      if (onLogin) {
        onLogin(response.data);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Authentication request error:', err);
      // Retain form inputs! Only set server error
      if (isLogin) {
        // Generic safe error message to prevent user enumeration
        const msg = err.response?.status === 401 
          ? 'Invalid email or password. Please verify your credentials.'
          : (err.response?.data?.message || 'Authentication failed. Please check network connection.');
        setServerError(msg);
      } else {
        const msg = err.response?.data?.message || 'Registration failed. Please check your information and try again.';
        setServerError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center bg-background text-foreground transition-colors duration-200 p-4 sm:p-6 lg:p-8 relative selection:bg-primary/20 selection:text-primary">
      {/* Background Decorative Accents */}
      <div 
        aria-hidden="true" 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl pointer-events-none -z-10" 
      />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 sm:py-4">
        <Link 
          to="/" 
          className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          title="Return to Home"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle variant="compact" />
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md sm:max-w-lg my-auto py-6">
        <Card variant="elevated" className="border-border/80 shadow-token-lg rounded-2xl overflow-hidden backdrop-blur-sm bg-card/95">
          {/* Card Header & Brand */}
          <div className="p-6 sm:p-8 pb-4 border-b border-border/60 text-center flex flex-col items-center">
            <Link to="/" className="mb-4 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <FinFlowLogo size="lg" />
            </Link>

            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-card-foreground">
              {isLogin ? 'Sign In to FinFlow' : 'Create Your Account'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs sm:max-w-sm">
              {isLogin 
                ? 'Welcome back! Enter your verified credentials to access your financial dashboard.' 
                : 'Join FinFlow to automate invoices, track expenses, and manage cash flow in real-time.'}
            </p>

            {/* Segmented Mode Selector */}
            <div 
              role="tablist" 
              aria-label="Authentication mode selection"
              className="w-full mt-6 grid grid-cols-2 p-1 bg-surface-secondary border border-border rounded-xl gap-1 text-xs font-bold"
            >
              <button
                type="button"
                role="tab"
                id="auth-tab-login"
                aria-selected={isLogin}
                aria-controls="auth-panel-login"
                onClick={() => handleTabChange('login')}
                className={`py-2 px-3 rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isLogin
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface/60'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                id="auth-tab-register"
                aria-selected={!isLogin}
                aria-controls="auth-panel-register"
                onClick={() => handleTabChange('register')}
                className={`py-2 px-3 rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  !isLogin
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface/60'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 pt-6">
            {/* Server Error Alert */}
            <AnimatePresence mode="wait">
              {serverError && (
                <motion.div
                  role="alert"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs font-medium"
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{serverError}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  /* ================= LOGIN FORM ================= */
                  <motion.div
                    key="login-panel"
                    id="auth-panel-login"
                    role="tabpanel"
                    aria-labelledby="auth-tab-login"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Login Email */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor={loginEmailId}
                        className="block text-xs font-bold text-foreground font-display tracking-wide"
                      >
                        Email Address
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
                          <Mail size={16} />
                        </div>
                        <input
                          id={loginEmailId}
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={loginEmail}
                          onChange={(e) => {
                            setLoginEmail(e.target.value);
                            if (loginErrors.email) setLoginErrors(prev => ({ ...prev, email: undefined }));
                            if (serverError) setServerError('');
                          }}
                          placeholder="name@company.com"
                          className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius pl-10 pr-3.5 py-2.5 text-sm outline-none transition-all duration-200 ${
                            loginErrors.email
                              ? 'border-destructive focus:ring-2 focus:ring-destructive/20 focus:border-destructive'
                              : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                          }`}
                        />
                      </div>
                      {loginErrors.email && (
                        <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {loginErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Login Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label 
                          htmlFor={loginPasswordId}
                          className="block text-xs font-bold text-foreground font-display tracking-wide"
                        >
                          Password
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
                          <Lock size={16} />
                        </div>
                        <input
                          id={loginPasswordId}
                          name="password"
                          type={showLoginPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            if (loginErrors.password) setLoginErrors(prev => ({ ...prev, password: undefined }));
                            if (serverError) setServerError('');
                          }}
                          placeholder="••••••••"
                          className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius pl-10 pr-10 py-2.5 text-sm outline-none transition-all duration-200 ${
                            loginErrors.password
                              ? 'border-destructive focus:ring-2 focus:ring-destructive/20 focus:border-destructive'
                              : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-primary transition-colors p-1"
                        >
                          {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {loginErrors.password && (
                        <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {loginErrors.password}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* ================= REGISTRATION FORM ================= */
                  <motion.div
                    key="register-panel"
                    id="auth-panel-register"
                    role="tabpanel"
                    aria-labelledby="auth-tab-register"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor={registerNameId}
                        className="block text-xs font-bold text-foreground font-display tracking-wide"
                      >
                        Full Name / Organization
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <input
                          id={registerNameId}
                          name="name"
                          type="text"
                          autoComplete="name"
                          required
                          value={registerName}
                          onChange={(e) => {
                            setRegisterName(e.target.value);
                            if (registerErrors.name) setRegisterErrors(prev => ({ ...prev, name: undefined }));
                            if (serverError) setServerError('');
                          }}
                          placeholder="e.g. Alex Morgan"
                          className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius pl-10 pr-3.5 py-2.5 text-sm outline-none transition-all duration-200 ${
                            registerErrors.name
                              ? 'border-destructive focus:ring-2 focus:ring-destructive/20 focus:border-destructive'
                              : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                          }`}
                        />
                      </div>
                      {registerErrors.name && (
                        <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {registerErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor={registerEmailId}
                        className="block text-xs font-bold text-foreground font-display tracking-wide"
                      >
                        Business Email Address
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
                          <Mail size={16} />
                        </div>
                        <input
                          id={registerEmailId}
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={registerEmail}
                          onChange={(e) => {
                            setRegisterEmail(e.target.value);
                            if (registerErrors.email) setRegisterErrors(prev => ({ ...prev, email: undefined }));
                            if (serverError) setServerError('');
                          }}
                          placeholder="alex@fintech.io"
                          className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius pl-10 pr-3.5 py-2.5 text-sm outline-none transition-all duration-200 ${
                            registerErrors.email
                              ? 'border-destructive focus:ring-2 focus:ring-destructive/20 focus:border-destructive'
                              : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                          }`}
                        />
                      </div>
                      {registerErrors.email && (
                        <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {registerErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Register Password */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor={registerPasswordId}
                        className="block text-xs font-bold text-foreground font-display tracking-wide"
                      >
                        Create Password
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
                          <Lock size={16} />
                        </div>
                        <input
                          id={registerPasswordId}
                          name="password"
                          type={showRegisterPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={registerPassword}
                          onChange={(e) => {
                            setRegisterPassword(e.target.value);
                            if (registerErrors.password) setRegisterErrors(prev => ({ ...prev, password: undefined }));
                            if (serverError) setServerError('');
                          }}
                          placeholder="••••••••"
                          className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius pl-10 pr-10 py-2.5 text-sm outline-none transition-all duration-200 ${
                            registerErrors.password
                              ? 'border-destructive focus:ring-2 focus:ring-destructive/20 focus:border-destructive'
                              : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-primary transition-colors p-1"
                        >
                          {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {registerErrors.password && (
                        <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {registerErrors.password}
                        </p>
                      )}

                      {/* Password Strength Meter */}
                      {registerPassword && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                            <span>Password Strength</span>
                            <span className="font-bold">{strength.text}</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${strength.color}`} 
                              style={{ width: `${strength.score}%` }} 
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor={registerConfirmPasswordId}
                        className="block text-xs font-bold text-foreground font-display tracking-wide"
                      >
                        Confirm Password
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
                          <Lock size={16} />
                        </div>
                        <input
                          id={registerConfirmPasswordId}
                          name="confirmPassword"
                          type={showRegisterConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={registerConfirmPassword}
                          onChange={(e) => {
                            setRegisterConfirmPassword(e.target.value);
                            if (registerErrors.confirmPassword) setRegisterErrors(prev => ({ ...prev, confirmPassword: undefined }));
                            if (serverError) setServerError('');
                          }}
                          placeholder="••••••••"
                          className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius pl-10 pr-10 py-2.5 text-sm outline-none transition-all duration-200 ${
                            registerErrors.confirmPassword
                              ? 'border-destructive focus:ring-2 focus:ring-destructive/20 focus:border-destructive'
                              : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                          aria-label={showRegisterConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          className="absolute right-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-primary transition-colors p-1"
                        >
                          {showRegisterConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {registerErrors.confirmPassword && (
                        <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {registerErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading}
                  rightIcon={!isLoading ? ArrowRight : undefined}
                  className="w-full font-bold shadow-token-md"
                >
                  {isLoading 
                    ? (isLogin ? 'Authenticating...' : 'Creating Account...') 
                    : (isLogin ? 'Sign In to Dashboard' : 'Create Free Account')}
                </Button>
              </div>
            </form>

            {/* Quick Demo Credentials Assistant (for testing environments) */}
            {isLogin && (
              <div className="mt-5 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <KeyRound size={13} className="text-primary" />
                    QA Test Account
                  </span>
                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="text-primary hover:underline font-bold text-xs"
                  >
                    Auto-Fill Test Login
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card Footer Security Indicator */}
          <div className="px-6 py-4 bg-surface-secondary/60 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
              <span>HTTP-only JWT Cookie Session</span>
            </div>
            <Badge variant="primary" className="text-[10px] px-2 py-0.5">
              <Sparkles size={10} className="mr-1" /> SOC-2 Encrypted
            </Badge>
          </div>
        </Card>

        {/* Bottom Switcher Helper */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {isLogin ? "Don't have an account yet?" : 'Already registered with FinFlow?'}{' '}
          <button
            type="button"
            onClick={() => handleTabChange(isLogin ? 'register' : 'login')}
            className="text-primary font-bold hover:underline ml-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
          >
            {isLogin ? 'Create a new account' : 'Sign in to existing account'}
          </button>
        </p>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-5xl py-4 text-center text-[11px] text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>FinFlow Core Engine v2.0 • Phase 1 Design System Active</span>
        </div>
        <div>
          <span>© 2026 FinFlow Financial Technologies Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
