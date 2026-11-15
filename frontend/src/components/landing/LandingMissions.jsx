import { useNavigate } from 'react-router-dom';
import { Target, ChevronRight, BarChart3, Database, ShieldAlert, Award, ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import './LandingMissions.css';

const MISSION_PIPELINE = [
  'UNDERSTAND DATA',
  'EXPLORE',
  'PREPROCESS',
  'SELECT MODEL',
  'TRAIN',
  'EVALUATE',
  'DEBUG',
  'IMPROVE',
];

const MISSION_HIGHLIGHTS = [
  { icon: Database, label: 'Real Datasets', desc: '1,000 real customer records with tenure, contract type, and churn labels' },
  { icon: BarChart3, label: 'Confusion Matrix & F1', desc: 'True Positives, False Alarms, Precision, Recall, and AUC-ROC curves' },
  { icon: ShieldAlert, label: 'Anti-Overfitting Penalties', desc: 'Train vs Test divergence checks with scikit-learn cross-validation' },
  { icon: Award, label: 'Mission Ranking & Scoring', desc: 'Earn verified mission badges based on generalization scores' },
];

export default function LandingMissions() {
  const navigate = useNavigate();

  return (
    <section className="landing-missions" id="missions" aria-label="AI Missions">
      <div className="landing-missions__container">
        <div className="landing-section-header">
          <span className="landing-section-kicker">APPLIED ENGINEERING</span>
          <h2 className="landing-section-title">
            TURN YOUR KNOWLEDGE INTO REAL-WORLD SKILLS.
          </h2>
          <p className="landing-section-desc">
            Theory without application is incomplete. AI Missions place you in the role of an ML engineer solving business challenges with end-to-end data pipelines.
          </p>
        </div>

        {/* Mission Showcase Card */}
        <div className="mission-showcase-card">
          <div className="mission-showcase-card__header">
            <div className="mission-badge-group">
              <span className="mission-badge-tag">
                <Target size={15} color="#10b981" />
                FLAGSHIP MISSION 01
              </span>
              <span className="mission-badge-level">Intermediate ML</span>
            </div>
            <span className="mission-status-pill">Active Live Pipeline</span>
          </div>

          <h3 className="mission-showcase-title">
            Customer Churn Prediction & Retention Engineering
          </h3>
          <p className="mission-showcase-desc">
            Telecom customers are canceling their subscriptions. Build an end-to-end classification pipeline with scikit-learn to predict at-risk customers before they churn.
          </p>

          {/* Sequential 8-Step Pipeline */}
          <div className="mission-pipeline-strip">
            {MISSION_PIPELINE.map((step, idx) => (
              <div key={step} className="mission-step-item">
                <span className="mission-step-badge">{idx + 1}</span>
                <span className="mission-step-text">{step}</span>
                {idx < MISSION_PIPELINE.length - 1 && (
                  <ChevronRight size={14} className="mission-step-arrow" />
                )}
              </div>
            ))}
          </div>

          {/* 4 Feature Columns */}
          <div className="mission-highlights-grid">
            {MISSION_HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.label} className="mission-highlight-col">
                  <div className="mission-highlight-icon">
                    <Icon size={18} color="#10b981" />
                  </div>
                  <div>
                    <h4 className="mission-highlight-label">{h.label}</h4>
                    <p className="mission-highlight-desc">{h.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Footer CTA */}
          <div className="mission-showcase-card__footer">
            <span className="mission-footer-metric">
              Target Baseline: F1 &gt; 0.82 • Max Data Leakage Penalty: 0%
            </span>
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => navigate('/missions')}
              className="mission-cta-btn"
            >
              START YOUR FIRST MISSION
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
