import { useState } from 'react';
import {
  X,
  Languages,
  BookOpen,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { GRAPH_TERMS, CONTEXTUAL_GRAPH_EXPLANATIONS } from '../../utils/graphNotesData';
import './GraphNotesModal.css';

export default function GraphNotesModal({
  isOpen,
  onClose,
  topicKey = 'custom-equation',
  customContext = null,
}) {
  const [lang, setLang] = useState('en'); // 'en' | 'hi'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'terms'

  if (!isOpen) return null;

  // Retrieve contextual explanation or fallback to generic custom-equation
  const context =
    customContext ||
    CONTEXTUAL_GRAPH_EXPLANATIONS[topicKey] ||
    CONTEXTUAL_GRAPH_EXPLANATIONS['custom-equation'];

  const explanation = context[lang] || context.en;
  const relevantTermKeys = context.relevantTerms || Object.keys(GRAPH_TERMS).slice(0, 8);

  return (
    <div className="graph-notes-backdrop" onClick={onClose}>
      <div
        className="graph-notes-drawer fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Graph Notes and Explanations"
      >
        {/* Header */}
        <div className="graph-notes__header">
          <div className="graph-notes__header-left">
            <div className="graph-notes__icon-box">
              <Sparkles size={20} className="text-yellow" />
            </div>
            <div>
              <div className="graph-notes__eyebrow">
                <span>Educational Visualizer Guide</span>
                <Badge text="Graph Notes" color="var(--accent-cyan, #06B6D4)" size="sm" />
              </div>
              <h2 className="graph-notes__title">{context.title}</h2>
            </div>
          </div>

          <div className="graph-notes__header-right">
            {/* Language Switcher Pill */}
            <div className="graph-notes__lang-toggle">
              <Languages size={15} className="graph-notes__lang-icon" />
              <button
                type="button"
                className={`graph-notes__lang-btn ${lang === 'en' ? 'graph-notes__lang-btn--active' : ''}`}
                onClick={() => setLang('en')}
              >
                English
              </button>
              <button
                type="button"
                className={`graph-notes__lang-btn ${lang === 'hi' ? 'graph-notes__lang-btn--active' : ''}`}
                onClick={() => setLang('hi')}
              >
                Hinglish (हिंदी)
              </button>
            </div>

            <button
              type="button"
              className="graph-notes__close-btn"
              onClick={onClose}
              aria-label="Close Graph Notes"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="graph-notes__tabs">
          <button
            type="button"
            className={`graph-notes__tab-btn ${activeTab === 'overview' ? 'graph-notes__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BookOpen size={16} />
            <span>{lang === 'hi' ? 'Graph Kya Batata Hai?' : 'What This Graph Communicates'}</span>
          </button>
          <button
            type="button"
            className={`graph-notes__tab-btn ${activeTab === 'terms' ? 'graph-notes__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            <Layers size={16} />
            <span>
              {lang === 'hi' ? 'Graph Components & Terminology' : 'Graph Components & Terms'} ({relevantTermKeys.length})
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="graph-notes__body">
          {activeTab === 'overview' && (
            <div className="graph-notes__section-overview">
              <div className="graph-notes__card-grid">
                {/* 1. What is Plotted */}
                <div className="graph-notes__card">
                  <div className="graph-notes__card-head">
                    <Info size={16} className="text-cyan" />
                    <h4>{lang === 'hi' ? 'Kya Plot Ho Raha Hai?' : 'What is Being Plotted?'}</h4>
                  </div>
                  <p>{explanation.plotted}</p>
                </div>

                {/* 2. Axes Meaning */}
                <div className="graph-notes__card">
                  <div className="graph-notes__card-head">
                    <ArrowRight size={16} className="text-blue" />
                    <h4>{lang === 'hi' ? 'Axes Ka Matlab' : 'Axes Representation'}</h4>
                  </div>
                  <div className="graph-notes__axes-sub">
                    <p>
                      <strong>X-Axis:</strong> {explanation.xAxis}
                    </p>
                    <p>
                      <strong>Y-Axis:</strong> {explanation.yAxis}
                    </p>
                  </div>
                </div>

                {/* 3. Points & Lines */}
                <div className="graph-notes__card">
                  <div className="graph-notes__card-head">
                    <Sparkles size={16} className="text-yellow" />
                    <h4>{lang === 'hi' ? 'Points & Lines Ka Matlab' : 'What Points & Lines Represent'}</h4>
                  </div>
                  <p>{explanation.pointsLines}</p>
                </div>

                {/* 4. Shape & Curvature */}
                <div className="graph-notes__card">
                  <div className="graph-notes__card-head">
                    <Layers size={16} className="text-purple" />
                    <h4>{lang === 'hi' ? 'Ye Shape Kyun Hai?' : 'Why Does It Have This Shape?'}</h4>
                  </div>
                  <p>{explanation.shapeReason}</p>
                  {explanation.intersection && (
                    <p className="mt-2 text-subtle">
                      <strong>{lang === 'hi' ? 'Intersection Point:' : 'Intersection Point:'}</strong>{' '}
                      {explanation.intersection}
                    </p>
                  )}
                </div>

                {/* 5. Parameter Dynamics */}
                <div className="graph-notes__card">
                  <div className="graph-notes__card-head">
                    <Info size={16} className="text-emerald" />
                    <h4>{lang === 'hi' ? 'Parameters Change Hone Par Kya Hota Hai?' : 'What Happens When Parameters Change?'}</h4>
                  </div>
                  <p>{explanation.parameterEffects}</p>
                </div>

                {/* 6. Core Takeaways */}
                <div className="graph-notes__card graph-notes__card--highlight">
                  <div className="graph-notes__card-head">
                    <Sparkles size={16} className="text-yellow" />
                    <h4>{lang === 'hi' ? 'Learner Ko Kya Samajhna Chahiye?' : 'Core Pedagogical Takeaway'}</h4>
                  </div>
                  <p className="text-strong">{explanation.coreTakeaway}</p>
                  <div className="graph-notes__app-tag">
                    <span>{lang === 'hi' ? 'Real-world Uses:' : 'Real-world Applications:'}</span>{' '}
                    {explanation.applications}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="graph-notes__section-terms">
              <p className="graph-notes__terms-intro">
                {lang === 'hi'
                  ? 'Is graph mein use hone wale zaroori mathematical aur technical terms ka aasan explanation:'
                  : 'Key technical and geometric terminology specifically relevant to this visualization:'}
              </p>

              <div className="graph-notes__terms-grid">
                {relevantTermKeys.map((key) => {
                  const term = GRAPH_TERMS[key];
                  if (!term) return null;
                  return (
                    <div key={key} className="graph-term-card">
                      <div className="graph-term-card__head">
                        <h4 className="graph-term-card__title">{term.title}</h4>
                        {term.badge && (
                          <Badge text={term.badge} color="var(--accent-cyan, #06b6d4)" size="sm" />
                        )}
                      </div>
                      <p className="graph-term-card__desc">
                        {lang === 'hi' ? term.hi : term.en}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="graph-notes__footer">
          <span className="graph-notes__footer-note">
            {lang === 'hi'
              ? '💡 Tip: Custom equation enter karke dekhein ki formula change hone par graph kaise react karta hai.'
              : '💡 Tip: Modify parameters or customize equations to see real-time graphical reactions.'}
          </span>
          <Button variant="secondary" onClick={onClose}>
            {lang === 'hi' ? 'Samajh Gaya' : 'Got It'}
          </Button>
        </div>
      </div>
    </div>
  );
}
