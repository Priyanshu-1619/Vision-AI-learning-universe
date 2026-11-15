import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Cpu, ExternalLink, Eye, GitCommitHorizontal, Sparkles } from 'lucide-react';
import NeuronVisualizer from './NeuronVisualizer';
import ActivationExplorer from './ActivationExplorer';
import BackpropStepper from './BackpropStepper';
import VisualizationEngine from '../visualization/VisualizationEngine';
import Card from '../common/Card';
import Button from '../common/Button';
import './InsideModelStudio.css';

const STUDIO_TABS = [
  {
    id: 'neuron',
    label: 'Single Neuron',
    icon: Cpu,
    conceptId: 'neural-networks',
    topicId: 'artificial-neuron',
    subtitle:
      'Trace how input signals are scaled by weights, shifted by bias, and squashed through an activation function.',
  },
  {
    id: 'activations',
    label: 'Activations & Softmax',
    icon: Activity,
    conceptId: 'activation-functions',
    topicId: 'activation-functions',
    subtitle:
      'Compare Sigmoid, Tanh, ReLU, Leaky ReLU derivatives (vanishing & dead regions) and Softmax temperature scaling.',
  },
  {
    id: 'backprop',
    label: 'Backpropagation Stepper',
    icon: GitCommitHorizontal,
    conceptId: 'backpropagation',
    subtitle:
      'Step through a real 2 → 2 → 1 neural network stage-by-stage from forward predictions through chain-rule gradients to weight updates.',
  },
];

export default function InsideModelStudio() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [engineMode, setEngineMode] = useState('modular'); // 'modular' | 'classic'

  const tabParam = searchParams.get('tab') || 'neuron';
  const activeTab = useMemo(
    () => STUDIO_TABS.find((t) => t.id === tabParam) || STUDIO_TABS[0],
    [tabParam]
  );

  const selectTab = (tabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="im-studio fade-in">
      <header className="im-studio__header">
        <div>
          <div className="im-studio__eyebrow">
            <Eye size={14} />
            <span>Phase 5 · Inside the Model</span>
          </div>
          <h1 className="im-studio__title">Inside Neural Networks &amp; Backpropagation</h1>
          <p className="im-studio__subtitle">
            Inspect every multiplication, non-linear activation, and chain-rule gradient flowing
            through a neural network in real time.
          </p>
        </div>

        <div className="im-studio__actions">
          {(activeTab.id === 'neuron' || activeTab.id === 'activations') && (
            <div className="im-engine-selector" role="group" aria-label="Engine Mode">
              <button
                type="button"
                className={`im-engine-btn ${engineMode === 'modular' ? 'im-engine-btn--active' : ''}`}
                onClick={() => setEngineMode('modular')}
                title="Unified Modular Visualization Engine"
              >
                <Sparkles size={13} />
                <span>Modular Engine</span>
              </button>
              <button
                type="button"
                className={`im-engine-btn ${engineMode === 'classic' ? 'im-engine-btn--active' : ''}`}
                onClick={() => setEngineMode('classic')}
                title="Classic Schematic Inspector"
              >
                <span>Classic</span>
              </button>
            </div>
          )}

          <Button
            variant="secondary"
            icon={ExternalLink}
            onClick={() => navigate(`/concept/${activeTab.conceptId}`)}
          >
            Open Linked Concept
          </Button>
        </div>
      </header>

      {/* Main 3-Tab Switcher */}
      <nav className="im-tabs" role="tablist" aria-label="Inside the Model Modules">
        {STUDIO_TABS.map((tab) => {
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`im-tab-btn ${isActive ? 'im-tab-btn--active' : ''}`}
              onClick={() => selectTab(tab.id)}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <Card hoverable={false} className="im-stage-card">
        <div className="im-stage-card__intro">
          <h2>{activeTab.label}</h2>
          <p>{activeTab.subtitle}</p>
        </div>

        {activeTab.id === 'neuron' && (
          engineMode === 'modular' ? (
            <VisualizationEngine topicId="artificial-neuron" />
          ) : (
            <NeuronVisualizer />
          )
        )}

        {activeTab.id === 'activations' && (
          engineMode === 'modular' ? (
            <VisualizationEngine topicId="activation-functions" />
          ) : (
            <ActivationExplorer />
          )
        )}

        {activeTab.id === 'backprop' && <BackpropStepper />}
      </Card>
    </div>
  );
}
