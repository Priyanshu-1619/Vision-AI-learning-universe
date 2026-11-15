import { useNavigate } from 'react-router-dom';
import { RotateCcw, Layers, Map, Clock, Calculator } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const DOMAIN_LINKS = [
  { id: 'data-science', label: 'Data Science', path: '/roadmaps/data-science', color: 'var(--ds-accent, #06b6d4)' },
  { id: 'machine-learning', label: 'Machine Learning', path: '/roadmaps/machine-learning', color: 'var(--ml-accent, #164BFF)' },
  { id: 'deep-learning', label: 'Deep Learning', path: '/roadmaps/deep-learning', color: 'var(--dl-accent, #8b5cf6)' },
];

export default function RoadmapHeader({
  domain,
  meta,
  overallMetrics,
  mathMetrics,
  onOpenMathRequirements,
  onResetClick,
}) {
  const navigate = useNavigate();

  const totalHours = Math.round((overallMetrics.totalTimeMinutes || (overallMetrics.total * 35)) / 60);

  return (
    <header className="roadmap__header">
      <div className="roadmap__header-main">
        <div className="roadmap__badge-row">
          <Badge text="Structured Learning Roadmap" color={meta.accent} size="md" />
          <span className="roadmap__meta-item">
            Domain: <strong>{meta.title}</strong>
          </span>
          <span className="roadmap__meta-item">
            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            ~{totalHours} hrs estimated
          </span>
        </div>

        <h1 className="roadmap__title">{meta.title}</h1>
        <p className="roadmap__desc">{meta.description}</p>

        {/* Domain Switcher Chips */}
        <div className="roadmap__domain-switcher" role="tablist" aria-label="Roadmap Domains">
          <span className="roadmap__switcher-label">Switch Domain:</span>
          {DOMAIN_LINKS.map((dom) => {
            const isActive = dom.id === domain;
            return (
              <button
                key={dom.id}
                type="button"
                className={`roadmap__domain-chip ${isActive ? 'roadmap__domain-chip--active' : ''}`}
                style={{ '--chip-accent': dom.color }}
                onClick={() => navigate(dom.path)}
              >
                <Map size={13} />
                <span>{dom.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overall Domain Progress Bar */}
        <div className="roadmap__progress-box">
          <div className="roadmap__progress-head">
            <span className="roadmap__progress-label">
              Overall Progress: <strong>{overallMetrics.completed}</strong> completed · <strong>{overallMetrics.inProgress}</strong> in progress of <strong>{overallMetrics.total}</strong> topics
            </span>
            <span className="roadmap__progress-val">{overallMetrics.percent}%</span>
          </div>
          <div className="roadmap__progress-track">
            <div
              className="roadmap__progress-fill"
              style={{ width: `${overallMetrics.percent}%`, background: meta.accent }}
            />
          </div>
        </div>
      </div>

      <div className="roadmap__header-actions">
        {/* Dedicated Mathematics Requirements Button */}
        <button
          type="button"
          className="roadmap__math-req-btn"
          onClick={onOpenMathRequirements}
          title={`View and track mathematics prerequisites for ${meta.title}`}
        >
          <div className="roadmap__math-req-btn-icon" style={{ color: meta.accent }}>
            <Calculator size={18} />
          </div>
          <div className="roadmap__math-req-btn-content">
            <span className="roadmap__math-req-btn-title">Mathematics Requirements</span>
            <span className="roadmap__math-req-btn-stats">
              {mathMetrics ? `${mathMetrics.completed}/${mathMetrics.total} Completed (${mathMetrics.percent}%)` : 'View Requirements'}
            </span>
          </div>
        </button>

        <Button
          variant="ghost"
          icon={RotateCcw}
          onClick={onResetClick}
          title="Reset Level Progress"
        >
          Reset Level
        </Button>
        <Button
          variant="secondary"
          icon={Layers}
          onClick={() => navigate(`/${domain}`)}
        >
          Domain Overview
        </Button>
      </div>
    </header>
  );
}
