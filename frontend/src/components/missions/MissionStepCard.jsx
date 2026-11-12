import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALL_CHURN_FEATURES } from './missionData';
import { trainChurnModel } from '../../api/client';
import {
  AlgorithmSelectorWidget,
  CleaningPipelineWidget,
  ConfusionMatrixWidget,
  DataExplorerWidget,
  DebugLabWidget,
  EdaExplorerWidget,
  FeatureSelectorWidget,
  LivePredictWidget,
  QuizWidget,
  TrainConfigWidget,
} from './MissionWidgets';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './MissionDashboard.css';

export default function MissionStepCard({
  step,
  stepIndex,
  totalSteps,
  churnData,
  progress,
  onComplete,
  onHintUsed,
}) {
  const navigate = useNavigate();
  const alreadyCompleted = progress.completedSteps.includes(step.id);

  const [hintsOpen, setHintsOpen] = useState([false, false]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [cleaningConfig, setCleaningConfig] = useState(
    progress.cleaningConfig || {
      missing_strategy: 'median_impute',
      categorical_encoding: 'onehot',
      scale_numeric: true,
      previewed: false,
    }
  );

  const [selectedFeatures, setSelectedFeatures] = useState(
    progress.selectedFeatures?.length
      ? progress.selectedFeatures
      : ALL_CHURN_FEATURES.map((f) => f.key)
  );
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(
    progress.selectedAlgorithm || 'logistic'
  );
  const [trainConfig, setTrainConfig] = useState(
    progress.trainConfig || {
      max_depth: 4,
      n_neighbors: 5,
      n_estimators: 60,
      test_size: 0.3,
      class_weight_balanced: step.interactiveType === 'improve-config',
    }
  );

  const [trainResult, setTrainResult] = useState(
    step.interactiveType === 'improve-config'
      ? progress.improvedResult || null
      : progress.lastTrainResult || null
  );
  const [training, setTraining] = useState(false);
  const [trainError, setTrainError] = useState(null);
  const [debugCount, setDebugCount] = useState(progress.debugScoreCount || 0);
  const [canContinue, setCanContinue] = useState(alreadyCompleted);

  const toggleHint = (idx) => {
    setHintsOpen((prev) => {
      const next = [...prev];
      if (!next[idx]) onHintUsed();
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null) return;
    const correct = selectedOption === step.successCriteria?.answer;
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) setCanContinue(true);
  };

  const handleFeatureToggle = (key) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const checkFeatureSelection = () => {
    const req = step.successCriteria?.required || [];
    const minSelected = step.successCriteria?.minSelected || 1;
    const hasRequired = req.every((r) => selectedFeatures.includes(r));
    if (!hasRequired) return { ok: false, msg: `Must include required features: ${req.join(', ')}` };
    if (selectedFeatures.length < minSelected) {
      return { ok: false, msg: `Select at least ${minSelected} features.` };
    }
    return { ok: true, msg: '' };
  };

  const handleTrain = useCallback(async () => {
    setTraining(true);
    setTrainError(null);
    try {
      const featuresToUse = progress.selectedFeatures?.length
        ? progress.selectedFeatures
        : selectedFeatures;

      const result = await trainChurnModel({
        algorithm: selectedAlgorithm,
        max_depth: trainConfig.max_depth,
        n_neighbors: trainConfig.n_neighbors,
        n_estimators: trainConfig.n_estimators,
        test_size: trainConfig.test_size,
        selected_features: featuresToUse,
        missing_strategy: cleaningConfig.missing_strategy,
        categorical_encoding: cleaningConfig.categorical_encoding,
        scale_numeric: cleaningConfig.scale_numeric,
        class_weight_balanced: Boolean(trainConfig.class_weight_balanced),
      });

      setTrainResult(result);
      const sc = step.successCriteria;
      if (sc?.type === 'value-check') {
        const val = result[sc.field];
        const meets = sc.comparison === 'gte' ? val >= sc.threshold : val <= sc.threshold;
        if (meets) setCanContinue(true);
      } else {
        setCanContinue(true);
      }
    } catch (err) {
      setTrainError(err.message || 'Training failed on backend.');
    } finally {
      setTraining(false);
    }
  }, [
    selectedAlgorithm,
    trainConfig,
    selectedFeatures,
    progress.selectedFeatures,
    cleaningConfig,
    step.successCriteria,
  ]);

  const handleComplete = () => {
    onComplete(step.id, {
      cleaningConfig,
      selectedFeatures,
      selectedAlgorithm,
      trainConfig,
      trainResult,
      isImprove: step.interactiveType === 'improve-config',
      debugScoreCount: debugCount,
    });
  };

  const sc = step.successCriteria;

  const activePipelineConfig = {
    algorithm: selectedAlgorithm,
    ...trainConfig,
    selected_features: progress.selectedFeatures?.length
      ? progress.selectedFeatures
      : ALL_CHURN_FEATURES.map((f) => f.key),
    missing_strategy: cleaningConfig.missing_strategy,
    categorical_encoding: cleaningConfig.categorical_encoding,
    scale_numeric: cleaningConfig.scale_numeric,
  };

  return (
    <div className="mission-step-card fade-in">
      <div className="mission-step-card__header">
        <div className="mission-step-card__header-left">
          <span className="mission-step-card__icon">{step.icon}</span>
          <div>
            <div className="mission-step-card__meta">
              <Badge text={`Step ${stepIndex + 1} / ${totalSteps}`} color="#06b6d4" size="sm" />
              {step.xp && <Badge text={`+${step.xp} XP`} color="#8b5cf6" size="sm" />}
            </div>
            <h2 className="mission-step-card__title">{step.title}</h2>
            <p className="mission-step-card__objective">{step.objective}</p>
          </div>
        </div>
      </div>

      <div className="mission-step-card__content">
        <p className="mission-step-card__text">{step.content}</p>
      </div>

      <div className="mission-step-card__interactive">
        {/* Info / Brief */}
        {step.interactiveType === 'info' && (
          <div className="mission-info-banner">
            <span>Review the retention mission above and begin auditing the dataset.</span>
            {!canContinue && (
              <Button variant="primary" onClick={() => setCanContinue(true)}>
                Accept Mission
              </Button>
            )}
          </div>
        )}

        {/* Stage 1: Understand Dataset + Schema Quiz */}
        {step.interactiveType === 'data-explorer' && (
          <div className="mission-stacked-widgets">
            <DataExplorerWidget data={churnData} />
            {sc?.type === 'quiz' && (
              <QuizWidget
                question={sc.question}
                options={sc.options}
                selectedOption={selectedOption}
                submitted={submitted}
                isCorrect={isCorrect}
                correctAnswer={sc.answer}
                explanation={sc.explanation}
                onSelect={setSelectedOption}
                onSubmit={handleQuizSubmit}
              />
            )}
          </div>
        )}

        {/* Stage 2: EDA Charts + Segment Quiz */}
        {step.interactiveType === 'eda-explorer' && (
          <div className="mission-stacked-widgets">
            <EdaExplorerWidget data={churnData} />
            {sc?.type === 'quiz' && (
              <QuizWidget
                question={sc.question}
                options={sc.options}
                selectedOption={selectedOption}
                submitted={submitted}
                isCorrect={isCorrect}
                correctAnswer={sc.answer}
                explanation={sc.explanation}
                onSelect={setSelectedOption}
                onSubmit={handleQuizSubmit}
              />
            )}
          </div>
        )}

        {/* Stage 3: Clean Data & ColumnTransformer Preview */}
        {step.interactiveType === 'cleaning-pipeline' && (
          <CleaningPipelineWidget
            cleaningConfig={cleaningConfig}
            onChange={setCleaningConfig}
            onPreviewReady={() => {
              setCleaningConfig((c) => ({ ...c, previewed: true }));
              setCanContinue(true);
            }}
          />
        )}

        {/* Quiz-only stages */}
        {step.interactiveType === 'quiz' && sc?.type === 'quiz' && (
          <QuizWidget
            question={sc.question}
            options={sc.options}
            selectedOption={selectedOption}
            submitted={submitted}
            isCorrect={isCorrect}
            correctAnswer={sc.answer}
            explanation={sc.explanation}
            onSelect={setSelectedOption}
            onSubmit={handleQuizSubmit}
          />
        )}

        {/* Stage 4: Feature Selection */}
        {step.interactiveType === 'feature-selector' && (
          <FeatureSelectorWidget
            selectedFeatures={selectedFeatures}
            onToggle={handleFeatureToggle}
            onConfirm={() => {
              const { ok, msg } = checkFeatureSelection();
              if (ok) {
                setTrainError(null);
                setCanContinue(true);
                setSubmitted(true);
                setIsCorrect(true);
              } else {
                setTrainError(msg);
              }
            }}
            submitted={submitted}
            sc={sc}
          />
        )}

        {/* Stage 5: Algorithm Selection */}
        {step.interactiveType === 'algorithm-selector' && (
          <AlgorithmSelectorWidget
            selected={selectedAlgorithm}
            onSelect={(id) => {
              setSelectedAlgorithm(id);
              setCanContinue(true);
            }}
          />
        )}

        {/* Stage 6 & Stage 9: Train / Improve */}
        {(step.interactiveType === 'train-config' ||
          step.interactiveType === 'improve-config') && (
          <TrainConfigWidget
            algorithm={selectedAlgorithm}
            onAlgorithmChange={setSelectedAlgorithm}
            allowAlgorithmSwitch={step.interactiveType === 'improve-config'}
            config={trainConfig}
            onConfigChange={setTrainConfig}
            onTrain={handleTrain}
            training={training}
            result={trainResult}
            baselineResult={progress.baselineResult}
            error={trainError}
            successCriteria={sc}
          />
        )}

        {/* Stage 7: Confusion Matrix + Metric Quiz */}
        {step.interactiveType === 'confusion-matrix' && (
          <div className="mission-stacked-widgets">
            {trainResult ? (
              <ConfusionMatrixWidget result={trainResult} />
            ) : (
              <TrainConfigWidget
                algorithm={selectedAlgorithm}
                onAlgorithmChange={setSelectedAlgorithm}
                config={trainConfig}
                onConfigChange={setTrainConfig}
                onTrain={handleTrain}
                training={training}
                result={null}
                error={trainError}
              />
            )}
            {trainResult && sc?.type === 'quiz' && (
              <QuizWidget
                question={sc.question}
                options={sc.options}
                selectedOption={selectedOption}
                submitted={submitted}
                isCorrect={isCorrect}
                correctAnswer={sc.answer}
                explanation={sc.explanation}
                onSelect={setSelectedOption}
                onSubmit={handleQuizSubmit}
              />
            )}
          </div>
        )}

        {/* Stage 8: Debugging Simulator */}
        {step.interactiveType === 'debug-lab' && (
          <DebugLabWidget
            onAllSolved={(count, allDone) => {
              setDebugCount(count);
              if (allDone) setCanContinue(true);
            }}
          />
        )}

        {/* Stage 10: Live Inference */}
        {step.interactiveType === 'live-predict' && (
          <LivePredictWidget
            pipelineConfig={activePipelineConfig}
            onPredicted={() => setCanContinue(true)}
          />
        )}

        {/* Stage 11: Final Report Trigger */}
        {step.interactiveType === 'final-report' && (
          <div className="mission-info-banner">
            <span>All 10 technical stages complete. Generate your final scorecard!</span>
            {!canContinue && (
              <Button variant="primary" onClick={() => setCanContinue(true)}>
                Generate Final Report
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hints */}
      {step.hints && step.hints.length > 0 && (
        <div className="mission-hints-section">
          {step.hints.map((hint, idx) => (
            <div key={idx} className="mission-hint">
              <button
                type="button"
                className="mission-hint__toggle"
                onClick={() => toggleHint(idx)}
              >
                <Lightbulb size={14} color="#f59e0b" />
                <span>Show Hint {idx + 1}</span>
                {hintsOpen[idx] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {hintsOpen[idx] && <div className="mission-hint__content">{hint}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Concept & Lab Links */}
      {(step.relatedConcepts?.length > 0 || step.relatedLabs?.length > 0) && (
        <div className="mission-related-row">
          {step.relatedConcepts?.map((id) => (
            <button
              key={id}
              type="button"
              className="mission-related-chip"
              onClick={() => navigate(`/concept/${id}`)}
            >
              <ExternalLink size={11} />
              {id.replace(/-/g, ' ')}
            </button>
          ))}
          {step.relatedLabs?.map((id) => (
            <button
              key={id}
              type="button"
              className="mission-related-chip mission-related-chip--lab"
              onClick={() => navigate(`/laboratory?lab=${id}`)}
            >
              <ExternalLink size={11} />
              {id.replace(/-/g, ' ')} lab
            </button>
          ))}
        </div>
      )}

      {/* Footer Continue */}
      <div className="mission-step-card__footer">
        {trainError && !canContinue && (
          <span className="mission-step-error">{trainError}</span>
        )}
        <Button
          variant="primary"
          onClick={handleComplete}
          disabled={!canContinue}
          style={{
            opacity: canContinue ? 1 : 0.4,
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          {stepIndex === totalSteps - 1 ? 'View Final Mission Report' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
