import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hammer, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import './LandingDebugging.css';

const DEBUG_STEPS = [
  { id: 'broke', label: '1. WHAT BROKE?', desc: 'Loss explodes to NaN; gradient norms exceed 10⁴' },
  { id: 'why', label: '2. WHY DID IT BREAK?', desc: 'Learning rate α was set beyond the lipschitz smoothness upper bound' },
  { id: 'math', label: '3. MATHEMATICAL CAUSE', desc: 'Step vector -α·∇L overshoots local minimum into diverging manifold' },
  { id: 'fix', label: '4. HOW TO FIX IT', desc: 'Implement cosine learning rate decay and gradient clipping threshold at 1.0' },
];

const FAILURE_SCENARIOS = [
  {
    title: 'Learning Rate Too High',
    domain: 'Optimization',
    symptom: 'Parameter weights oscillate violently and diverge to infinity (NaN)',
    fix: 'Decay α or add gradient clipping',
    accent: '#ef4444',
  },
  {
    title: 'Severe Overfitting',
    domain: 'Generalization',
    symptom: 'Training error = 0.1%, but Validation error spikes to 42.5%',
    fix: 'L2 Ridge penalty or early stopping',
    accent: '#f97316',
  },
  {
    title: 'Vanishing Gradients',
    domain: 'Deep Networks',
    symptom: 'Early layers receive gradients < 10⁻⁸ due to repeated Sigmoid saturation',
    fix: 'Switch to ReLU or residual skips',
    accent: '#facc15',
  },
  {
    title: 'Data Leakage',
    domain: 'Data Science',
    symptom: 'Unrealistic 99.9% test accuracy caused by fitting scalers before train/test split',
    fix: 'Fit transformers strictly on train folds',
    accent: '#06b6d4',
  },
];

export default function LandingDebugging() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="landing-debug" id="debugging" aria-label="AI Debugging & Break-It Mode">
      <div className="landing-debug__container">
        <div className="landing-section-header">
          <span className="landing-section-kicker">ADVERSARIAL LEARNING</span>
          <h2 className="landing-section-title">
            REAL UNDERSTANDING BEGINS WHEN THINGS GO WRONG.
          </h2>
          <p className="landing-section-desc">
            Traditional tutorials only show clean models working correctly. In AI Learning Universe, we intentionally break algorithms so you learn how to diagnose, mathematically explain, and repair failures.
          </p>
        </div>

        {/* The 4-Stage Debug Process Pipeline */}
        <div className="debug-pipeline-card">
          <div className="debug-pipeline-card__header">
            <span className="debug-pipeline-card__tag">
              <Hammer size={15} color="#ef4444" />
              THE 4-STAGE COGNITIVE DEBUGGING CYCLE
            </span>
          </div>

          <div className="debug-stages-row">
            {DEBUG_STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`debug-stage-box ${activeStep === idx ? 'debug-stage-box--active' : ''}`}
                onClick={() => setActiveStep(idx)}
              >
                <span className="debug-stage-label">{step.label}</span>
                <p className="debug-stage-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Failure Scenarios Grid */}
        <div className="failure-scenarios-grid">
          {FAILURE_SCENARIOS.map((scen) => (
            <div key={scen.title} className="failure-card" style={{ '--scen-accent': scen.accent }}>
              <div className="failure-card__head">
                <span className="failure-card__domain">{scen.domain}</span>
                <AlertTriangle size={16} color={scen.accent} />
              </div>

              <h4 className="failure-card__title">{scen.title}</h4>

              <div className="failure-card__item">
                <span className="failure-card__kicker">Symptom:</span>
                <p className="failure-card__val">{scen.symptom}</p>
              </div>

              <div className="failure-card__item failure-card__item--fix">
                <span className="failure-card__kicker">Prescribed Fix:</span>
                <p className="failure-card__val">
                  <CheckCircle2 size={13} color="#10b981" />
                  {scen.fix}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="landing-debug__actions">
          <Button
            variant="primary"
            icon={ArrowRight}
            onClick={() => navigate('/debugging')}
            className="landing-debug__cta"
          >
            EXPLORE AI DEBUGGING
          </Button>
          <Button
            variant="secondary"
            icon={Hammer}
            onClick={() => navigate('/break-it')}
          >
            Break-It Laboratory
          </Button>
        </div>
      </div>
    </section>
  );
}
