import { Database, Info } from 'lucide-react';
import './DatasetExplorer.css';

/**
 * Reusable Dataset Explorer for Visualization Engine.
 * Allows switching between predefined mathematical/ML datasets and previewing point distributions.
 */
export default function DatasetExplorer({
  datasets = [],
  selectedId,
  onSelectDataset,
  stats = null,
  className = '',
}) {
  if (!datasets || datasets.length === 0) return null;

  const activeDataset = datasets.find((d) => d.id === selectedId) || datasets[0];

  return (
    <div className={`dataset-explorer ${className}`}>
      <div className="dataset-explorer__header">
        <div className="dataset-explorer__title-row">
          <Database size={15} className="dataset-explorer__icon" />
          <span className="dataset-explorer__title">Dataset Source</span>
        </div>
        {activeDataset && (
          <span className="dataset-explorer__count">
            {activeDataset.points ? `${activeDataset.points.length} samples` : activeDataset.sampleCount || 'Synthetic'}
          </span>
        )}
      </div>

      <div className="dataset-explorer__chips" role="tablist">
        {datasets.map((ds) => {
          const isActive = ds.id === selectedId;
          return (
            <button
              key={ds.id}
              type="button"
              className={`dataset-chip ${isActive ? 'dataset-chip--active' : ''}`}
              onClick={() => onSelectDataset && onSelectDataset(ds.id)}
              title={ds.description || ds.label}
            >
              <span>{ds.label}</span>
              {ds.badge && <span className="dataset-chip__badge">{ds.badge}</span>}
            </button>
          );
        })}
      </div>

      {activeDataset.description && (
        <div className="dataset-explorer__desc">
          <Info size={12} className="dataset-explorer__info-icon" />
          <span>{activeDataset.description}</span>
        </div>
      )}

      {stats && (
        <div className="dataset-explorer__stats">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="dataset-explorer__stat-pill">
              <span className="dataset-explorer__stat-label">{k}:</span>
              <strong className="dataset-explorer__stat-val">{typeof v === 'number' ? v.toFixed(2) : String(v)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

