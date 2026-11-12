import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Cpu, ExternalLink, Eye, GitCommitHorizontal } from 'lucide-react';
import NeuronVisualizer from './NeuronVisualizer';
import ActivationExplorer from './ActivationExplorer';
import BackpropStepper from './BackpropStepper';
import Card from '../common/Card';
import Button from '../common/Button';
import './InsideModelStudio.css';

const STUDIO_TABS = [
  {
    id: 'neuron',
    label: 'Single Neuron',
    icon: Cpu,
    conceptId: 'neural-networks',
    subtitle:
      'Trace how input signals are scaled by weights, shifted by bias, and squashed through an activation function.',
  },
  {
    id: 'activations',
    label: 'Activations & Softmax',
    icon: Activity,
    conceptId: 'activation-functions',
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

        <Button
          variant="secondary"
          icon={ExternalLink}
          onClick={() => navigate(`/concept/${activeTab.conceptId}`)}
        >
          Open Linked Concept
        </Button>
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

        {activeTab.id === 'neuron' && <NeuronVisualizer />}
        {activeTab.id === 'activations' && <ActivationExplorer />}
        {activeTab.id === 'backprop' && <BackpropStepper />}
      </Card>
    </div>
  );
}
