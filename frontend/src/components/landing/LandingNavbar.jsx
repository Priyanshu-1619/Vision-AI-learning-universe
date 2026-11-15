import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Search, User, LogOut, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import LandingSearchModal from './LandingSearchModal';
import Button from '../common/Button';
import './LandingNavbar.css';

export default function LandingNavbar() {
  const navigate = useNavigate();
  const { user, isGuest, logout, openAuthModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'EXPLORE', path: '/dashboard' },
    { label: 'DATA SCIENCE', path: '/data-science' },
    { label: 'MACHINE LEARNING', path: '/machine-learning' },
    { label: 'DEEP LEARNING', path: '/deep-learning' },
    { label: 'CONCEPT UNIVERSE', path: '/concept-universe' },
    { label: 'LABORATORY', path: '/laboratory' },
  ];

  const handleNavClick = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav__container">
          {/* Brand Logo */}
          <Link to="/" className="landing-nav__brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="landing-nav__logo-box">
              <Brain size={24} className="landing-nav__logo-icon" />
            </div>
            <div className="landing-nav__brand-text">
              <span className="landing-nav__brand-title">AI LEARNING UNIVERSE</span>
              <span className="landing-nav__brand-badge">INTERACTIVE</span>
            </div>
          </Link>

          {/* Desktop Center Links */}
          <nav className="landing-nav__links" aria-label="Main Navigation">
            {navLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                className="landing-nav__link-btn"
                onClick={() => handleNavClick(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="landing-nav__actions">
            <button
              type="button"
              className="landing-nav__search-btn"
              onClick={() => setSearchOpen(true)}
              title="Search AI concepts (Press /)"
              aria-label="Search concepts"
            >
              <Search size={18} />
              <span className="landing-nav__search-hint">Search</span>
            </button>

            {isGuest ? (
              <button
                type="button"
                className="landing-nav__signin-btn"
                onClick={() => openAuthModal('login')}
              >
                Sign In
              </button>
            ) : (
              <div className="landing-nav__user-badge">
                <User size={15} color="#10b981" />
                <span className="landing-nav__user-name">{user?.displayName || 'Learner'}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="landing-nav__logout-btn"
                  title="Sign out of cloud profile"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}

            <Button
              variant="primary"
              className="landing-nav__cta-btn"
              onClick={() => navigate('/dashboard')}
            >
              GET STARTED
              <ArrowRight size={15} />
            </Button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="landing-nav__mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="landing-nav__mobile-drawer">
            <div className="landing-nav__mobile-links">
              {navLinks.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="landing-nav__mobile-link"
                  onClick={() => handleNavClick(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="landing-nav__mobile-actions">
              <button
                type="button"
                className="landing-nav__mobile-search-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
              >
                <Search size={18} />
                <span>Search 316 Concepts</span>
              </button>

              {isGuest ? (
                <Button
                  variant="secondary"
                  className="landing-nav__mobile-signin"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                >
                  Sign In / Create Account
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="landing-nav__mobile-signin"
                >
                  Sign Out ({user?.displayName})
                </button>
              )}

              <Button
                variant="primary"
                onClick={() => handleNavClick('/dashboard')}
                className="landing-nav__mobile-cta"
              >
                EXPLORE AS GUEST →
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Concept Quick Search Modal */}
      <LandingSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
