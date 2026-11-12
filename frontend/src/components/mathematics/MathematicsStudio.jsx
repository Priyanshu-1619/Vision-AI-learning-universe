import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calculator, ExternalLink, Lightbulb, Sparkles } from 'lucide-react';
import { MATH_GROUPS, MATH_TOPICS, getMathTopicById } from './mathConfig';
import StatisticsVisualizer from './StatisticsVisualizer';
import LinearAlgebraVisualizer from './LinearAlgebraVisualizer';
import CalculusOptimizationVisualizer from './CalculusOptimizationVisualizer';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './MathematicsStudio.css';

export default function MathematicsStudio() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTopic = searchParams.get('topic') || 'mean';
  const activeTopic = useMemo(() => getMathTopicById(rawTopic), [rawTopic]);
  const activeGroup = useMemo(
    () => MATH_GROUPS.find((g) => g.id === activeTopic.group) || MATH_GROUPS[0],
    [activeTopic.group]
  );

  const selectTopic = (topicId) => {
    const next = new URLSearchParams(searchParams);
    next.set('topic', topicId);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="math-studio fade-in">
      {/* Studio Header */}
      <header className="math-studio__header">
        <div>
          <div className="math-studio__eyebrow">
            <Calculator size={14} />
            <span>Phase 4 · Mathematics Physically Visualized</span>
          </div>
          <h1 className="math-studio__title">Interactive Mathematics Laboratory</h1>
          <p className="math-studio__subtitle">
            Build geometric and physical intuition for the statistics, linear algebra, and
            calculus powering machine learning—computed live in your browser.
          </p>
        </div>
      </header>

      {/* Topic Selector Sidebar + Active Visualizer */}
      <div className="math-studio__layout">
        <aside className="math-studio__nav" aria-label="Mathematics topics">
          {MATH_GROUPS.map((group) => {
            const topicsInGroup = MATH_TOPICS.filter((t) => t.group === group.id);
            return (
              <div key={group.id} className="math-nav-group">
                <div className="math-nav-group__title" style={{ color: group.color }}>
                  <span className="math-nav-group__dot" style={{ background: group.color }} />
                  <span>{group.label}</span>
                </div>
                <div className="math-nav-group__list">
                  {topicsInGroup.map((t) => {
                    const isActive = t.id === activeTopic.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`math-nav-item ${isActive ? 'math-nav-item--active' : ''}`}
                        style={{ '--topic-accent': group.color }}
                        onClick={() => selectTopic(t.id)}
                      >
                        {t.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        <section className="math-studio__stage">
          <Card hoverable={false} className="math-stage-card">
            <div className="math-stage-card__header">
              <div>
                <Badge text={activeGroup.label} color={activeGroup.color} size="md" />
                <h2 className="math-stage-card__title">{activeTopic.title}</h2>
              </div>

              {activeTopic.conceptId && (
                <Button
                  variant="secondary"
                  icon={ExternalLink}
                  onClick={() => navigate(`/concept/${activeTopic.conceptId}`)}
                >
                  Open Concept
                </Button>
              )}
            </div>

            <div className="math-formulas-bar">
              {activeTopic.formulas.map((f, idx) => (
                <code key={idx} className="math-formula-pill">
                  {f}
                </code>
              ))}
            </div>

            {/* Active Topic Visualizer */}
            <div className="math-stage-card__viz">
              {activeTopic.group === 'statistics' && (
                <StatisticsVisualizer topicId={activeTopic.id} />
              )}
              {activeTopic.group === 'linear-algebra' && (
                <LinearAlgebraVisualizer topicId={activeTopic.id} />
              )}
              {activeTopic.group === 'calculus' && (
                <CalculusOptimizationVisualizer topicId={activeTopic.id} />
              )}
            </div>
          </Card>

          <div className="math-insights-grid">
            <Card hoverable={false} className="math-insight-card">
              <div className="math-insight-card__head">
                <Lightbulb size={18} style={{ color: 'var(--accent-cyan)' }} />
                <h3>Physical Intuition</h3>
              </div>
              <p>{activeTopic.physicalIntuition}</p>
            </Card>

            <Card hoverable={false} className="math-insight-card">
              <div className="math-insight-card__head">
                <Sparkles size={18} style={{ color: 'var(--accent-purple)' }} />
                <h3>Why It Matters in AI</h3>
              </div>
              <p>{activeTopic.aiConnection}</p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
