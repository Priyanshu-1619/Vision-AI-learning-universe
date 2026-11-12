import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Network, Clock } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import './PhasePlaceholder.css';

export default function PhasePlaceholder({
  title,
  phase,
  icon: Icon,
  accentColor = '#06b6d4',
  description,
  plannedItems = [],
}) {
  const navigate = useNavigate();

  return (
    <div className="phase-placeholder fade-in">
      <Card
        hoverable={false}
        className="phase-placeholder__card"
        style={{ '--phase-accent': accentColor }}
      >
        <div className="phase-placeholder__top">
          <div className="phase-placeholder__icon-wrap">
            {Icon && <Icon size={32} style={{ color: accentColor }} />}
          </div>
          <Badge text={`Upcoming Milestone — Phase ${phase}`} color={accentColor} size="md" />
        </div>

        <h1 className="phase-placeholder__title">{title}</h1>
        <p className="phase-placeholder__desc">{description}</p>

        {plannedItems.length > 0 && (
          <div className="phase-placeholder__planned">
            <div className="phase-placeholder__planned-header">
              <Clock size={15} style={{ color: accentColor }} />
              <span>Planned for Phase {phase}</span>
            </div>
            <ul className="phase-placeholder__list">
              {plannedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="phase-placeholder__actions">
          <Button icon={Network} onClick={() => navigate('/knowledge-graph')}>
            Explore Knowledge Graph
          </Button>
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
