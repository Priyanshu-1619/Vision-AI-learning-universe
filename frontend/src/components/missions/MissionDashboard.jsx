import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  RotateCcw,
  Trophy,
  ChevronRight,
  CheckCircle,
  Circle,
  Lock,
} from 'lucide-react';
import { CHURN_MISSION, computeMissionScore } from './missionData';
import MissionStepCard from './MissionStepCard';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loading from '../common/Loading';
import { fetchChurnDataset } from '../../api/client';
import './MissionDashboard.css';

const STORAGE_KEY = 'ailu_mission_churn_v3';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function initialProgress() {
  return {
    currentStepIdx: 0,
    completedSteps: [],
    showReport: false,
    hintsUsed: 0,
    cleaningConfig: {
      missing_strategy: 'median_impute',
      categorical_encoding: 'onehot',
      scale_numeric: true,
      previewed: false,
    },
    selectedAlgorithm: 'logistic',
    selectedFeatures: [],
    trainConfig: {
      max_depth: 4,
      n_neighbors: 5,
      n_estimators: 60,
      test_size: 0.3,
      class_weight_balanced: false,
    },
    baselineResult: null,
    lastTrainResult: null,
    improvedResult: null,
    bestF1: 0,
    bestRecall: 0,
    bestAccuracy: 0,
    debugScoreCount: 0,
    xpEarned: 0,
  };
}

export default function MissionDashboard() {
  const navigate = useNavigate();
  const steps = CHURN_MISSION.steps;

  const [progress, setProgress] = useState(() => loadProgress() || initialProgress());
  const [churnData, setChurnData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const loadDataset = useCallback(() => {
    fetchChurnDataset()
      .then((data) => {
        setChurnData(data);
        setDataError(null);
      })
      .catch((err) => {
        setDataError(err.message || 'Failed to fetch churn dataset from backend.');
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchChurnDataset()
      .then((data) => {
        if (!cancelled) {
          setChurnData(data);
          setDataError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDataError(err.message || 'Failed to fetch churn dataset from backend.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentStep = steps[progress.currentStepIdx] || steps[steps.length - 1];
  const isComplete =
    Boolean(progress.showReport) &&
    progress.completedSteps.length >= steps.length;

  const scoreInfo = computeMissionScore({
    completedCount: progress.completedSteps.length,
    totalSteps: steps.length,
    hintsUsed: progress.hintsUsed,
    cleaningConfig: progress.cleaningConfig,
    bestF1: progress.bestF1,
    bestRecall: progress.bestRecall,
    debugScoreCount: progress.debugScoreCount,
  });

  const handleStepComplete = useCallback(
    (stepId, result = {}) => {
      setProgress((prev) => {
        const alreadyDone = prev.completedSteps.includes(stepId);
        const stepDef = steps.find((s) => s.id === stepId);
        const xpGain = alreadyDone ? 0 : stepDef?.xp || 25;

        const newCompleted = alreadyDone
          ? prev.completedSteps
          : [...prev.completedSteps, stepId];
        const isLastStep = prev.currentStepIdx >= steps.length - 1;
        const nextIdx = Math.min(prev.currentStepIdx + 1, steps.length - 1);

        const updates = {
          completedSteps: newCompleted,
          currentStepIdx: nextIdx,
          showReport: isLastStep && newCompleted.length >= steps.length,
          xpEarned: prev.xpEarned + xpGain,
        };

        if (result.cleaningConfig) updates.cleaningConfig = result.cleaningConfig;
        if (result.selectedAlgorithm) updates.selectedAlgorithm = result.selectedAlgorithm;
        if (result.selectedFeatures) updates.selectedFeatures = result.selectedFeatures;
        if (result.trainConfig) updates.trainConfig = result.trainConfig;
        if (typeof result.debugScoreCount === 'number') {
          updates.debugScoreCount = Math.max(prev.debugScoreCount, result.debugScoreCount);
        }

        if (result.trainResult) {
          if (result.isImprove) {
            updates.improvedResult = result.trainResult;
          } else {
            updates.lastTrainResult = result.trainResult;
            if (!prev.baselineResult) {
              updates.baselineResult = result.trainResult;
            }
          }
          updates.bestAccuracy = Math.max(
            prev.bestAccuracy,
            result.trainResult.accuracy || 0
          );
          updates.bestF1 = Math.max(prev.bestF1, result.trainResult.f1 || 0);
          updates.bestRecall = Math.max(
            prev.bestRecall,
            result.trainResult.recall || 0
          );
        }

        return { ...prev, ...updates };
      });
    },
    [steps]
  );

  const handleHintUsed = useCallback(() => {
    setProgress((prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
  }, []);

  const handleNavigateToStep = useCallback(
    (idx) => {
      const targetStep = steps[idx];
      if (
        idx <= progress.currentStepIdx ||
        (targetStep && progress.completedSteps.includes(targetStep.id))
      ) {
        setProgress((prev) => ({
          ...prev,
          currentStepIdx: idx,
          showReport: false,
        }));
      }
    },
    [progress.currentStepIdx, progress.completedSteps, steps]
  );

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    const fresh = initialProgress();
    setProgress(fresh);
    saveProgress(fresh);
    setConfirmReset(false);
  };

  const progressPct = Math.round(
    (progress.completedSteps.length / steps.length) * 100
  );

  return (
    <div className="mission-dashboard fade-in">
      <aside className="mission-sidebar">
        <div className="mission-sidebar__header">
          <div className="mission-sidebar__icon-row">
            <div className="mission-sidebar__icon-box">
              <Target size={22} color="#06b6d4" />
            </div>
            <div>
              <div className="mission-sidebar__badge-row">
                <Badge text="Phase 9" color="#06b6d4" size="sm" />
                <Badge text={CHURN_MISSION.difficulty} color="#8b5cf6" size="sm" />
              </div>
              <h2 className="mission-sidebar__title">{CHURN_MISSION.title}</h2>
            </div>
          </div>

          <div className="mission-xp-row">
            <span className="mission-xp-label">Mission Score</span>
            <span className="mission-xp-val">
              {scoreInfo.total}% · {progress.xpEarned} XP
            </span>
          </div>

          <div className="mission-progress-bar-wrap">
            <div className="mission-progress-bar-track">
              <div
                className="mission-progress-bar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mission-progress-pct">{progressPct}%</span>
          </div>
        </div>

        <nav className="mission-step-list" aria-label="Mission stages">
          {steps.map((step, idx) => {
            const done = progress.completedSteps.includes(step.id);
            const active = idx === progress.currentStepIdx && !isComplete;
            const locked = idx > progress.currentStepIdx && !done;

            return (
              <button
                key={step.id}
                type="button"
                className={`mission-step-nav-item ${
                  active ? 'mission-step-nav-item--active' : ''
                } ${done ? 'mission-step-nav-item--done' : ''} ${
                  locked ? 'mission-step-nav-item--locked' : ''
                }`}
                onClick={() => handleNavigateToStep(idx)}
                disabled={locked}
                title={locked ? 'Complete previous stage first' : step.title}
              >
                <span className="mission-step-nav-item__icon">
                  {done ? (
                    <CheckCircle size={15} color="#10b981" />
                  ) : locked ? (
                    <Lock size={13} color="#475569" />
                  ) : (
                    <Circle size={15} color={active ? '#06b6d4' : '#64748b'} />
                  )}
                </span>
                <span className="mission-step-nav-item__label">{step.title}</span>
                {active && <ChevronRight size={13} color="#06b6d4" />}
              </button>
            );
          })}
        </nav>

        <div className="mission-sidebar__footer">
          <Button
            variant="ghost"
            icon={RotateCcw}
            onClick={handleReset}
            style={{
              fontSize: '0.8rem',
              color: confirmReset ? '#ef4444' : undefined,
            }}
          >
            {confirmReset ? 'Click again to confirm reset' : 'Reset Mission'}
          </Button>
        </div>
      </aside>

      <main className="mission-main">
        {isComplete ? (
          <FinalReportScreen
            progress={progress}
            scoreInfo={scoreInfo}
            steps={steps}
            onNavigate={() => navigate('/')}
            onReviewSteps={() =>
              setProgress((p) => ({ ...p, currentStepIdx: 0, showReport: false }))
            }
          />
        ) : loadingData ? (
          <div className="mission-loading-wrap">
            <Loading text="Loading local CSV churn dataset from FastAPI..." />
          </div>
        ) : dataError ? (
          <div className="lab-error-banner">
            <span>{dataError}</span>
            <Button
              variant="secondary"
              onClick={() => {
                setLoadingData(true);
                loadDataset();
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <MissionStepCard
            key={currentStep.id}
            step={currentStep}
            stepIndex={progress.currentStepIdx}
            totalSteps={steps.length}
            churnData={churnData}
            progress={progress}
            onComplete={handleStepComplete}
            onHintUsed={handleHintUsed}
          />
        )}
      </main>
    </div>
  );
}

function FinalReportScreen({ progress, scoreInfo, steps, onNavigate, onReviewSteps }) {
  const { total, breakdown } = scoreInfo;
  const gradeLabel =
    total >= 85
      ? 'Senior ML Practitioner'
      : total >= 70
        ? 'Applied ML Engineer'
        : 'Junior Data Scientist';
  const gradeColor =
    total >= 85 ? '#10b981' : total >= 70 ? '#38bdf8' : '#f59e0b';

  const finalModel = progress.improvedResult || progress.lastTrainResult;

  return (
    <div className="mission-final-report fade-in">
      <div className="mission-final-report__trophy">
        <Trophy size={54} color="#f59e0b" />
      </div>
      <h1 className="mission-final-report__title">MISSION COMPLETE</h1>
      <h2 className="mission-final-report__subtitle">{CHURN_MISSION.title}</h2>

      <div className="mission-final-report__score-box">
        <span className="mission-final-report__score" style={{ color: gradeColor }}>
          {total}%
        </span>
        <span className="mission-final-report__grade" style={{ color: gradeColor }}>
          {gradeLabel}
        </span>
      </div>

      {/* Real Score Breakdown */}
      <div className="mission-score-breakdown">
        <span>Completion: <strong>{breakdown.completion}/40</strong></span>
        <span>Pipeline Hygiene: <strong>{breakdown.preprocessing}/15</strong></span>
        <span>Debugging: <strong>{breakdown.debugging}/15</strong></span>
        <span>Model F1/Recall: <strong>{breakdown.modelQuality}/30</strong></span>
        <span>Hint Penalty: <strong>-{breakdown.hintPenalty}</strong></span>
      </div>

      {/* Checklist */}
      <div className="mission-final-report__checklist">
        {steps.map((step) => {
          const done = progress.completedSteps.includes(step.id);
          return (
            <div key={step.id} className="mission-final-report__check-row">
              <span className="mission-final-report__check-icon">
                {done ? '✓' : '○'}
              </span>
              <span
                className="mission-final-report__check-label"
                style={{ color: done ? '#e2e8f0' : '#475569' }}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Real Final Model Metrics */}
      {finalModel && (
        <div className="mission-final-report__metrics">
          <h3 className="mission-final-report__metrics-title">
            Final Pipeline: {finalModel.model_params?.algorithm?.toUpperCase()}
          </h3>
          <div className="mission-final-report__metrics-grid">
            <div className="mission-final-metric">
              <span className="mission-final-metric__label">Accuracy</span>
              <span className="mission-final-metric__val" style={{ color: '#10b981' }}>
                {(finalModel.accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mission-final-metric">
              <span className="mission-final-metric__label">Precision</span>
              <span className="mission-final-metric__val" style={{ color: '#f59e0b' }}>
                {finalModel.precision.toFixed(3)}
              </span>
            </div>
            <div className="mission-final-metric">
              <span className="mission-final-metric__label">Recall</span>
              <span className="mission-final-metric__val" style={{ color: '#ec4899' }}>
                {finalModel.recall.toFixed(3)}
              </span>
            </div>
            <div className="mission-final-metric">
              <span className="mission-final-metric__label">F1 Score</span>
              <span className="mission-final-metric__val" style={{ color: '#8b5cf6' }}>
                {finalModel.f1.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mission-final-report__actions">
        <Button variant="secondary" onClick={onReviewSteps}>
          Review Stages
        </Button>
        <Button variant="primary" onClick={onNavigate}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
