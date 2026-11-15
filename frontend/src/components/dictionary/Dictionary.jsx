import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  BookA,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Languages,
  Map,
  Copy,
  Check,
} from 'lucide-react';
import { fetchDictionary } from '../../api/client';
import { useConcepts } from '../../hooks/useConcepts';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';
import './Dictionary.css';

const DOMAIN_TABS = [
  { id: '', label: 'All Domains' },
  { id: 'data-science', label: 'Data Science', color: 'var(--accent-blue, #38BDF8)' },
  { id: 'machine-learning', label: 'Machine Learning', color: 'var(--accent-primary, #10B981)' },
  { id: 'deep-learning', label: 'Deep Learning', color: 'var(--accent-warm, #F59E0B)' },
];

const LEVEL_PILLS = [
  { id: '', label: 'All Levels' },
  { id: 'basic', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getTermHinglish(term) {
  if (term.id === 'linear-regression') {
    return 'Linear Regression ka basic matlab hai data points ke beech ek best-fit line draw karna jisse future continuous values predict ki jaa sakein.';
  }
  if (term.id === 'kmeans-clustering') {
    return 'K-Means ek unsupervised clustering method hai jo data ko k alag-alag groups me distribute karta hai unke centroid distance ke aadhar par.';
  }
  if (term.id === 'gradient-descent') {
    return 'Gradient Descent ek optimization algorithm hai jo loss function ke slope (dhalan) ke opposite direction me kadam badhakar error ko zero ki taraf le jaata hai.';
  }
  return `${term.title} ka aasaan Hinglish matlab: ${term.definition?.slice(0, 140)}... Iska prayog data patterns ko samajhne aur accurate model predictions ke liye hota hai.`;
}

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
  const [globalHinglish, setGlobalHinglish] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const sectionRefs = useRef({});

  // Debounce search input by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);
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

  const copyFormula = (formulaText, termId, e) => {
    e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(formulaText);
      setCopiedId(termId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="dictionary fade-in">
      {/* Header */}
      <header className="dictionary__header">
        <div className="dictionary__title-box">
          <div className="dictionary__icon-wrap">
            <BookA size={30} className="text-warm" />
          </div>
          <div>
            <div className="dictionary__badge-row">
              <span className="dict-eyebrow">Comprehensive Knowledge Base</span>
              <span className="dict-total-pill">{totalCount} Validated Entries</span>
            </div>
            <h1 className="dictionary__title">AI &amp; Machine Learning Dictionary</h1>
            <p className="dictionary__desc">
              Authoritative terminology definitions, mathematical formulations, Hinglish intuition, and cross-references for students and practitioners.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="dictionary__search-wrap">
          <Search size={18} className="dictionary__search-icon" />
          <input
            type="text"
            className="dictionary__search-input"
            placeholder="Search concepts, mathematical symbols, or definitions (e.g. gradient descent, eigenvalues, tensor)..."
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
                style={tab.color && selectedDomain === tab.id ? { borderColor: tab.color, color: '#F3F4F6' } : {}}
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

          <button
            type="button"
            className={`dict-hinglish-toggle ${globalHinglish ? 'dict-hinglish-toggle--active' : ''}`}
            onClick={() => setGlobalHinglish(!globalHinglish)}
            title="Toggle Hinglish explanations across dictionary"
          >
            <Languages size={14} />
            <span>Hinglish View {globalHinglish ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Results Counter */}
        <div className="dictionary__meta-row">
          <span className="dictionary__count">
            Showing <strong>{totalCount}</strong> {totalCount === 1 ? 'entry' : 'entries'} in dictionary
          </span>
        </div>
      </header>

      {/* Main Content with Alphabet Quick-Jump */}
      <div className="dictionary__layout">
        {/* Results Grid / Grouped Sections */}
        <main className="dictionary__main">
          {loading ? (
            <Loading text="Searching dictionary terms..." />
          ) : terms.length === 0 ? (
            <div className="dictionary__empty">
              <h3>No terminology matches found</h3>
              <p>Try searching for a different keyword or resetting your domain/level filters.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDomain('');
                  setSelectedLevel('');
                }}
              >
                Reset Search Filters
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
                            ? 'var(--accent-blue)'
                            : term.domain === 'deep-learning'
                              ? 'var(--accent-warm)'
                              : 'var(--accent-primary)';

                        const formulasList =
                          term.formulas || term.mathematics?.formulas || [];

                        return (
                          <Card
                            key={term.id}
                            className={`dict-card ${isExpanded ? 'dict-card--expanded' : ''}`}
                            hoverable={true}
                            onClick={() => toggleExpand(term.id)}
                          >
                            <div className="dict-card__head">
                              <div className="dict-card__title-box">
                                <span className="dict-card__icon">{term.icon || '📖'}</span>
                                <div>
                                  <h3 className="dict-card__title">{term.title}</h3>
                                  <span className="dict-card__category">{term.category}</span>
                                </div>
                              </div>
                              <div className="dict-card__badges">
                                <span
                                  className="dict-pill"
                                  style={{ borderColor: domainColor, color: domainColor }}
                                >
                                  {term.domain || 'ML'}
                                </span>
                                <span className="dict-pill dict-pill--gray">
                                  {term.level || term.difficulty || 'Beginner'}
                                </span>
                              </div>
                            </div>

                            <p className="dict-card__definition">
                              {isExpanded
                                ? term.definition
                                : `${term.definition?.slice(0, 130)}${term.definition?.length > 130 ? '…' : ''}`}
                            </p>

                            {/* Global or expanded Hinglish preview */}
                            {globalHinglish && (
                              <div className="dict-card__hinglish-strip">
                                <span className="dict-card__hinglish-label">Hinglish:</span>
                                <span>{getTermHinglish(term)}</span>
                              </div>
                            )}

                            {isExpanded && (
                              <div
                                className="dict-card__expanded-content"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {term.beginnerExplanation && (
                                  <div className="dict-card__section">
                                    <span className="dict-card__label">Plain English Intuition</span>
                                    <p className="dict-card__text">{term.beginnerExplanation}</p>
                                  </div>
                                )}

                                {!globalHinglish && (
                                  <div className="dict-card__section dict-card__section--hinglish">
                                    <span className="dict-card__label">Hinglish Explanation</span>
                                    <p className="dict-card__text">{getTermHinglish(term)}</p>
                                  </div>
                                )}

                                {term.example && (
                                  <div className="dict-card__section">
                                    <span className="dict-card__label">Real-World Analogy &amp; Example</span>
                                    <p className="dict-card__text dict-card__text--example">{term.example}</p>
                                  </div>
                                )}

                                {formulasList.length > 0 && (
                                  <div className="dict-card__formulas">
                                    <div className="dict-card__formula-head">
                                      <span className="dict-card__label">Key Mathematical Formula</span>
                                      <button
                                        type="button"
                                        className="dict-copy-btn"
                                        onClick={(e) => copyFormula(formulasList[0], term.id, e)}
                                      >
                                        {copiedId === term.id ? (
                                          <Check size={12} className="text-emerald" />
                                        ) : (
                                          <Copy size={12} />
                                        )}
                                        <span>{copiedId === term.id ? 'Copied' : 'Copy'}</span>
                                      </button>
                                    </div>
                                    {formulasList.map((f, idx) => (
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
                                    size="sm"
                                    icon={ExternalLink}
                                    onClick={() => navigate(`/concept/${term.id}`)}
                                  >
                                    View Full 14-Step Lesson
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={Map}
                                    onClick={() => navigate(`/roadmaps/${term.domain || 'data-science'}`)}
                                  >
                                    View in Roadmap
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
                                    <span>Detailed explanation, formula &amp; examples</span>
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
