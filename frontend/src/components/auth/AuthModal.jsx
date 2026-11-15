import { useState } from 'react';
import { X, Sparkles, User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import Button from '../common/Button';
import './AuthModal.css';

function AuthModalDialog({ tab, message, onClose, login, register, continueAsGuest }) {
  const [activeTab, setActiveTab] = useState(tab || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [transferProgress, setTransferProgress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        const res = await register(email, password, displayName, transferProgress);
        if (res?.transferredTopics > 0) {
          setSuccess(`Account created! ${res.transferredTopics} guest topics transferred to your cloud profile.`);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal__header">
          <div className="auth-modal__title-row">
            <div className="auth-modal__icon-box">
              <Sparkles size={20} color="#06b6d4" />
            </div>
            <div>
              <h2 className="auth-modal__title">
                {activeTab === 'login' ? 'Sign In to Universe' : 'Create Your Account'}
              </h2>
              <p className="auth-modal__subtitle">
                {activeTab === 'login'
                  ? 'Access cloud-synced progress and customized learning paths'
                  : 'Start your persistent journey across Data Science, ML & Deep Learning'}
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

        {/* Tab Switcher */}
        <div className="auth-modal__tabs">
          <button
            type="button"
            className={`auth-modal__tab ${activeTab === 'login' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-modal__tab ${activeTab === 'register' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
          >
            Create Account
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="auth-modal__alert auth-modal__alert--error" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="auth-modal__alert auth-modal__alert--success" role="status">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-modal__form">
          {activeTab === 'register' && (
            <div className="auth-modal__field">
              <label htmlFor="auth-name">Display Name</label>
              <div className="auth-modal__input-wrapper">
                <User size={16} className="auth-modal__input-icon" />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Ada Lovelace"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="auth-modal__field">
            <label htmlFor="auth-email">Email Address</label>
            <div className="auth-modal__input-wrapper">
              <Mail size={16} className="auth-modal__input-icon" />
              <input
                id="auth-email"
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
            <label htmlFor="auth-password">Password</label>
            <div className="auth-modal__input-wrapper">
              <Lock size={16} className="auth-modal__input-icon" />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {activeTab === 'register' && (
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
          )}

          <div className="auth-modal__actions">
            <Button
              type="submit"
              variant="primary"
              className="auth-modal__submit-btn"
              disabled={loading}
            >
              {loading
                ? 'Processing...'
                : activeTab === 'login'
                  ? 'Sign In →'
                  : 'Create Account & Sync →'}
            </Button>
          </div>
        </form>

        {/* Guest Path Footer */}
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
      </div>
    </div>
  );
}

export default function AuthModal() {
  const { authModalState, closeAuthModal, login, register, continueAsGuest } = useAuth();
  const { isOpen, tab = 'login', message = '' } = authModalState;

  if (!isOpen) return null;

  return (
    <AuthModalDialog
      key={`${tab}:${isOpen}`}
      tab={tab}
      message={message}
      onClose={closeAuthModal}
      login={login}
      register={register}
      continueAsGuest={continueAsGuest}
    />
  );
}
