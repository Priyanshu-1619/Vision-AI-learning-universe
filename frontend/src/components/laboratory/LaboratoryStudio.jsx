import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FlaskConical, ExternalLink } from 'lucide-react';
import { LABS, getLabById } from './labConfig';
import LinearRegressionLab from './LinearRegressionLab';
import KMeansLab from './KMeansLab';
import KNNLab from './KNNLab';
import DecisionTreeLab from './DecisionTreeLab';
import PCALab from './PCALab';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './LaboratoryStudio.css';

export default function LaboratoryStudio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentLabId = searchParams.get('lab') || 'linear-regression';
  const activeLab = useMemo(() => getLabById(currentLabId), [currentLabId]);

  const setLab = (id) => {
    setSearchParams({ lab: id });
  };

  const renderActiveLab = () => {
    switch (activeLab.id) {
      case 'linear-regression':
        return <LinearRegressionLab config={activeLab} />;
      case 'kmeans':
        return <KMeansLab config={activeLab} />;
      case 'knn':
        return <KNNLab config={activeLab} />;
      case 'decision-tree':
        return <DecisionTreeLab config={activeLab} />;
      case 'pca':
        return <PCALab config={activeLab} />;
      default:
        return <LinearRegressionLab config={activeLab} />;
    }
  };

  return (
    <div className="lab-studio fade-in">
      {/* Studio Header */}
      <header className="lab-studio__header">
        <div className="lab-studio__title-area">
          <div className="lab-studio__icon-box">
            <FlaskConical size={26} color="#10b981" />
          </div>
          <div>
            <div className="lab-studio__badge-row">
              <Badge text="Phase 3" color="#10b981" size="sm" />
              <Badge text={activeLab.badge || 'Algorithm Lab'} color="#38bdf8" size="sm" />
            </div>
            <h1 className="lab-studio__title">AI Laboratory</h1>
            <p className="lab-studio__desc">
              Live algorithmic proving ground. Run scikit-learn models, inspect convergence, and interact with real-time decision surfaces.
            </p>
          </div>
        </div>

        {activeLab.conceptId && (
          <Button
            variant="secondary"
            icon={ExternalLink}
            onClick={() => navigate(`/concept/${activeLab.conceptId}`)}
          >
            Concept Theory
          </Button>
        )}
      </header>

      {/* Tabs Navigation */}
      <nav className="lab-studio__tabs" aria-label="Laboratory Modules">
        {LABS.map((lab) => {
          const isActive = lab.id === activeLab.id;
          return (
            <button
              key={lab.id}
              type="button"
              className={`lab-tab ${isActive ? 'lab-tab--active' : ''}`}
              onClick={() => setLab(lab.id)}
            >
              <span className="lab-tab__icon">{lab.icon}</span>
              <span className="lab-tab__label">{lab.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Lab Body */}
      <main className="lab-studio__body">
        {renderActiveLab()}
      </main>
    </div>
  );
}
