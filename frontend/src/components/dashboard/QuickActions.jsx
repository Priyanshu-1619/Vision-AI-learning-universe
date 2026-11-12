import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import { Network, FlaskConical, Calculator, Trophy, BookA } from 'lucide-react';
import './QuickActions.css';

const actions = [
  {
    title: 'AI Dictionary',
    description: 'Look up any AI/ML term with formulas and examples',
    icon: BookA,
    color: 'var(--accent-yellow)',
    path: '/dictionary',
    glow: 'blue',
  },
  {
    title: 'Explore Knowledge Graph',
    description: 'Visualize how AI concepts connect and build on each other',
    icon: Network,
    color: 'var(--accent-cyan)',
    path: '/knowledge-graph',
    glow: 'cyan',
  },
  {
    title: 'Start a Lab',
    description: 'Run real ML algorithms and see them learn in real-time',
    icon: FlaskConical,
    color: 'var(--accent-emerald)',
    path: '/laboratory',
    glow: 'cyan',
  },
  {
    title: 'Mathematics Playground',
    description: 'Interactive explorations of the math behind machine learning',
    icon: Calculator,
    color: 'var(--accent-purple)',
    path: '/mathematics',
    glow: 'purple',
  },
  {
    title: 'Take a Challenge',
    description: 'Test your understanding with hands-on AI challenges',
    icon: Trophy,
    color: 'var(--accent-amber)',
    path: '/challenges',
    glow: 'blue',
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <section className="quick-actions">
      <h2 className="section-title">Quick Start</h2>
      <div className="quick-actions__grid">
        {actions.map((a) => (
          <Card
            key={a.title}
            className="quick-action-card"
            glow={a.glow}
            onClick={() => navigate(a.path)}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="quick-action-card__icon"
              style={{ background: `color-mix(in srgb, ${a.color} 15%, transparent)` }}
            >
              <a.icon size={24} style={{ color: a.color }} />
            </div>
            <h3 className="quick-action-card__title">{a.title}</h3>
            <p className="quick-action-card__desc">{a.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
