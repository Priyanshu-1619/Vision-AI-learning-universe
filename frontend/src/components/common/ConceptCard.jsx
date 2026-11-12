import Card from './Card';
import Badge from './Badge';
import { useNavigate } from 'react-router-dom';
import './ConceptCard.css';

export default function ConceptCard({ concept }) {
  const navigate = useNavigate();
  return (
    <Card
      className="concept-card"
      onClick={() => navigate(`/concept/${concept.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="concept-card__header">
        <span className="concept-card__icon">{concept.icon}</span>
        <Badge text={concept.difficulty} color={concept.color} />
      </div>
      <h3 className="concept-card__title">{concept.title}</h3>
      <p className="concept-card__category" style={{ color: concept.color }}>
        {concept.category}
      </p>
      <p className="concept-card__definition">
        {concept.definition?.slice(0, 100)}{concept.definition?.length > 100 ? '…' : ''}
      </p>
    </Card>
  );
}
