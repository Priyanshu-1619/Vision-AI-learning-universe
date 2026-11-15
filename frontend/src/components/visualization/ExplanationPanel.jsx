import { Sparkles, Lightbulb } from 'lucide-react';
import './ExplanationPanel.css';

/**
 * Reusable Contextual Pedagogical Explanation Panel.
 * Answers the 4 core educational questions:
 * 1. What changed?
 * 2. Why did it happen?
 * 3. What does the mathematics say?
 * 4. What should the learner understand?
 */
export default function ExplanationPanel({
  whatChanged = '',
  why = '',
  mathematics = '',
  takeaway = '',
  domain = 'machine-learning',
  className = '',
}) {
  if (!whatChanged && !why && !mathematics && !takeaway) return null;

  return (
    <div className={`explanation-panel ${className}`} data-domain={domain}>
      <div className="explanation-panel__header">
        <Sparkles size={16} className="explanation-panel__header-icon" />
        <h3 className="explanation-panel__header-title">Contextual Mathematical &amp; Algorithmic Insights</h3>
      </div>

      <div className="explanation-panel__grid">
        {whatChanged && (
          <div className="explanation-card explanation-card--changed">
            <div className="explanation-card__head">
              <span className="explanation-card__tag">1</span>
              <h4>What changed?</h4>
            </div>
            <p>{whatChanged}</p>
          </div>
        )}

        {why && (
          <div className="explanation-card explanation-card--why">
            <div className="explanation-card__head">
              <span className="explanation-card__tag">2</span>
              <h4>Why did it happen?</h4>
            </div>
            <p>{why}</p>
          </div>
        )}

        {mathematics && (
          <div className="explanation-card explanation-card--math">
            <div className="explanation-card__head">
              <span className="explanation-card__tag">3</span>
              <h4>What does the mathematics say?</h4>
            </div>
            <p>{mathematics}</p>
          </div>
        )}

        {takeaway && (
          <div className="explanation-card explanation-card--takeaway">
            <div className="explanation-card__head">
              <Lightbulb size={14} className="explanation-card__bulb" />
              <h4>Key Concept Takeaway</h4>
            </div>
            <p>{takeaway}</p>
          </div>
        )}
      </div>
    </div>
  );
}
