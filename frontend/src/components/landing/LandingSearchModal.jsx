import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { useConcepts } from '../../hooks/useConcepts';
import './LandingSearchModal.css';

export default function LandingSearchModal({ isOpen, onClose }) {
  const { concepts } = useConcepts();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleClose = () => {
    setQuery('');
    setActiveIndex(0);
    onClose();
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return concepts
      .filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.domain?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, concepts]);

  if (!isOpen) return null;

  const handleSelect = (concept) => {
    if (!concept) return;
    handleClose();
    navigate(`/concept/${concept.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(1, matches.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + matches.length) % Math.max(1, matches.length));
    } else if (e.key === 'Enter' && matches.length > 0) {
      e.preventDefault();
      handleSelect(matches[activeIndex] || matches[0]);
    }
  };

  return (
    <div className="landing-search-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="landing-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="landing-search-input-box">
          <Search size={20} className="landing-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search 316 concepts, algorithms, formulas (e.g. Backprop, CNN, PCA)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              className="landing-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear query"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {query.trim().length > 0 && (
          <div className="landing-search-results">
            {matches.length === 0 ? (
              <div className="landing-search-empty">
                No matching concepts found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              matches.map((c, idx) => (
                <div
                  key={c.id}
                  className={`landing-search-item ${idx === activeIndex ? 'landing-search-item--active' : ''}`}
                  onClick={() => handleSelect(c)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div className="landing-search-item-left">
                    <span className="landing-search-item-title">{c.title}</span>
                    <span className="landing-search-item-meta">
                      {c.domain} · {c.category || c.level || 'Theory'}
                    </span>
                  </div>
                  <ArrowRight size={16} className="landing-search-arrow" />
                </div>
              ))
            )}
          </div>
        )}

        <div className="landing-search-footer">
          <div className="landing-search-shortcuts">
            <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
            <span><kbd>Enter</kbd> open</span>
            <span><kbd>Esc</kbd> close</span>
          </div>
          <span className="landing-search-badge">
            <Sparkles size={12} /> 316 Verified Concepts
          </span>
        </div>
      </div>
    </div>
  );
}
