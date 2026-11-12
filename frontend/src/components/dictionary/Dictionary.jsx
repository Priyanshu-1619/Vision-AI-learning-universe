import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, BookA, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchDictionary } from '../../api/client';
import { useConcepts } from '../../hooks/useConcepts';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loading from '../common/Loading';
import './Dictionary.css';

const DOMAIN_TABS = [
  { id: '', label: 'All Domains' },
  { id: 'data-science', label: 'Data Science', color: 'var(--ds-accent)' },
  { id: 'machine-learning', label: 'Machine Learning', color: 'var(--ml-accent)' },
  { id: 'deep-learning', label: 'Deep Learning', color: 'var(--dl-accent)' },
];

const LEVEL_PILLS = [
  { id: '', label: 'All Levels' },
  { id: 'basic', label: 'Basic' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Dictionary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { concepts: fallbackConcepts } = useConcepts();

  const initialSearch = searchParams.get('search') || '';
  const initialDomain = searchParams.get('domain') || '';
  const initialLevel = searchParams.get('level') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const [terms, setTerms] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const sectionRefs = useRef({});

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch from API or fallback to client filtering
  useEffect(() => {
    let cancelled = false;

    fetchDictionary(debouncedSearch, selectedDomain, selectedLevel)
      .then((res) => {
        if (!cancelled) {
          if (res && Array.isArray(res.terms)) {
            setTerms(res.terms);
            setTotalCount(res.total ?? res.terms.length);
          } else {
            // Client-side fallback filter
            let filtered = [...fallbackConcepts];
            if (debouncedSearch) {
              const q = debouncedSearch.toLowerCase();
              filtered = filtered.filter(
                (c) =>
                  c.title.toLowerCase().includes(q) ||
                  (c.definition && c.definition.toLowerCase().includes(q))
              );
            }
            if (selectedDomain) {
              filtered = filtered.filter((c) => {
                if (c.domain) return c.domain === selectedDomain;
                if (selectedDomain === 'data-science') {
                  return ['Foundations', 'Mathematics', 'Data Science'].includes(c.category);
                }
                if (selectedDomain === 'deep-learning') {
                  return c.category === 'Deep Learning';
                }
                return !['Foundations', 'Mathematics', 'Data Science', 'Deep Learning'].includes(c.category);
              });
            }
            if (selectedLevel) {
              filtered = filtered.filter((c) => {
                const lvl = c.level || (c.difficulty === 'Beginner' ? 'basic' : c.difficulty === 'Advanced' ? 'advanced' : 'intermediate');
                return lvl === selectedLevel;
              });
            }
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            setTerms(filtered);
            setTotalCount(filtered.length);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTerms([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedDomain, selectedLevel, fallbackConcepts]);

  const handleSearchChange = (val) => {
    setLoading(true);
    setSearchTerm(val);
  };

  const handleDomainChange = (domainId) => {
    setLoading(true);
    setSelectedDomain(domainId);
  };

  const handleLevelChange = (levelId) => {
    setLoading(true);
    setSelectedLevel(levelId);
  };

  // Group terms by first letter for alphabet jumps
  const groupedTerms = useMemo(() => {
    const groups = {};
    for (const term of terms) {
      const letter = (term.title[0] || '#').toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    }
    return groups;
  }, [terms]);

  const activeLetters = useMemo(() => new Set(Object.keys(groupedTerms)), [groupedTerms]);

  const scrollToLetter = (letter) => {
    const el = sectionRefs.current[letter];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="dictionary fade-in">
      {/* Header */}
      <header className="dictionary__header">
        <div className="dictionary__title-box">
          <div className="dictionary__icon-wrap">
            <BookA size={32} color="var(--accent-yellow, #FFD928)" />
          </div>
          <div>
            <h1 className="dictionary__title">AI &amp; Machine Learning Dictionary</h1>
            <p className="dictionary__desc">
              Comprehensive reference guide for key terminology, mathematical formulations, and foundational concepts.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="dictionary__search-wrap">
          <Search size={18} className="dictionary__search-icon" />
          <input
            type="text"
            className="dictionary__search-input"
            placeholder="Search concepts, mathematical symbols, or definitions..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="dictionary__search-clear"
              onClick={() => handleSearchChange('')}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="dictionary__filters">
          <div className="dictionary__domain-tabs" role="tablist">
            {DOMAIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`dict-domain-tab ${selectedDomain === tab.id ? 'dict-domain-tab--active' : ''}`}
                onClick={() => handleDomainChange(tab.id)}
                style={tab.color && selectedDomain === tab.id ? { borderColor: tab.color, color: tab.color } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="dictionary__level-pills">
            {LEVEL_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                className={`dict-level-pill ${selectedLevel === pill.id ? 'dict-level-pill--active' : ''}`}
                onClick={() => handleLevelChange(pill.id)}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="dictionary__meta-row">
          <span className="dictionary__count">
            Showing <strong>{totalCount}</strong> {totalCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </header>

      {/* Main Content with Alphabet Quick-Jump */}
      <div className="dictionary__layout">
        {/* Results Grid / Grouped Sections */}
        <main className="dictionary__main">
          {loading ? (
            <Loading text="Searching dictionary..." />
          ) : terms.length === 0 ? (
            <div className="dictionary__empty">
              <h3>No terms found matching your search</h3>
              <p>Try searching for a different concept or resetting your domain/level filters.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDomain('');
                  setSelectedLevel('');
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="dictionary__sections">
              {Object.keys(groupedTerms)
                .sort()
                .map((letter) => (
                  <section
                    key={letter}
                    ref={(el) => (sectionRefs.current[letter] = el)}
                    className="dictionary__letter-section"
                  >
                    <div className="dictionary__letter-anchor">
                      <span className="dictionary__letter-char">{letter}</span>
                      <span className="dictionary__letter-line" />
                    </div>

                    <div className="dictionary__cards-grid">
                      {groupedTerms[letter].map((term) => {
                        const isExpanded = expandedId === term.id;
                        const domainColor =
                          term.domain === 'data-science'
                            ? 'var(--ds-accent)'
                            : term.domain === 'deep-learning'
                              ? 'var(--dl-accent)'
                              : 'var(--ml-accent)';

                        return (
                          <Card
                            key={term.id}
                            className={`dict-card ${isExpanded ? 'dict-card--expanded' : ''}`}
                            hoverable={true}
                            onClick={() => toggleExpand(term.id)}
                          >
                            <div className="dict-card__head">
                              <div className="dict-card__title-box">
                                <span className="dict-card__icon">{term.icon}</span>
                                <div>
                                  <h3 className="dict-card__title">{term.title}</h3>
                                  <span className="dict-card__category">{term.category}</span>
                                </div>
                              </div>
                              <div className="dict-card__badges">
                                <Badge
                                  text={term.domain || 'ML'}
                                  color={domainColor}
                                  size="sm"
                                />
                                <Badge
                                  text={term.level || term.difficulty || 'basic'}
                                  color="#38bdf8"
                                  size="sm"
                                />
                              </div>
                            </div>

                            <p className="dict-card__definition">
                              {isExpanded
                                ? term.definition
                                : `${term.definition?.slice(0, 130)}${term.definition?.length > 130 ? '…' : ''}`}
                            </p>

                            {isExpanded && (
                              <div
                                className="dict-card__expanded-content"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {term.beginnerExplanation && (
                                  <div className="dict-card__section">
                                    <span className="dict-card__label">Beginner Intuition</span>
                                    <p className="dict-card__text">{term.beginnerExplanation}</p>
                                  </div>
                                )}

                                {term.example && (
                                  <div className="dict-card__section">
                                    <span className="dict-card__label">Real-World Example</span>
                                    <p className="dict-card__text dict-card__text--example">{term.example}</p>
                                  </div>
                                )}

                                {(term.formulas?.length > 0 || term.mathematics?.formulas?.length > 0) && (
                                  <div className="dict-card__formulas">
                                    <span className="dict-card__label">Key Formula</span>
                                    {(term.formulas || term.mathematics?.formulas || []).map((f, idx) => (
                                      <code key={idx} className="dict-card__code">
                                        {f}
                                      </code>
                                    ))}
                                  </div>
                                )}

                                {(term.mathExplanation || term.mathematics?.explanation) && (
                                  <div className="dict-card__section">
                                    <span className="dict-card__label">Mathematical Formulation</span>
                                    <p className="dict-card__text">
                                      {term.mathExplanation || term.mathematics?.explanation}
                                    </p>
                                  </div>
                                )}

                                {term.relatedConcepts && term.relatedConcepts.length > 0 && (
                                  <div className="dict-card__section">
                                    <span className="dict-card__label">Related Concepts</span>
                                    <div className="dict-card__related-chips">
                                      {term.relatedConcepts.map((relId) => (
                                        <button
                                          key={relId}
                                          type="button"
                                          className="dict-related-chip"
                                          onClick={() => navigate(`/concept/${relId}`)}
                                        >
                                          {relId}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="dict-card__actions">
                                  <Button
                                    variant="secondary"
                                    icon={ExternalLink}
                                    onClick={() => navigate(`/concept/${term.id}`)}
                                  >
                                    View Full Concept Theory
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="dict-card__foot">
                              <button
                                type="button"
                                className="dict-card__toggle-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(term.id);
                                }}
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Show less</span>
                                    <ChevronUp size={14} />
                                  </>
                                ) : (
                                  <>
                                    <span>Expand details</span>
                                    <ChevronDown size={14} />
                                  </>
                                )}
                              </button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </main>

        {/* Alphabet Jump Sidebar */}
        <aside className="dictionary__alpha-nav" aria-label="Alphabet Jump Bar">
          <div className="dictionary__alpha-nav-inner">
            {ALPHABET.map((char) => {
              const hasItems = activeLetters.has(char);
              return (
                <button
                  key={char}
                  type="button"
                  className={`alpha-btn ${hasItems ? 'alpha-btn--active' : 'alpha-btn--disabled'}`}
                  disabled={!hasItems}
                  onClick={() => scrollToLetter(char)}
                  title={hasItems ? `Jump to ${char}` : `No entries starting with ${char}`}
                >
                  {char}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
