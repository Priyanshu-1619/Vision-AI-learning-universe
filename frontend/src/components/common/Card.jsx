import './Card.css';

export default function Card({ children, className = '', glow = 'cyan', hoverable = true, onClick, style }) {
  return (
    <div
      className={`card ${hoverable ? 'card--hoverable' : ''} card--glow-${glow} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
