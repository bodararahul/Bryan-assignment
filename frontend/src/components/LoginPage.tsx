import React, { useState } from 'react';
import {
  GitBranch,
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { authApi, AuthUser } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess?: (user: AuthUser, token: string) => void;
}

type AuthMode = 'login' | 'register';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<AuthMode>('login');

  // If already authenticated, redirect to destination or dashboard
  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // Login form state (empty by default)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper validation utilities
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const criteria = {
    hasMinLength: regPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(regPassword),
    hasLowerCase: /[a-z]/.test(regPassword),
    hasNumber: /[0-9]/.test(regPassword),
    hasSymbol: /[^A-Za-z0-9]/.test(regPassword),
  };

  const isPasswordValid =
    criteria.hasMinLength &&
    criteria.hasUpperCase &&
    criteria.hasLowerCase &&
    criteria.hasNumber &&
    criteria.hasSymbol;

  const isPasswordMatching =
    regConfirmPassword.length > 0 && regPassword === regConfirmPassword;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please provide both email address and password.');
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setError('Please enter a valid email address (e.g. user@company.com).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login(loginEmail.trim(), loginPassword);
      if (res.success && res.token) {
        login(res.user, res.token);
        if (onLoginSuccess) {
          onLoginSuccess(res.user, res.token);
        }
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err: unknown) {
      const e = err as Error & { response?: { data?: { message?: string; error?: string } } };
      const msg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Unable to connect to authentication server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword || !regConfirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (regName.trim().length < 2) {
      setError('Full Name must be at least 2 characters long.');
      return;
    }

    if (!isValidEmail(regEmail)) {
      setError('Please provide a valid work email address.');
      return;
    }

    if (!isPasswordValid) {
      if (!criteria.hasMinLength) {
        setError('Password must be at least 8 characters long.');
      } else if (!criteria.hasUpperCase) {
        setError('Password must contain at least one uppercase letter (A-Z).');
      } else if (!criteria.hasLowerCase) {
        setError('Password must contain at least one lowercase letter (a-z).');
      } else if (!criteria.hasNumber) {
        setError('Password must contain at least one number (0-9).');
      } else if (!criteria.hasSymbol) {
        setError('Password must contain at least one special symbol (!@#$%...).');
      }
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.register({
        name: regName.trim(),
        orgName: regOrgName.trim() || `${regName.trim()}'s Workspace`,
        email: regEmail.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });

      if (res.success && res.token) {
        login(res.user, res.token);
        if (onLoginSuccess) {
          onLoginSuccess(res.user, res.token);
        }
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.message || 'Failed to create workspace account.');
      }
    } catch (err: unknown) {
      const e = err as Error & { response?: { data?: { message?: string; error?: string } } };
      const msg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset all inputs when switching between Sign In and Register tabs
  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);

    // Clear all register form fields
    setRegName('');
    setRegOrgName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);

    // Clear all login form fields
    setLoginEmail('');
    setLoginPassword('');
    setShowLoginPassword(false);
  };

  return (
    <div className="login-page-wrapper">
      {/* Background glow effects */}
      <div className="login-bg-glow-top" />
      <div className="login-bg-glow-bottom" />

      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-badge">
            <GitBranch size={26} strokeWidth={2.5} />
          </div>
          <div className="login-title-group">
            <div className="login-brand-name-row">
              <h1 className="login-brand-name">LeadManager</h1>
              <span className="brand-badge-pro">PRO</span>
            </div>
            <p className="login-brand-subtitle">
              {mode === 'login'
                ? 'Sign in to access your sales workspace'
                : 'Create your private isolated workspace'}
            </p>
          </div>
        </div>

        {/* Auth Mode Switcher Tabs */}
        <div className="auth-tab-switcher" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('login')}
          >
            <KeyRound size={14} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('register')}
          >
            <Building2 size={14} />
            <span>Register</span>
          </button>
        </div>



        {/* Tenant Isolation Feature Callout (Shown on register mode) */}
        {/* {mode === 'register' && (
          <div className="login-isolation-pill">
            <CheckCircle2 size={15} className="isolation-pill-icon" />
            <div className="isolation-pill-text">
              <span className="isolation-pill-title">Dedicated Tenant Isolation</span>
              <span className="isolation-pill-desc">
                Generates a secure <code>tenant_id</code>. Your customer data is strictly separated.
              </span>
            </div>
          </div>
        )} */}

        {/* Error Alert */}
        {error && (
          <div className="login-error-banner" role="alert">
            <AlertCircle size={16} strokeWidth={2.2} />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Sign In Form ──────────────────────────────────────────────── */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Work Email Address
              </label>
              <div className="input-with-icon-wrapper">
                <Mail size={16} className="input-left-icon" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@leadmanager.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="login-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <div className="input-with-icon-wrapper">
                <Lock size={16} className="input-left-icon" />
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="login-input has-right-action"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-right-action-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-icon-sm" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Sign In to CRM</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="auth-footer-toggle">
              <span>New company or team?</span>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => handleSwitchMode('register')}
              >
                Create new workspace
              </button>
            </div>
          </form>
        ) : (
          /* ─── Registration Form ─────────────────────────────────────────── */
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">
                Full Name
              </label>
              <div className="input-with-icon-wrapper">
                <User size={16} className="input-left-icon" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="Sarah Jenkins"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="login-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-org" className="form-label">
                Organization / Company Name
              </label>
              <div className="input-with-icon-wrapper">
                <Building2 size={16} className="input-left-icon" />
                <input
                  id="reg-org"
                  type="text"
                  placeholder="Acme Corporation"
                  value={regOrgName}
                  onChange={(e) => setRegOrgName(e.target.value)}
                  className="login-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">
                Work Email Address
              </label>
              <div className="input-with-icon-wrapper">
                <Mail size={16} className="input-left-icon" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="sarah@acmecorp.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="login-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">
                Create Password
              </label>
              <div className="input-with-icon-wrapper">
                <Lock size={16} className="input-left-icon" />
                <input
                  id="reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="login-input has-right-action"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-right-action-btn"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password criteria checklist */}
              {regPassword.length > 0 && (
                <div className="password-criteria-card" aria-live="polite">
                  <div className="criteria-header">
                    <span>Password Security Rules</span>
                    <span className={isPasswordValid ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                      {isPasswordValid ? 'All criteria met' : 'Requirements'}
                    </span>
                  </div>
                  <div className="criteria-grid">
                    <div className={`criteria-item ${criteria.hasMinLength ? 'met' : 'unmet'}`}>
                      {criteria.hasMinLength ? (
                        <CheckCircle2 size={13} className="criteria-icon-met" />
                      ) : (
                        <span className="criteria-icon-unmet">○</span>
                      )}
                      <span>8+ characters</span>
                    </div>
                    <div className={`criteria-item ${criteria.hasUpperCase ? 'met' : 'unmet'}`}>
                      {criteria.hasUpperCase ? (
                        <CheckCircle2 size={13} className="criteria-icon-met" />
                      ) : (
                        <span className="criteria-icon-unmet">○</span>
                      )}
                      <span>1 uppercase (A-Z)</span>
                    </div>
                    <div className={`criteria-item ${criteria.hasLowerCase ? 'met' : 'unmet'}`}>
                      {criteria.hasLowerCase ? (
                        <CheckCircle2 size={13} className="criteria-icon-met" />
                      ) : (
                        <span className="criteria-icon-unmet">○</span>
                      )}
                      <span>1 lowercase (a-z)</span>
                    </div>
                    <div className={`criteria-item ${criteria.hasNumber ? 'met' : 'unmet'}`}>
                      {criteria.hasNumber ? (
                        <CheckCircle2 size={13} className="criteria-icon-met" />
                      ) : (
                        <span className="criteria-icon-unmet">○</span>
                      )}
                      <span>1 number (0-9)</span>
                    </div>
                    <div className={`criteria-item ${criteria.hasSymbol ? 'met' : 'unmet'}`}>
                      {criteria.hasSymbol ? (
                        <CheckCircle2 size={13} className="criteria-icon-met" />
                      ) : (
                        <span className="criteria-icon-unmet">○</span>
                      )}
                      <span>1 symbol (!@#$...)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="reg-confirm-password" className="form-label">
                Confirm Password
              </label>
              <div className="input-with-icon-wrapper">
                <Lock size={16} className="input-left-icon" />
                <input
                  id="reg-confirm-password"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="login-input has-right-action"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-right-action-btn"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Real-time Match Indicator */}
              {regConfirmPassword.length > 0 && (
                <div
                  className={`password-match-badge ${
                    isPasswordMatching ? 'matched' : 'mismatched'
                  }`}
                >
                  {isPasswordMatching ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-icon-sm" />
                  <span>Setting up your workspace...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Create Workspace & Start</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="auth-footer-toggle">
              <span>Already registered?</span>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => handleSwitchMode('login')}
              >
                Sign in to existing account
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Badges */}
        <div className="login-footer-security">
          <div className="security-badge-item">
            <ShieldCheck size={13} className="security-badge-icon" />
            <span>256-bit TLS</span>
          </div>
          <span className="security-sep">•</span>
          <div className="security-badge-item">
            <Building2 size={13} className="security-badge-icon" />
            <span>Tenant Isolation</span>
          </div>
          <span className="security-sep">•</span>
          <div className="security-badge-item">
            <span>HMAC Sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
