import { useMemo, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Search, X, LogOut, User, Sparkles, Menu, Compass } from 'lucide-react';
import { useConcepts } from '../../hooks/useConcepts';
import { useAuth } from '../../context/useAuth';
import './TopBar.css';

const TOP_NAV_LINKS = [
  { label: 'Explore', path: '/roadmaps/data-science' },
  { label: 'Data Science', path: '/data-science' },
  { label: 'Machine Learning', path: '/machine-learning' },
  { label: 'Deep Learning', path: '/deep-learning' },
  { label: 'Concept Universe', path: '/concept-universe' },
  { label: 'Laboratory', path: '/laboratory' },
];

export default function TopBar() {
  const navigate = useNavigate();
  const { concepts } = useConcepts();
  const { user, isGuest, logout, openAuthModal } = useAuth();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return concepts
      .filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aStarts = a.title?.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.title?.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.title.localeCompare(b.title);
      })
      .slice(0, 8);
  }, [query, concepts]);

  const selectConcept = (concept) => {
    if (!concept) return;
    setQuery('');
    setIsOpen(false);
    setActiveIndex(0);
    inputRef.current?.blur();
    setMobileMenuOpen(false);
    navigate(`/concept/${concept.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!isOpen || matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectConcept(matches[activeIndex] || matches[0]);
    }
  };

  const handleBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <header className="topbar">
      <div className="topbar__left">
        {/* Mobile menu button */}
        <button
          type="button"
          className="topbar__mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Brand / Logo */}
        <Link to="/" className="topbar__brand" title="Vision AI Learning Universe">
          <span className="topbar__brand-icon">
            <Compass size={22} className="text-emerald" />
          </span>
          <span className="topbar__brand-text">AI Learning Universe</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="topbar__nav" aria-label="Main Navigation">
          {TOP_NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `topbar__nav-link ${isActive ? 'topbar__nav-link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="topbar__right">
        {/* Interactive Concept Search */}
        <div className="topbar__search-wrap" onBlur={handleBlur}>
          <div className="topbar__search">
            <Search size={15} className="topbar__search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setActiveIndex(0);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search concepts or math..."
              className="topbar__search-input"
              aria-label="Search concepts"
              aria-expanded={showDropdown}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="topbar__search-clear"
                aria-label="Clear search"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery('');
                  setActiveIndex(0);
                  inputRef.current?.focus();
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {showDropdown && (
            <div className="topbar__dropdown" role="listbox">
              {matches.length > 0 ? (
                matches.map((concept, idx) => (
                  <button
                    key={concept.id}
                    type="button"
                    role="option"
                    aria-selected={idx === activeIndex}
                    className={`topbar__dropdown-item ${
                      idx === activeIndex ? 'topbar__dropdown-item--active' : ''
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectConcept(concept);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="topbar__dropdown-icon">{concept.icon || '📖'}</span>
                    <div className="topbar__dropdown-info">
                      <span className="topbar__dropdown-title">{concept.title}</span>
                      <span className="topbar__dropdown-meta">
                        {concept.category} · {concept.difficulty}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="topbar__dropdown-empty">
                  No concepts matching &ldquo;{query.trim()}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Authentication & Profile Section */}
        {isGuest ? (
          <div className="topbar__auth-buttons">
            <button
              type="button"
              className="topbar__auth-btn topbar__auth-btn--login"
              onClick={() => openAuthModal('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className="topbar__auth-btn topbar__auth-btn--signup"
              onClick={() => openAuthModal('register')}
            >
              Sign Up
            </button>
            <button
              type="button"
              className="topbar__auth-btn topbar__auth-btn--cta"
              onClick={() => navigate('/dashboard')}
            >
              <Sparkles size={14} />
              Get Started
            </button>
          </div>
        ) : (
          <div className="topbar__user-section">
            <div className="topbar__user-pill" title={user.email}>
              <span className="topbar__user-status-dot" />
              <User size={14} className="topbar__user-icon" />
              <span className="topbar__user-name">
                {user.username || user.displayName || user.fullName}
              </span>
              <span className="topbar__user-streak" title="Daily Learning Streak">
                🔥 3d
              </span>
            </div>
            <button
              type="button"
              className="topbar__logout-btn"
              onClick={logout}
              title="Sign Out of Account"
              aria-label="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="topbar__mobile-menu">
          <nav className="topbar__mobile-nav">
            {TOP_NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `topbar__mobile-link ${isActive ? 'topbar__mobile-link--active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="topbar__mobile-divider" />
            <NavLink
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="topbar__mobile-link"
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/dictionary"
              onClick={() => setMobileMenuOpen(false)}
              className="topbar__mobile-link"
            >
              AI Dictionary
            </NavLink>
            <NavLink
              to="/mathematics"
              onClick={() => setMobileMenuOpen(false)}
              className="topbar__mobile-link"
            >
              Mathematics Studio
            </NavLink>
            <NavLink
              to="/missions"
              onClick={() => setMobileMenuOpen(false)}
              className="topbar__mobile-link"
            >
              AI Missions
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}
