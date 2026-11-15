import { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  User,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Clock,
  AtSign,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { checkUsername } from '../../api/client';
import Button from '../common/Button';
import './AuthModal.css';

// ── Password Strength Calculation ───────────────────────────────────

function evaluatePassword(password = '', username = '', email = '') {
  const p = password || '';
  const checks = {
    length: p.length >= 8,
    hasUpper: /[A-Z]/.test(p),
    hasLower: /[a-z]/.test(p),
    hasDigit: /[0-9]/.test(p),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_+=[\]\\/'`~;]/.test(p),
    noUsername: true,
    noEmailPrefix: true,
  };

  const u = (username || '').trim().toLowerCase();
  if (u && u.length >= 3 && p.toLowerCase().includes(u)) {
    checks.noUsername = false;
  }

  const emailLocal = (email || '').split('@')[0].trim().toLowerCase();
  if (emailLocal && emailLocal.length >= 3 && p.toLowerCase().includes(emailLocal)) {
    checks.noEmailPrefix = false;
  }

  let score = 0;
  if (checks.length) score++;
  if (checks.hasUpper && checks.hasLower) score++;
  if (checks.hasDigit) score++;
  if (checks.hasSpecial) score++;
  if (!checks.noUsername || !checks.noEmailPrefix) score = Math.max(0, score - 1);

  let label = 'Too Short';
  let color = '#ef4444';
  if (p.length === 0) {
    label = '';
    score = 0;
  } else if (score <= 1) {
    label = 'Weak';
    color = '#ef4444';
  } else if (score === 2) {
    label = 'Fair';
    color = '#f59e0b';
  } else if (score === 3) {
    label = 'Good';
    color = '#10b981';
  } else if (score >= 4) {
    label = 'Strong';
    color = '#06b6d4';
  }

  const isValid =
    checks.length &&
    checks.hasUpper &&
    checks.hasLower &&
    checks.hasDigit &&
    checks.hasSpecial &&
    checks.noUsername &&
    checks.noEmailPrefix;

  return { checks, score, label, color, isValid };
}

// ── Main Dialog Component ───────────────────────────────────────────

function AuthModalDialog({
  tab = 'login',
  message = '',
  initialData = {},
  onClose,
  login,
  register,
  forgotPassword,
  verifyOTP,
  resetPassword,
  continueAsGuest,
}) {
  const [activeTab, setActiveTab] = useState(tab || 'login');

  // Form State
  const [identifier, setIdentifier] = useState(initialData.identifier || initialData.email || '');
  const [fullName, setFullName] = useState(initialData.fullName || '');
  const [username, setUsername] = useState(initialData.username || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState(initialData.resetToken || '');
  const [transferProgress, setTransferProgress] = useState(true);

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, reason: '' });
  const checkDebounceRef = useRef(null);

  // OTP Timers
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(0); // 60s cooldown

  // Real-time username availability check
  useEffect(() => {
    if (activeTab !== 'register') return;
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3) {
      return;
    }

    if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);

    checkDebounceRef.current = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null, reason: 'Checking...' });
      try {
        const res = await checkUsername(trimmed);
        if (res) {
          setUsernameStatus({
            checking: false,
            available: res.available,
            reason: res.reason,
          });
        }
      } catch {
        setUsernameStatus({ checking: false, available: null, reason: '' });
      }
    }, 350);

    return () => {
      if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);
    };
  }, [username, activeTab]);

  // OTP countdown interval
  useEffect(() => {
    if (activeTab !== 'otp') return;
    const timer = setInterval(() => {
      setOtpExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const pwEval = evaluatePassword(password, username, email);

  // ── Tab Switchers ──
  const switchTab = (newTab) => {
    setActiveTab(newTab);
    setError('');
    setSuccess('');
  };

  // ── Submit Handlers ──

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    if (!pwEval.isValid) {
      setError('Please ensure your password meets all security criteria below.');
      return;
    }

    if (usernameStatus.available === false) {
      setError(usernameStatus.reason || 'This username is not available.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        fullName,
        username,
        email,
        password,
        confirmPassword,
        transferGuestProgress: transferProgress,
      });
      if (res?.transferredTopics > 0) {
        setSuccess(`Account created! ${res.transferredTopics} guest topics transferred to your cloud profile.`);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(`A 6-digit verification code has been dispatched to ${email}.`);
      setOtpExpirySeconds(300);
      setResendCooldown(60);
      setActiveTab('otp');
    } catch (err) {
      setError(err.message || 'Failed to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(`A new verification code has been dispatched to ${email}.`);
      setOtpExpirySeconds(300);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter the full 6-digit numeric verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOTP(email, cleanOtp);
      if (res?.resetToken) {
        setResetToken(res.resetToken);
        setSuccess('Verification successful! Please choose a new password.');
        setPassword('');
        setConfirmPassword('');
        setActiveTab('reset');
      } else {
        setError('Verification succeeded but no authorization token was issued.');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (!pwEval.isValid) {
      setError('Please ensure your new password satisfies all security requirements.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, password, confirmPassword);
      setSuccess('Your password has been successfully reset! You may now sign in.');
      setIdentifier(email);
      setPassword('');
      setConfirmPassword('');
      setActiveTab('login');
    } catch (err) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for formatting mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal__header">
          <div className="auth-modal__title-row">
            <div className="auth-modal__icon-box">
              {activeTab === 'forgot' || activeTab === 'otp' || activeTab === 'reset' ? (
                <KeyRound size={20} color="#06b6d4" />
              ) : (
                <Sparkles size={20} color="#06b6d4" />
              )}
            </div>
            <div>
              <h2 className="auth-modal__title">
                {activeTab === 'login' && 'Sign In to Universe'}
                {activeTab === 'register' && 'Create Your Account'}
                {activeTab === 'forgot' && 'Reset Account Password'}
                {activeTab === 'otp' && 'Verify Email OTP'}
                {activeTab === 'reset' && 'Set New Password'}
              </h2>
              <p className="auth-modal__subtitle">
                {activeTab === 'login' && 'Access cloud-synced progress and customized learning paths'}
                {activeTab === 'register' && 'Start your persistent journey across Data Science, ML & Deep Learning'}
                {activeTab === 'forgot' && 'Enter your registered email to receive a 6-digit recovery code'}
                {activeTab === 'otp' && `Enter the 6-digit code sent to ${email}`}
                {activeTab === 'reset' && 'Create a strong, secure new password for your account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="auth-modal__close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informational Message Banner */}
        {message && (
          <div className="auth-modal__message-banner">
            <span>{message}</span>
          </div>
        )}

        {/* Tab Switcher (Visible in Login & Register) */}
        {(activeTab === 'login' || activeTab === 'register') && (
          <div className="auth-modal__tabs">
            <button
              type="button"
              className={`auth-modal__tab ${activeTab === 'login' ? 'auth-modal__tab--active' : ''}`}
              onClick={() => switchTab('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-modal__tab ${activeTab === 'register' ? 'auth-modal__tab--active' : ''}`}
              onClick={() => switchTab('register')}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="auth-modal__alert auth-modal__alert--error" role="alert">
            <AlertCircle size={15} className="auth-modal__alert-icon" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="auth-modal__alert auth-modal__alert--success" role="status">
            <CheckCircle2 size={15} className="auth-modal__alert-icon" />
            <span>{success}</span>
          </div>
        )}

        {/* ── 1. LOGIN FORM ── */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="auth-modal__form">
            <div className="auth-modal__field">
              <label htmlFor="auth-identifier">Username or Email Address</label>
              <div className="auth-modal__input-wrapper">
                <AtSign size={16} className="auth-modal__input-icon" />
                <input
                  id="auth-identifier"
                  type="text"
                  required
                  placeholder="e.g. adanerd or ada@lovelace.org"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-modal__field">
              <div className="auth-modal__label-row">
                <label htmlFor="auth-password">Password</label>
                <button
                  type="button"
                  className="auth-modal__inline-link"
                  onClick={() => switchTab('forgot')}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="auth-modal__input-wrapper">
                <Lock size={16} className="auth-modal__input-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-modal__visibility-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-modal__actions">
              <Button
                type="submit"
                variant="primary"
                className="auth-modal__submit-btn"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In →'}
              </Button>
            </div>

            <div className="auth-modal__switch-link-row">
              <span>Don&apos;t have an account yet?</span>
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchTab('register')}
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* ── 2. REGISTER FORM ── */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="auth-modal__form">
            <div className="auth-modal__field">
              <label htmlFor="reg-name">Full Name</label>
              <div className="auth-modal__input-wrapper">
                <User size={16} className="auth-modal__input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="e.g. Ada Lovelace"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-modal__field">
              <div className="auth-modal__label-row">
                <label htmlFor="reg-username">Username</label>
                {usernameStatus.available !== null && (
                  <span
                    className={`auth-modal__availability-badge ${
                      usernameStatus.available ? 'badge--success' : 'badge--error'
                    }`}
                  >
                    {usernameStatus.available ? '✓ Available' : '✗ Taken'}
                  </span>
                )}
              </div>
              <div className="auth-modal__input-wrapper">
                <AtSign size={16} className="auth-modal__input-icon" />
                <input
                  id="reg-username"
                  type="text"
                  required
                  placeholder="e.g. adalovelace"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUsername(val);
                    if (val.trim().length < 3) {
                      setUsernameStatus({ checking: false, available: null, reason: '' });
                    }
                  }}
                  autoComplete="username"
                />
              </div>
              <span className="auth-modal__field-hint">
                Letters, numbers, underscores, and hyphens (3–30 characters).
              </span>
            </div>

            <div className="auth-modal__field">
              <label htmlFor="reg-email">Email Address</label>
              <div className="auth-modal__input-wrapper">
                <Mail size={16} className="auth-modal__input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="learner@space.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-modal__field">
              <div className="auth-modal__label-row">
                <label htmlFor="reg-password">Password</label>
                {pwEval.label && (
                  <span
                    className="auth-modal__strength-label"
                    style={{ color: pwEval.color }}
                  >
                    {pwEval.label}
                  </span>
                )}
              </div>
              <div className="auth-modal__input-wrapper">
                <Lock size={16} className="auth-modal__input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 chars with upper, lower, num & special"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-modal__visibility-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="auth-modal__strength-meter">
                  <div
                    className="auth-modal__strength-bar"
                    style={{
                      width: `${(pwEval.score / 4) * 100}%`,
                      backgroundColor: pwEval.color,
                    }}
                  />
                </div>
              )}

              {/* Live Checklist */}
              {password && (
                <div className="auth-modal__pwd-checklist">
                  <div className={`chk-item ${pwEval.checks.length ? 'chk-ok' : ''}`}>
                    {pwEval.checks.length ? '✓' : '•'} 8+ characters
                  </div>
                  <div
                    className={`chk-item ${
                      pwEval.checks.hasUpper && pwEval.checks.hasLower ? 'chk-ok' : ''
                    }`}
                  >
                    {pwEval.checks.hasUpper && pwEval.checks.hasLower ? '✓' : '•'} Upper & lower case
                  </div>
                  <div className={`chk-item ${pwEval.checks.hasDigit ? 'chk-ok' : ''}`}>
                    {pwEval.checks.hasDigit ? '✓' : '•'} At least 1 number
                  </div>
                  <div className={`chk-item ${pwEval.checks.hasSpecial ? 'chk-ok' : ''}`}>
                    {pwEval.checks.hasSpecial ? '✓' : '•'} Special char (!@#$...)
                  </div>
                  {(!pwEval.checks.noUsername || !pwEval.checks.noEmailPrefix) && (
                    <div className="chk-item chk-warn">
                      ⚠ Cannot contain username or email prefix
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="auth-modal__field">
              <label htmlFor="reg-confirm-password">Confirm Password</label>
              <div className="auth-modal__input-wrapper">
                <Lock size={16} className="auth-modal__input-icon" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-modal__visibility-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="auth-modal__field-error">Passwords do not match.</span>
              )}
            </div>

            <label className="auth-modal__checkbox-label">
              <input
                type="checkbox"
                checked={transferProgress}
                onChange={(e) => setTransferProgress(e.target.checked)}
              />
              <span className="auth-modal__checkbox-text">
                <ShieldCheck size={16} color="#10b981" />
                Transfer existing guest progress to this new cloud account
              </span>
            </label>

            <div className="auth-modal__actions">
              <Button
                type="submit"
                variant="primary"
                className="auth-modal__submit-btn"
                disabled={loading || (confirmPassword && password !== confirmPassword)}
              >
                {loading ? 'Creating Account...' : 'Create Account & Sync →'}
              </Button>
            </div>

            <div className="auth-modal__switch-link-row">
              <span>Already have an account?</span>
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchTab('login')}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── 3. FORGOT PASSWORD FORM ── */}
        {activeTab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="auth-modal__form">
            <div className="auth-modal__field">
              <label htmlFor="forgot-email">Registered Email Address</label>
              <div className="auth-modal__input-wrapper">
                <Mail size={16} className="auth-modal__input-icon" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="e.g. learner@space.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <span className="auth-modal__field-hint">
                A 6-digit numeric OTP will be delivered to this email address to verify your account.
              </span>
            </div>

            <div className="auth-modal__actions">
              <Button
                type="submit"
                variant="primary"
                className="auth-modal__submit-btn"
                disabled={loading}
              >
                {loading ? 'Dispatching OTP...' : 'Send Verification Code →'}
              </Button>
            </div>

            <div className="auth-modal__switch-link-row">
              <span>Remembered your password?</span>
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchTab('login')}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── 4. OTP VERIFICATION FORM ── */}
        {activeTab === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="auth-modal__form">
            <div className="auth-modal__otp-info-card">
              <div className="auth-modal__otp-email-row">
                <span className="auth-modal__otp-target">{email}</span>
                <button
                  type="button"
                  className="auth-modal__inline-link"
                  onClick={() => switchTab('forgot')}
                >
                  Change Email
                </button>
              </div>
              <div className="auth-modal__otp-timer-row">
                <span className="auth-modal__otp-timer">
                  <Clock size={14} color="#facc15" />
                  Code expires in {formatTime(otpExpirySeconds)}
                </span>
                <button
                  type="button"
                  className="auth-modal__resend-btn"
                  onClick={handleResendOTP}
                  disabled={loading || resendCooldown > 0}
                >
                  <RefreshCw size={12} className={loading ? 'spin' : ''} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>

            <div className="auth-modal__field">
              <label htmlFor="otp-input" className="auth-modal__otp-label">
                6-Digit Verification Code
              </label>
              <div className="auth-modal__otp-input-wrapper">
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="••••••"
                  className="auth-modal__otp-digits-input"
                  value={otp}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(cleaned);
                  }}
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <div className="auth-modal__actions">
              <Button
                type="submit"
                variant="primary"
                className="auth-modal__submit-btn"
                disabled={loading || otp.length !== 6 || otpExpirySeconds === 0}
              >
                {loading ? 'Verifying OTP...' : 'Verify Code & Proceed →'}
              </Button>
            </div>

            <div className="auth-modal__switch-link-row">
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchTab('login')}
              >
                Cancel and return to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── 5. RESET PASSWORD FORM ── */}
        {activeTab === 'reset' && (
          <form onSubmit={handleResetPassword} className="auth-modal__form">
            <div className="auth-modal__field">
              <div className="auth-modal__label-row">
                <label htmlFor="reset-new-pwd">New Password</label>
                {pwEval.label && (
                  <span
                    className="auth-modal__strength-label"
                    style={{ color: pwEval.color }}
                  >
                    {pwEval.label}
                  </span>
                )}
              </div>
              <div className="auth-modal__input-wrapper">
                <Lock size={16} className="auth-modal__input-icon" />
                <input
                  id="reset-new-pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Choose a strong new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-modal__visibility-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="auth-modal__strength-meter">
                  <div
                    className="auth-modal__strength-bar"
                    style={{
                      width: `${(pwEval.score / 4) * 100}%`,
                      backgroundColor: pwEval.color,
                    }}
                  />
                </div>
              )}

              {/* Checklist */}
              {password && (
                <div className="auth-modal__pwd-checklist">
                  <div className={`chk-item ${pwEval.checks.length ? 'chk-ok' : ''}`}>
                    {pwEval.checks.length ? '✓' : '•'} 8+ characters
                  </div>
                  <div
                    className={`chk-item ${
                      pwEval.checks.hasUpper && pwEval.checks.hasLower ? 'chk-ok' : ''
                    }`}
                  >
                    {pwEval.checks.hasUpper && pwEval.checks.hasLower ? '✓' : '•'} Upper & lower case
                  </div>
                  <div className={`chk-item ${pwEval.checks.hasDigit ? 'chk-ok' : ''}`}>
                    {pwEval.checks.hasDigit ? '✓' : '•'} At least 1 number
                  </div>
                  <div className={`chk-item ${pwEval.checks.hasSpecial ? 'chk-ok' : ''}`}>
                    {pwEval.checks.hasSpecial ? '✓' : '•'} Special char (!@#$...)
                  </div>
                  <div className="chk-item chk-warn">
                    • Cannot be identical to previous password
                  </div>
                </div>
              )}
            </div>

            <div className="auth-modal__field">
              <label htmlFor="reset-confirm-pwd">Confirm New Password</label>
              <div className="auth-modal__input-wrapper">
                <Lock size={16} className="auth-modal__input-icon" />
                <input
                  id="reset-confirm-pwd"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-modal__visibility-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="auth-modal__field-error">Passwords do not match.</span>
              )}
            </div>

            <div className="auth-modal__actions">
              <Button
                type="submit"
                variant="primary"
                className="auth-modal__submit-btn"
                disabled={loading || (confirmPassword && password !== confirmPassword)}
              >
                {loading ? 'Updating Password...' : 'Save New Password & Sign In →'}
              </Button>
            </div>

            <div className="auth-modal__switch-link-row">
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchTab('login')}
              >
                Cancel and return to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Guest Path Footer (Shown on Login & Register) */}
        {(activeTab === 'login' || activeTab === 'register') && (
          <div className="auth-modal__guest-box">
            <div className="auth-modal__guest-info">
              <span className="auth-modal__guest-badge">Guest Mode</span>
              <p>
                No account required. All public learning roadmaps, laboratories, and mathematical tools are 100% accessible to guest learners.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={ArrowRight}
              onClick={continueAsGuest}
              className="auth-modal__guest-btn"
            >
              Continue as Guest
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthModal() {
  const {
    authModalState,
    closeAuthModal,
    login,
    register,
    forgotPassword,
    verifyOTP,
    resetPassword,
    continueAsGuest,
  } = useAuth();
  const { isOpen, tab = 'login', message = '', initialData = {} } = authModalState;

  if (!isOpen) return null;

  return (
    <AuthModalDialog
      key={`${tab}:${isOpen}`}
      tab={tab}
      message={message}
      initialData={initialData}
      onClose={closeAuthModal}
      login={login}
      register={register}
      forgotPassword={forgotPassword}
      verifyOTP={verifyOTP}
      resetPassword={resetPassword}
      continueAsGuest={continueAsGuest}
    />
  );
}
