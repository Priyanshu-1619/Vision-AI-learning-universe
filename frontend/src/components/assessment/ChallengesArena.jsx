import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  CHALLENGES,
  getChallengeProgress,
  resetChallengeProgress,
  saveChallengeAttempt,
} from './challengesData';
import TelemetryVisuals from './TelemetryVisuals';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './Assessment.css';

const DIFFICULTY_COLORS = {
  Beginner: '#10b981',
  Intermediate: '#f59e0b',
  Advanced: '#ec4899',
};

export default function ChallengesArena() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [progress, setProgress] = useState(() => getChallengeProgress());
  const [draftSelections, setDraftSelections] = useState({});
  const [revealedHints, setRevealedHints] = useState({});

  const filteredChallenges = useMemo(() => {
    if (categoryFilter === 'All') return CHALLENGES;
    return CHALLENGES.filter((c) => c.category === categoryFilter);
  }, [categoryFilter]);

  const challengeParam = searchParams.get('challenge');
  const activeChallenge = useMemo(() => {
    const found = filteredChallenges.find((c) => c.id === challengeParam);
    return found || filteredChallenges[0] || CHALLENGES[0];
  }, [filteredChallenges, challengeParam]);

  const activeIdx = filteredChallenges.findIndex((c) => c.id === activeChallenge.id);
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(CHALLENGES.map((c) => c.category)))],
    []
  );

  const solvedSet = useMemo(() => new Set(progress.solvedIds), [progress.solvedIds]);
  const attempt = progress.attempts[activeChallenge.id] || null;
  const selectedOption =
    draftSelections[activeChallenge.id] ?? attempt?.selectedOptionId ?? null;
  const hintVisible = Boolean(revealedHints[activeChallenge.id]);

  const selectChallenge = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('challenge', id);
    setSearchParams(next, { replace: true });
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    const isCorrect = selectedOption === activeChallenge.correctOptionId;
    const updated = saveChallengeAttempt(activeChallenge.id, selectedOption, isCorrect);
    setProgress(updated);
  };

  const handleResetProgress = () => {
    setProgress(resetChallengeProgress());
    setDraftSelections({});
    setRevealedHints({});
  };

  return (
    <div className="assess-page fade-in">
      <header className="assess-header">
        <div>
          <div className="assess-header__eyebrow" style={{ color: 'var(--accent-amber)' }}>
            <Trophy size={14} />
            <span>Phase 7 · AI Diagnostic Challenges</span>
          </div>
          <h1 className="assess-header__title">AI Engineering Challenges</h1>
          <p className="assess-header__subtitle">
            Inspect training telemetry, diagnose model behavior, and justify the right
            algorithm, metric, or hyperparameter fix before unlocking the rationale.
          </p>
        </div>

        <div className="assess-score-box">
          <div className="assess-score-stat">
            <span>Solved</span>
            <strong>
              {solvedSet.size} / {CHALLENGES.length}
            </strong>
          </div>
          <button
            type="button"
            className="assess-chip-btn"
            onClick={handleResetProgress}
          >
            <RotateCcw size={13} /> Reset Progress
          </button>
        </div>
      </header>

      {/* Category Filter Pills */}
      <div className="assess-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`assess-chip-btn ${categoryFilter === cat ? 'assess-chip-btn--active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="assess-layout">
        {/* Challenge List Sidebar */}
        <aside className="assess-sidebar" aria-label="AI Challenges list">
          {filteredChallenges.map((ch, idx) => {
            const isActive = ch.id === activeChallenge.id;
            const isSolved = solvedSet.has(ch.id);
            const att = progress.attempts[ch.id];

            return (
              <button
                key={ch.id}
                type="button"
                className={`assess-nav-btn ${isActive ? 'assess-nav-btn--active' : ''}`}
                onClick={() => selectChallenge(ch.id)}
              >
                <div className="assess-nav-btn__top">
                  <span className="assess-nav-num">#{idx + 1}</span>
                  <span>{ch.category}</span>
                  {isSolved ? (
                    <CheckCircle2 size={14} className="assess-icon-good" />
                  ) : att && !att.isCorrect ? (
                    <XCircle size={14} className="assess-icon-bad" />
                  ) : null}
                </div>
                <span className="assess-nav-title">{ch.title}</span>
              </button>
            );
          })}
        </aside>

        {/* Active Challenge Stage */}
        <section className="assess-stage">
          <Card hoverable={false} className="assess-stage-card">
            <div className="assess-stage-head">
              <div>
                <div className="assess-stage-badges">
                  <Badge text={activeChallenge.category} color="#f59e0b" size="md" />
                  <Badge
                    text={activeChallenge.difficulty}
                    color={DIFFICULTY_COLORS[activeChallenge.difficulty] || '#06b6d4'}
                    size="md"
                  />
                  {solvedSet.has(activeChallenge.id) && (
                    <Badge text="Solved" color="#10b981" size="md" />
                  )}
                </div>
                <h2 className="assess-stage-title">{activeChallenge.title}</h2>
              </div>

              <div className="assess-step-nav">
                <button
                  type="button"
                  className="assess-chip-btn"
                  disabled={activeIdx <= 0}
                  onClick={() => selectChallenge(filteredChallenges[activeIdx - 1].id)}
                >
                  <ArrowLeft size={14} /> Prev
                </button>
                <button
                  type="button"
                  className="assess-chip-btn"
                  disabled={activeIdx >= filteredChallenges.length - 1}
                  onClick={() => selectChallenge(filteredChallenges[activeIdx + 1].id)}
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <p className="assess-prompt">{activeChallenge.prompt}</p>

            {/* Telemetry Chart / Confusion Matrix / Bars */}
            <TelemetryVisuals telemetry={activeChallenge.telemetry} />

            {/* Optional Hint Toggle (Never reveals answer) */}
            <div className="assess-hint-row">
              <button
                type="button"
                className="assess-chip-btn"
                onClick={() =>
                  setRevealedHints((prev) => ({
                    ...prev,
                    [activeChallenge.id]: !prev[activeChallenge.id],
                  }))
                }
              >
                <Lightbulb size={14} />
                <span>{hintVisible ? 'Hide Hint' : 'Show Hint'}</span>
              </button>
              {hintVisible && (
                <span className="assess-hint-text">{activeChallenge.hint}</span>
              )}
            </div>

            {/* Multiple-Choice Options */}
            <div className="assess-options" role="radiogroup" aria-label="Challenge options">
              {activeChallenge.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isSubmitted = Boolean(attempt);
                const isOptionCorrect =
                  isSubmitted && opt.id === activeChallenge.correctOptionId;
                const isOptionWrong =
                  isSubmitted &&
                  isSelected &&
                  attempt.selectedOptionId === opt.id &&
                  !attempt.isCorrect;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`assess-option ${isSelected ? 'assess-option--selected' : ''} ${
                      isOptionCorrect ? 'assess-option--correct' : ''
                    } ${isOptionWrong ? 'assess-option--wrong' : ''}`}
                    onClick={() =>
                      setDraftSelections((prev) => ({
                        ...prev,
                        [activeChallenge.id]: opt.id,
                      }))
                    }
                  >
                    <span className="assess-option__key">{opt.id.toUpperCase()}</span>
                    <span className="assess-option__label">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="assess-submit-row">
              <Button
                icon={HelpCircle}
                disabled={!selectedOption}
                onClick={handleSubmit}
              >
                {attempt ? 'Re-Check Answer' : 'Submit Answer'}
              </Button>
              {attempt && (
                <span
                  className={`assess-verdict ${
                    attempt.isCorrect ? 'assess-verdict--good' : 'assess-verdict--bad'
                  }`}
                >
                  {attempt.isCorrect ? (
                    <>
                      <CheckCircle2 size={16} /> Correct Diagnosis!
                    </>
                  ) : (
                    <>
                      <XCircle size={16} /> Not quite — review the telemetry and rationale below.
                    </>
                  )}
                </span>
              )}
            </div>
          </Card>

          {/* STRICT DIAGNOSTIC GATE: Explanation & Lab Link ONLY appear after submission */}
          {attempt && (
            <Card hoverable={false} className="assess-unlock-card fade-in">
              <div className="assess-unlock-grid">
                <div className="assess-unlock-box">
                  <h3>Diagnostic Explanation</h3>
                  <p>{activeChallenge.explanation}</p>
                </div>
                <div className="assess-unlock-box assess-unlock-box--math">
                  <h3>Mathematical Rationale</h3>
                  <p>{activeChallenge.mathRationale}</p>
                </div>
              </div>

              <div className="assess-unlock-actions">
                {activeChallenge.relatedPath && (
                  <Button
                    icon={ExternalLink}
                    onClick={() => navigate(activeChallenge.relatedPath)}
                  >
                    {activeChallenge.relatedLabel || 'Explore Related Lab'}
                  </Button>
                )}
                {activeChallenge.conceptId && (
                  <Button
                    variant="secondary"
                    icon={ExternalLink}
                    onClick={() => navigate(`/concept/${activeChallenge.conceptId}`)}
                  >
                    Open Concept Page
                  </Button>
                )}
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
