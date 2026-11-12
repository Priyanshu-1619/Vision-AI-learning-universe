import './VisualizationContainer.css';

export default function VisualizationContainer({ title, children, className = '' }) {
  return (
    <div className={`viz-container ${className}`}>
      {title && <h3 className="viz-container__title">{title}</h3>}
      <div className="viz-container__content">
        {children}
      </div>
    </div>
  );
}
