import { useNavigate } from 'react-router-dom';
import { BookA } from 'lucide-react';
import './TermLink.css';

/**
 * Reusable inline or chip link to a term in the AI Dictionary or Concept Universe.
 *
 * @param {string} term - The term string or concept ID to search or navigate to
 * @param {string} [label] - Display label (defaults to term)
 * @param {string} [conceptId] - Optional specific concept ID if known
 * @param {'inline'|'chip'|'badge'} [variant='inline'] - Visual styling variant
 * @param {boolean} [showIcon=false] - Whether to show the dictionary book icon
 */
export default function TermLink({
  term,
  label,
  conceptId,
  variant = 'inline',
  showIcon = false,
  className = '',
}) {
  const navigate = useNavigate();
  const text = label || term;

  const handleClick = (e) => {
    e.stopPropagation();
    if (conceptId) {
      navigate(`/concept/${conceptId}`);
    } else {
      navigate(`/dictionary?search=${encodeURIComponent(term)}`);
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      className={`term-link term-link--${variant} ${className}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
      title={`Look up "${text}" in AI Knowledge Dictionary`}
    >
      {showIcon && <BookA size={12} className="term-link__icon" />}
      <span className="term-link__text">{text}</span>
    </span>
  );
}

