import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FlaskConical, ExternalLink } from 'lucide-react';
import { LABS, getLabById } from './labConfig';
import LinearRegressionLab from './LinearRegressionLab';
import KMeansLab from './KMeansLab';
import KNNLab from './KNNLab';
import DecisionTreeLab from './DecisionTreeLab';
import PCALab from './PCALab';
import LogisticRegressionLab from './LogisticRegressionLab';
import RandomForestLab from './RandomForestLab';
import SVMLab from './SVMLab';
import NaiveBayesLab from './NaiveBayesLab';
import GradientDescentLab from './GradientDescentLab';
import PerceptronLab from './PerceptronLab';
import CNNLab from './CNNLab';
import AutoencoderLab from './AutoencoderLab';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './LaboratoryStudio.css';

const CATEGORIES = [
  { id: 'all', label: 'All Algorithms' },
  { id: 'ml', label: 'Machine Learning' },
  { id: 'dl', label: 'Deep Learning' },
  { id: 'opt', label: 'Optimization' },
];

export default function LaboratoryStudio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const currentLabId = searchParams.get('lab') || 'linear-regression';
  const activeLab = useMemo(() => getLabById(currentLabId), [currentLabId]);

  const setLab = (id) => {
    setSearchParams({ lab: id });
  };

  const filteredLabs = useMemo(() => {
    if (selectedCategory === 'all') return LABS;
    if (selectedCategory === 'ml') {
      return LABS.filter((l) =>
        ['linear-regression', 'logistic-regression', 'kmeans', 'knn', 'decision-tree', 'random-forest', 'svm', 'naive-bayes', 'pca'].includes(l.id)
      );
    }
    if (selectedCategory === 'dl') {
      return LABS.filter((l) => ['perceptron', 'cnn', 'autoencoder'].includes(l.id));
    }
    if (selectedCategory === 'opt') {
      return LABS.filter((l) => ['gradient-descent', 'linear-regression'].includes(l.id));
    }
    return LABS;
  }, [selectedCategory]);

  const renderActiveLab = () => {
    switch (activeLab.id) {
      case 'linear-regression':
        return <LinearRegressionLab config={activeLab} />;
      case 'logistic-regression':
        return <LogisticRegressionLab config={activeLab} />;
      case 'kmeans':
        return <KMeansLab config={activeLab} />;
      case 'knn':
        return <KNNLab config={activeLab} />;
      case 'decision-tree':
        return <DecisionTreeLab config={activeLab} />;
      case 'random-forest':
        return <RandomForestLab config={activeLab} />;
      case 'svm':
        return <SVMLab config={activeLab} />;
      case 'naive-bayes':
        return <NaiveBayesLab config={activeLab} />;
      case 'pca':
        return <PCALab config={activeLab} />;
      case 'gradient-descent':
        return <GradientDescentLab config={activeLab} />;
      case 'perceptron':
        return <PerceptronLab config={activeLab} />;
      case 'cnn':
        return <CNNLab config={activeLab} />;
      case 'autoencoder':
        return <AutoencoderLab config={activeLab} />;
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
              <Badge text="Algorithm Laboratory" color="#10b981" size="sm" />
              <Badge text={activeLab.badge || 'Live ML Proving Ground'} color="#38bdf8" size="sm" />
              <Badge text="Zero External AI API" color="#facc15" size="sm" />
            </div>
            <h1 className="lab-studio__title">AI Laboratory</h1>
            <p className="lab-studio__desc">
              Live algorithmic proving ground. Run scikit-learn and deep learning models locally, inspect convergence, and interact with real-time decision surfaces.
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

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
          Filter:
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 500,
              background: selectedCategory === cat.id ? '#164bff' : 'rgba(255, 255, 255, 0.05)',
              color: selectedCategory === cat.id ? '#ffffff' : '#94a3b8',
              border: selectedCategory === cat.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tabs Navigation */}
      <nav className="lab-studio__tabs" aria-label="Laboratory Modules">
        {filteredLabs.map((lab) => {
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
