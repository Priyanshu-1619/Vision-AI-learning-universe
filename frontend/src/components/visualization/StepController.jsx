import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import './AnimationController.css';

/**
 * Reusable Step-by-Step Controller for iterative algorithms (e.g. Backprop, K-Means iterations, Decision Tree depth).
 */
export default function StepController({
  currentStep = 0,
  totalSteps = 5,
  stepNames = [],
  onStepChange,
  onReset,
  canStepPrev,
  canStepNext,
  label = 'Step',
  className = '',
}) {
  const isPrevDisabled = canStepPrev !== undefined ? !canStepPrev : currentStep <= 0;
  const isNextDisabled = canStepNext !== undefined ? !canStepNext : currentStep >= totalSteps - 1;

  const currentStepName = stepNames && stepNames[currentStep] ? stepNames[currentStep] : '';

  return (
    <div className={`step-ctrl ${className}`}>
      <div className="step-ctrl__main">
        <button
          type="button"
          className="step-btn step-btn--nav"
          disabled={isPrevDisabled}
          onClick={() => onStepChange && onStepChange(Math.max(0, currentStep - 1))}
          title="Previous Step"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="step-ctrl__center">
          <div className="step-ctrl__indicators">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`step-dot ${idx === currentStep ? 'step-dot--active' : idx < currentStep ? 'step-dot--done' : ''}`}
                onClick={() => onStepChange && onStepChange(idx)}
                title={stepNames[idx] || `Step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="step-ctrl__label-row">
            <span className="step-ctrl__counter">
              {label} <strong>{currentStep + 1}</strong> of {totalSteps}
            </span>
            {currentStepName && (
              <span className="step-ctrl__name">· {currentStepName}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="step-btn step-btn--nav step-btn--primary"
          disabled={isNextDisabled}
          onClick={() => onStepChange && onStepChange(Math.min(totalSteps - 1, currentStep + 1))}
          title="Next Step"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {onReset && (
        <button
          type="button"
          className="step-btn step-btn--reset"
          onClick={onReset}
          title="Reset back to Step 1"
        >
          <RotateCcw size={13} />
          <span>Reset to Start</span>
        </button>
      )}
    </div>
  );
}

