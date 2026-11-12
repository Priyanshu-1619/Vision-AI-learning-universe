import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bug,
  CheckCircle2,
  Code2,
  ExternalLink,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  DEBUGGING_CASES,
  getDebuggingProgress,
  resetDebuggingProgress,
  saveDebuggingAttempt,
} from './debuggingData';
import TelemetryVisuals from './TelemetryVisuals';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './Assessment.css';

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
};

export default function DebuggingSimulator() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [progress, setProgress] = useState(() => getDebuggingProgress());
  const [draftSelections, setDraftSelections] = useState({});
  const [revealedHints, setRevealedHints] = useState({});
  const [showDiffMap, setShowDiffMap] = useState({});

  const caseParam = searchParams.get('case');
  const activeCase = useMemo(() => {
    const found = DEBUGGING_CASES.find((c) => c.id === caseParam);
    return found || DEBUGGING_CASES[0];
  }, [caseParam]);

  const activeIdx = DEBUGGING_CASES.findIndex((c) => c.id === activeCase.id);
  const solvedSet = useMemo(() => new Set(progress.solvedIds), [progress.solvedIds]);
  const attempt = progress.attempts[activeCase.id] || null;
  const selectedOption =
    draftSelections[activeCase.id] ?? attempt?.selectedOptionId ?? null;
  const hintVisible = Boolean(revealedHints[activeCase.id]);
  const diffVisible = Boolean(showDiffMap[activeCase.id]);

  const selectCase = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('case', id);
    setSearchParams(next, { replace: true });
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    const isCorrect = selectedOption === activeCase.correctOptionId;
    const updated = saveDebuggingAttempt(activeCase.id, selectedOption, isCorrect);
    setProgress(updated);
  };

  const handleResetProgress = () => {
    setProgress(resetDebuggingProgress());
    setDraftSelections({});
    setRevealedHints({});
    setShowDiffMap({});
  };

  return (
    <div className="assess-page fade-in">
      <header className="assess-header">
        <div>
          <div className="assess-header__eyebrow" style={{ color: 'var(--accent-orange)' }}>
            <Bug size={14} />
            <span>Phase 7 · AI Debugging Simulator</span>
          </div>
          <h1 className="assess-header__title">Model &amp; Pipeline Debugging Lab</h1>
          <p className="assess-header__subtitle">
            Inspect failing ML pipelines, execution tracebacks, and broken training telemetry.
            Submit your root-cause diagnosis first to unlock the fix diff.
          </p>
        </div>

        <div className="assess-score-box">
          <div className="assess-score-stat">
            <span>Cases Solved</span>
            <strong>
              {solvedSet.size} / {DEBUGGING_CASES.length}
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

      <div className="assess-layout">
        {/* Debugging Scenarios Sidebar */}
        <aside className="assess-sidebar" aria-label="Debugging scenarios">
          {DEBUGGING_CASES.map((c, idx) => {
            const isActive = c.id === activeCase.id;
            const isSolved = solvedSet.has(c.id);
            const att = progress.attempts[c.id];

            return (
              <button
                key={c.id}
                type="button"
                className={`assess-nav-btn ${isActive ? 'assess-nav-btn--active' : ''}`}
                onClick={() => selectCase(c.id)}
              >
                <div className="assess-nav-btn__top">
                  <span className="assess-nav-num">0{idx + 1}</span>
                  <span>{c.category}</span>
                  {isSolved ? (
                    <CheckCircle2 size={14} className="assess-icon-good" />
                  ) : att && !att.isCorrect ? (
                    <XCircle size={14} className="assess-icon-bad" />
                  ) : null}
                </div>
                <span className="assess-nav-title">{c.title}</span>
              </button>
            );
          })}
        </aside>

        {/* Active Debugging Case Stage */}
        <section className="assess-stage">
          <Card hoverable={false} className="assess-stage-card">
            <div className="assess-stage-head">
              <div>
                <div className="assess-stage-badges">
                  <Badge text={activeCase.category} color="#f97316" size="md" />
                  <Badge
                    text={activeCase.severity}
                    color={SEVERITY_COLORS[activeCase.severity] || '#ef4444'}
                    size="md"
                  />
                  {solvedSet.has(activeCase.id) && (
                    <Badge text="Diagnosed" color="#10b981" size="md" />
                  )}
                </div>
                <h2 className="assess-stage-title">{activeCase.title}</h2>
              </div>

              <div className="assess-step-nav">
                <button
                  type="button"
                  className="assess-chip-btn"
                  disabled={activeIdx <= 0}
                  onClick={() => selectCase(DEBUGGING_CASES[activeIdx - 1].id)}
                >
                  <ArrowLeft size={14} /> Prev
                </button>
                <button
                  type="button"
                  className="assess-chip-btn"
                  disabled={activeIdx >= DEBUGGING_CASES.length - 1}
                  onClick={() => selectCase(DEBUGGING_CASES[activeIdx + 1].id)}
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Numbered Pipeline Steps & Code Snippet */}
            <div className="assess-pipeline-grid">
              <div className="assess-pipeline-box">
                <h3>Pipeline Execution Steps</h3>
                <ul className="assess-steps-list">
                  {activeCase.pipelineSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="assess-code-box">
                <div className="assess-code-box__head">
                  <Code2 size={14} />
                  <span>Suspect Pipeline Code</span>
                </div>
                <pre className="assess-code-pre">
                  <code>{activeCase.brokenCode}</code>
                </pre>
              </div>
            </div>

            {/* Broken Telemetry */}
            <TelemetryVisuals telemetry={activeCase.telemetry} />

            {/* Optional Hint Toggle */}
            <div className="assess-hint-row">
              <button
                type="button"
                className="assess-chip-btn"
                onClick={() =>
                  setRevealedHints((prev) => ({
                    ...prev,
                    [activeCase.id]: !prev[activeCase.id],
                  }))
                }
              >
                <Lightbulb size={14} />
                <span>{hintVisible ? 'Hide Hint' : 'Inspect Hint'}</span>
              </button>
              {hintVisible && (
                <span className="assess-hint-text">{activeCase.hint}</span>
              )}
            </div>

            {/* Root-Cause Selection */}
            <div className="assess-options" role="radiogroup" aria-label="Root cause options">
              {activeCase.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isSubmitted = Boolean(attempt);
                const isOptionCorrect =
                  isSubmitted && opt.id === activeCase.correctOptionId;
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
                        [activeCase.id]: opt.id,
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
                icon={ShieldCheck}
                disabled={!selectedOption}
                onClick={handleSubmit}
              >
                {attempt ? 'Re-Submit Diagnosis' : 'Submit Diagnosis'}
              </Button>
              {attempt && (
                <span
                  className={`assess-verdict ${
                    attempt.isCorrect ? 'assess-verdict--good' : 'assess-verdict--bad'
                  }`}
                >
                  {attempt.isCorrect ? (
                    <>
                      <CheckCircle2 size={16} /> Root Cause Confirmed!
                    </>
                  ) : (
                    <>
                      <XCircle size={16} /> Incorrect diagnosis — inspect the root cause &amp; diff below.
                    </>
                  )}
                </span>
              )}
            </div>
          </Card>

          {/* STRICT DIAGNOSTIC GATE: Explanation & Fixed Diff ONLY unlock after diagnosis submission */}
          {attempt && (
            <Card hoverable={false} className="assess-unlock-card fade-in">
              <div className="assess-unlock-box">
                <h3>Root Cause Analysis</h3>
                <p>{activeCase.rootCauseExplanation}</p>
              </div>

              <div className="assess-unlock-actions">
                <Button
                  icon={Code2}
                  onClick={() =>
                    setShowDiffMap((prev) => ({
                      ...prev,
                      [activeCase.id]: !prev[activeCase.id],
                    }))
                  }
                >
                  {diffVisible ? 'Hide Fixed Pipeline Diff' : 'View Fixed Pipeline Diff'}
                </Button>
                {activeCase.relatedPath && (
                  <Button
                    variant="secondary"
                    icon={ExternalLink}
                    onClick={() => navigate(activeCase.relatedPath)}
                  >
                    {activeCase.relatedLabel || 'Open Related Lab'}
                  </Button>
                )}
                {activeCase.conceptId && (
                  <Button
                    variant="secondary"
                    icon={ExternalLink}
                    onClick={() => navigate(`/concept/${activeCase.conceptId}`)}
                  >
                    Open Concept Page
                  </Button>
                )}
              </div>

              {diffVisible && (
                <div className="assess-diff-box fade-in">
                  {activeCase.fixedDiff.map((line, idx) => (
                    <div
                      key={idx}
                      className={`assess-diff-line assess-diff-line--${line.type}`}
                    >
                      <code>{line.text}</code>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
