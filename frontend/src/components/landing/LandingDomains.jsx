import { useNavigate } from 'react-router-dom';
import { Database, Brain, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import './LandingDomains.css';

const DOMAIN_CARDS = [
  {
    id: 'data-science',
    title: 'DATA SCIENCE',
    icon: Database,
    accent: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.25)',
    route: '/data-science',
    roadmapRoute: '/roadmaps/data-science',
    description:
      'Discover the science behind data. Explore statistics, probability, data analysis, visualization, preprocessing, and mathematical foundations.',
    topics: [
      'Data Analysis',
      'Statistics',
      'Probability',
      'Data Visualization',
      'Data Preprocessing',
      'Regression',
    ],
    cta: 'EXPLORE DATA SCIENCE',
  },
  {
    id: 'machine-learning',
    title: 'MACHINE LEARNING',
    icon: Brain,
    accent: '#164bff',
    glow: 'rgba(22, 75, 255, 0.3)',
    route: '/machine-learning',
    roadmapRoute: '/roadmaps/machine-learning',
    description:
      'Understand how machines learn from data through algorithms, mathematical models, optimization, and experimentation.',
    topics: [
      'Regression',
      'Classification',
      'Clustering',
      'Decision Trees',
      'Optimization',
      'Model Evaluation',
    ],
    cta: 'EXPLORE MACHINE LEARNING',
  },
  {
    id: 'deep-learning',
    title: 'DEEP LEARNING',
    icon: Zap,
    accent: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.25)',
    route: '/deep-learning',
    roadmapRoute: '/roadmaps/deep-learning',
    description:
      'Explore the inner workings of neural networks, backpropagation, CNNs, RNNs, attention, and transformers.',
    topics: [
      'Neural Networks',
      'Activation Functions',
      'Backpropagation',
      'CNN',
      'RNN / LSTM',
      'Transformers',
    ],
    cta: 'EXPLORE DEEP LEARNING',
  },
];

export default function LandingDomains() {
  const navigate = useNavigate();

  return (
    <section className="landing-domains" id="domains" aria-label="Learning Domains">
      <div className="landing-domains__container">
        <div className="landing-section-header">
          <span className="landing-section-kicker">INDEPENDENT CURRICULA</span>
          <h2 className="landing-section-title">CHOOSE YOUR LEARNING DOMAIN</h2>
          <p className="landing-section-desc">
            Three completely independent learning environments. Select your discipline and master theory, mathematics, and live algorithms.
          </p>
        </div>

        <div className="landing-domains__grid">
          {DOMAIN_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="domain-card"
                style={{
                  '--card-accent': card.accent,
                  '--card-glow': card.glow,
                }}
              >
                {/* Header */}
                <div className="domain-card__head">
                  <div className="domain-card__icon-box">
                    <Icon size={24} color={card.accent} />
                  </div>
                  <span className="domain-card__domain-tag">{card.id.replace('-', ' ')}</span>
                </div>

                <h3 className="domain-card__title">{card.title}</h3>
                <p className="domain-card__desc">{card.description}</p>

                {/* Topics list */}
                <div className="domain-card__topics-box">
                  <span className="domain-card__topics-label">Core Curriculum:</span>
                  <div className="domain-card__topic-pills">
                    {card.topics.map((t) => (
                      <span key={t} className="domain-card__pill">
                        <CheckCircle2 size={12} color={card.accent} />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="domain-card__actions">
                  <Button
                    variant="primary"
                    className="domain-card__cta"
                    onClick={() => navigate(card.route)}
                  >
                    {card.cta}
                    <ArrowRight size={15} />
                  </Button>

                  <button
                    type="button"
                    className="domain-card__roadmap-btn"
                    onClick={() => navigate(card.roadmapRoute)}
                  >
                    View Domain Roadmap ↗
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
