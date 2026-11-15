import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Layers, Award, ArrowRight, Check } from 'lucide-react';
import Button from '../common/Button';
import './LandingLevels.css';

const LEVELS = [
  {
    id: 'basic',
    name: 'BASIC — BEGINNER',
    icon: Sparkles,
    badge: 'Foundation',
    accent: '#10b981',
    description: 'Build strong foundations and understand essential concepts from scratch.',
    topics: [
      'Core Terminology & Mental Models',
      'Data Preparation & Summary Statistics',
      'Simple Linear & Logistic Classification',
      'Intuitive Probability & Bayes Theorem',
      'Step-by-Step Algorithm Walkthroughs',
    ],
    targetDomain: 'machine-learning',
  },
  {
    id: 'intermediate',
    name: 'INTERMEDIATE',
    icon: Layers,
    badge: 'Algorithms',
    accent: '#38bdf8',
    description: 'Explore algorithms, mathematical relationships, model behavior, and practical implementations.',
    topics: [
      'Ensemble Methods & Random Forests',
      'Clustering (K-Means) & Vector Spaces',
      'Support Vector Machines & Kernels',
      'Gradient Descent & Loss Surfaces',
      'Model Evaluation & Regularization',
    ],
    targetDomain: 'machine-learning',
  },
  {
    id: 'advanced',
    name: 'ADVANCED',
    icon: Award,
    badge: 'Architectures',
    accent: '#facc15',
    description: 'Understand complex architectures, optimization, advanced algorithms, and real-world applications.',
    topics: [
      'Multi-Layer Backpropagation Calculus',
      'CNN Feature Hierarchies & Pooling',
      'RNN / LSTM Recurrence Dynamics',
      'Self-Attention & Transformer Blocks',
      'Latent Representation & Autoencoders',
    ],
    targetDomain: 'deep-learning',
  },
];

export default function LandingLevels() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState('intermediate');

  const activeLevelData = LEVELS.find((l) => l.id === selectedLevel) || LEVELS[0];

  const handleStartLevel = (levelId, domain) => {
    navigate(`/roadmaps/${domain}?level=${levelId}`);
  };

  return (
    <section className="landing-levels" id="levels" aria-label="Learning Tiers">
      <div className="landing-levels__container">
        <div className="landing-section-header">
          <span className="landing-section-kicker">FLEXIBLE ENTRY POINTS</span>
          <h2 className="landing-section-title">LEARN AT YOUR OWN LEVEL</h2>
          <p className="landing-section-desc">
            You are never locked into a rigid sequence. Jump directly into the tier matching your background and move freely between basic, intermediate, and advanced concepts.
          </p>
        </div>

        {/* Level Cards */}
        <div className="landing-levels__grid">
          {LEVELS.map((lvl) => {
            const Icon = lvl.icon;
            const isSelected = lvl.id === selectedLevel;
            return (
              <div
                key={lvl.id}
                className={`level-card ${isSelected ? 'level-card--selected' : ''}`}
                onClick={() => setSelectedLevel(lvl.id)}
                style={{ '--level-accent': lvl.accent }}
              >
                <div className="level-card__top">
                  <div className="level-card__icon-box">
                    <Icon size={22} color={lvl.accent} />
                  </div>
                  <span className="level-card__badge" style={{ color: lvl.accent, borderColor: lvl.accent }}>
                    {lvl.badge}
                  </span>
                </div>

                <h3 className="level-card__name">{lvl.name}</h3>
                <p className="level-card__desc">{lvl.description}</p>

                <ul className="level-card__topics">
                  {lvl.topics.map((t) => (
                    <li key={t}>
                      <Check size={14} color={lvl.accent} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="level-card__select-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartLevel(lvl.id, lvl.targetDomain);
                  }}
                >
                  Start at this Level →
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner CTA */}
        <div className="landing-levels__banner">
          <div>
            <h4 className="landing-levels__banner-title">
              Ready to begin your journey at the {activeLevelData.name} level?
            </h4>
            <p className="landing-levels__banner-desc">
              All roadmap topics, mathematics prerequisites, and interactive laboratory modules are unlocked.
            </p>
          </div>
          <Button
            variant="primary"
            icon={ArrowRight}
            onClick={() => handleStartLevel(activeLevelData.id, activeLevelData.targetDomain)}
            className="landing-levels__banner-btn"
          >
            CHOOSE YOUR LEARNING PATH
          </Button>
        </div>
      </div>
    </section>
  );
}
