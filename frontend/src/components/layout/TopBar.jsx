import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useConcepts } from '../../hooks/useConcepts';
import './TopBar.css';

const routeLabels = {
  '/': 'Dashboard',
  '/knowledge-graph': 'Knowledge Graph',
  '/concept-universe': 'Concept Universe',
  '/laboratory': 'Laboratory',
  '/mathematics': 'Mathematics',
  '/inside-model': 'Inside the Model',
  '/break-it': 'Break It!',
  '/what-if': 'What If?',
  '/challenges': 'Challenges',
  '/debugging': 'Debugging Lab',
  '/evolution': 'Evolution',
  '/missions': 'Missions',
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { concepts } = useConcepts();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const isConceptPage = location.pathname.startsWith('/concept/');
  const activeConcept = useMemo(() => {
    if (!isConceptPage) return null;
    const conceptId = location.pathname.replace('/concept/', '');
    return concepts.find((c) => c.id === conceptId) || { id: conceptId, title: conceptId };
  }, [isConceptPage, location.pathname, concepts]);

  const currentLabel = isConceptPage
    ? activeConcept?.title || 'Concept Detail'
    : routeLabels[location.pathname] || 'AI Learning Universe';

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
      <div className="topbar__breadcrumb">
        <Link to="/" className="topbar__breadcrumb-root">
          AI Universe
        </Link>
        <span className="topbar__breadcrumb-sep">/</span>
        {isConceptPage && (
          <>
            <Link to="/knowledge-graph" className="topbar__breadcrumb-root">
              Knowledge Graph
            </Link>
            <span className="topbar__breadcrumb-sep">/</span>
          </>
        )}
        <span className="topbar__breadcrumb-current">{currentLabel}</span>
      </div>

      <div className="topbar__search-wrap" onBlur={handleBlur}>
        <div className="topbar__search">
          <Search size={16} className="topbar__search-icon" />
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
            placeholder="Search concepts by name or category..."
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
              <X size={14} />
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
                  <span className="topbar__dropdown-icon">{concept.icon}</span>
                  <div className="topbar__dropdown-info">
                    <span className="topbar__dropdown-title">{concept.title}</span>
                    <span className="topbar__dropdown-meta">
                      <span
                        className="topbar__dropdown-dot"
                        style={{ background: concept.color || '#06b6d4' }}
                      />
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
    </header>
  );
}
