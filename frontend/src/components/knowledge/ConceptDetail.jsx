import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Dna,
  Eye,
  FlaskConical,
  GitBranch,
  Hammer,
  HelpCircle,
  Layers,
  Network,
  Sparkles,
  BookA,
  Map,
} from 'lucide-react';
import { fetchConcept } from '../../api/client';
import { useConcepts } from '../../hooks/useConcepts';
import {
  markConceptExplored,
  resolveConceptLinks,
} from '../../concept-engine/ConceptEngine';
import { getMathTopicForConcept } from '../mathematics/mathConfig';
import { getLabIdForConcept } from '../../utils/labEngine';
import { getInsideModelTabForConcept } from '../../utils/neuralEngine';
import { getEvolutionTargetForConcept } from '../evolution/evolutionData';
import {
  getBreakItScenarioForConcept,
  getWhatIfExpForConcept,
} from '../experiments/breakItConfig';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loading from '../common/Loading';
import VisualizationContainer from '../common/VisualizationContainer';
import VisualizationEngine from '../visualization/VisualizationEngine';
import { getVisualizationConfig } from '../visualization/visualizationRegistry';
import './ConceptDetail.css';

const CONCEPT_TO_VIZ = {
  'neural-networks': 'artificial-neuron',
  'artificial-neurons': 'artificial-neuron',
  'perceptrons': 'artificial-neuron',
  'activation-functions': 'activation-functions',
  'forward-propagation': 'forward-propagation',
  'backpropagation': 'backpropagation-gradients',
  'linear-regression': 'linear-functions',
  'statistics': 'descriptive-statistics',
  'data-cleaning': 'descriptive-statistics',
  'correlation': 'correlation-analysis',
  'classification': 'perceptron-classifier',
  'linear-algebra': 'vector-transformations',
  'kmeans-clustering': 'kmeans-clustering',
  'clustering': 'kmeans-clustering',
  'knn': 'knn-classifier',
  'gradient-descent': 'gradient-descent',
};

export default function ConceptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { concepts, loading: listLoading } = useConcepts();

  const [fetchResult, setFetchResult] = useState({ id: null, data: null });

  useEffect(() => {
    let cancelled = false;

    fetchConcept(id).then((data) => {
      if (!cancelled) {
        setFetchResult({
          id,
          data: data && data.id === id ? data : null,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const detailLoading = fetchResult.id !== id;
  const fetchedConcept = fetchResult.id === id ? fetchResult.data : null;

  const concept = useMemo(() => {
    if (fetchedConcept) return fetchedConcept;
    return concepts.find((c) => c.id === id) || null;
  }, [fetchedConcept, concepts, id]);

  useEffect(() => {
    if (concept?.id) {
      markConceptExplored(concept.id);
    }
  }, [concept?.id]);

  const links = useMemo(
    () => resolveConceptLinks(concept, concepts),
    [concept, concepts]
  );

  const matchedVizTopic = useMemo(() => {
    if (!concept?.id) return null;
    const mapped = CONCEPT_TO_VIZ[concept.id] || concept.id;
    return getVisualizationConfig(mapped) ? mapped : null;
  }, [concept]);

  if (detailLoading || (!concept && listLoading)) {
    return <Loading text="Loading concept details..." />;
  }

  if (!concept) {
    return (
      <div className="concept-detail fade-in">
        <Card className="concept-detail__not-found" hoverable={false}>
          <h2>Concept Not Found</h2>
          <p>
            No concept matching <code>{id}</code> exists in the Concept Engine.
          </p>
          <div className="concept-detail__not-found-actions">
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

  const formulas = concept.mathematics?.formulas || [];
  const mathExplanation = concept.mathematics?.explanation || '';
  const vizType = concept.visualization?.type || 'none';
  const vizParams = concept.visualization?.parameters || {};
  const vizParamEntries = Object.entries(vizParams);
  const accentColor = concept.color || '#06b6d4';
  const mathTopicId = getMathTopicForConcept(concept.id);
  const labId = getLabIdForConcept(concept.id);
  const insideModelTab = getInsideModelTabForConcept(concept.id);
  const evolutionTarget = getEvolutionTargetForConcept(concept.id);
  const breakItScenario = getBreakItScenarioForConcept(concept.id);
  const whatIfExp = getWhatIfExpForConcept(concept.id);

  const renderLinkChip = (item, direction = 'neutral') => (
    <button
      key={item.id}
      type="button"
      className="concept-link-chip"
      onClick={() => navigate(`/concept/${item.id}`)}
      style={{ '--chip-color': item.color || '#06b6d4' }}
    >
      <span className="concept-link-chip__icon">{item.icon}</span>
      <span className="concept-link-chip__body">
        <span className="concept-link-chip__title">{item.title}</span>
        <span className="concept-link-chip__meta">
          {item.category} · {item.difficulty}
        </span>
      </span>
      {direction === 'next' && <ArrowRight size={14} className="concept-link-chip__arrow" />}
    </button>
  );

  return (
    <div className="concept-detail fade-in">
      <div className="concept-detail__top-nav">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/knowledge-graph')}
          >
            Knowledge Graph
          </Button>
          <Button
            variant="secondary"
            icon={BookA}
            onClick={() => navigate(`/dictionary?search=${encodeURIComponent(concept.title)}`)}
          >
            Dictionary Entry
          </Button>
          <Button
            variant="secondary"
            icon={Map}
            onClick={() => navigate(`/roadmap/${concept.domain || 'data-science'}`)}
          >
            Domain Roadmap
          </Button>
        </div>
        <span className="concept-detail__explored-pill">
          <CheckCircle2 size={14} />
          Explored
        </span>
      </div>

      {/* Header Banner */}
      <section
        className="concept-detail__header"
        style={{ '--concept-accent': accentColor }}
      >
        <div className="concept-detail__icon-box">{concept.icon}</div>
        <div className="concept-detail__header-info">
          <div className="concept-detail__badges">
            <Badge text={concept.category} color={accentColor} size="md" />
            <Badge text={concept.difficulty} color="#3b82f6" size="md" />
          </div>
          <h1 className="concept-detail__title">{concept.title}</h1>
          <p className="concept-detail__id">id: {concept.id}</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="concept-detail__grid">
        <div className="concept-detail__main">
          {/* Definition */}
          <Card hoverable={false} className="concept-detail__card">
            <div className="concept-detail__card-head">
              <BookOpen size={18} style={{ color: accentColor }} />
              <h2>Core Definition</h2>
            </div>
            <p className="concept-detail__definition">{concept.definition}</p>
            {concept.beginnerExplanation && (
              <div className="concept-detail__intuition-box">
                <span className="concept-detail__box-label">Beginner Intuition</span>
                <p>{concept.beginnerExplanation}</p>
              </div>
            )}
            {concept.example && (
              <div className="concept-detail__example-box">
                <span className="concept-detail__box-label">Real-World Example</span>
                <p>{concept.example}</p>
              </div>
            )}
          </Card>

          {/* Mathematics */}
          <Card hoverable={false} className="concept-detail__card">
            <div className="concept-detail__card-head">
              <Calculator size={18} style={{ color: 'var(--accent-purple)' }} />
              <h2>Mathematical Formulation</h2>
            </div>

            {formulas.length > 0 ? (
              <div className="concept-detail__formulas">
                {formulas.map((formula, idx) => (
                  <pre key={idx} className="concept-detail__formula">
                    <code>{formula}</code>
                  </pre>
                ))}
              </div>
            ) : (
              <p className="concept-detail__muted">
                No symbolic formulas registered for this concept.
              </p>
            )}

            {mathExplanation && (
              <p className="concept-detail__math-explanation">{mathExplanation}</p>
            )}
          </Card>

          {/* Live Modular Visualization Engine */}
          {matchedVizTopic && (
            <div className="concept-detail__live-viz">
              <div className="concept-detail__card-head" style={{ marginBottom: '14px' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-yellow, #FFD928)' }} />
                <h2>Live Interactive Visualization</h2>
              </div>
              <VisualizationEngine topicId={matchedVizTopic} />
            </div>
          )}

          {/* Visualization Spec Preview */}
          <VisualizationContainer
            title="Visualization Specification"
            className="concept-detail__viz"
          >
            <div className="concept-detail__viz-inner">
              <div className="concept-detail__viz-header">
                <Sparkles size={18} style={{ color: accentColor }} />
                <div>
                  <span className="concept-detail__viz-label">Configured Engine Type</span>
                  <h4 className="concept-detail__viz-type">{vizType}</h4>
                </div>
              </div>

              {vizParamEntries.length > 0 ? (
                <div className="concept-detail__viz-params">
                  {vizParamEntries.map(([key, val]) => (
                    <div key={key} className="concept-detail__viz-param">
                      <span className="concept-detail__viz-param-key">{key}</span>
                      <code className="concept-detail__viz-param-val">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </code>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="concept-detail__muted">
                  Default parameter configuration (<code>{'{}'}</code>) registered in Concept Engine.
                </p>
              )}

              {mathTopicId || labId || insideModelTab || evolutionTarget || breakItScenario || whatIfExp ? (
                <div className="concept-detail__viz-launch">
                  {labId && (
                    <Button
                      icon={FlaskConical}
                      onClick={() => navigate(`/laboratory?lab=${labId}`)}
                    >
                      Launch in AI Laboratory
                    </Button>
                  )}
                  {mathTopicId && (
                    <Button
                      icon={Calculator}
                      onClick={() => navigate(`/mathematics?topic=${mathTopicId}`)}
                    >
                      Launch Interactive Math Lab
                    </Button>
                  )}
                  {insideModelTab && (
                    <Button
                      icon={Eye}
                      onClick={() => navigate(`/inside-model?tab=${insideModelTab}`)}
                    >
                      Launch Inside the Model
                    </Button>
                  )}
                  {breakItScenario && (
                    <Button
                      icon={Hammer}
                      onClick={() => navigate(`/break-it?scenario=${breakItScenario}`)}
                    >
                      Open in Break-It Lab
                    </Button>
                  )}
                  {whatIfExp && (
                    <Button
                      variant="secondary"
                      icon={HelpCircle}
                      onClick={() => navigate(`/what-if?exp=${whatIfExp}`)}
                    >
                      Open What-If Studio
                    </Button>
                  )}
                  {evolutionTarget && (
                    <Button
                      variant="secondary"
                      icon={Dna}
                      onClick={() =>
                        navigate(
                          `/evolution?track=${evolutionTarget.track}&node=${evolutionTarget.node}`
                        )
                      }
                    >
                      View Evolution Story
                    </Button>
                  )}
                </div>
              ) : (
                <p className="concept-detail__viz-note">
                  Interactive lab visualizers for <code>{vizType}</code> are scheduled in
                  upcoming Laboratory milestones.
                </p>
              )}
            </div>
          </VisualizationContainer>
        </div>

        {/* Side Relationships Column */}
        <aside className="concept-detail__aside">
          <Card hoverable={false} className="concept-detail__card">
            <div className="concept-detail__card-head">
              <GitBranch size={18} style={{ color: 'var(--accent-cyan)' }} />
              <h2>Prerequisites</h2>
            </div>
            {links.prerequisites.length > 0 ? (
              <div className="concept-detail__link-list">
                {links.prerequisites.map((item) => renderLinkChip(item))}
              </div>
            ) : (
              <p className="concept-detail__muted">
                No prerequisites — great starting point!
              </p>
            )}
          </Card>

          <Card hoverable={false} className="concept-detail__card">
            <div className="concept-detail__card-head">
              <Layers size={18} style={{ color: 'var(--accent-amber)' }} />
              <h2>Related Concepts</h2>
            </div>
            {links.relatedConcepts.length > 0 ? (
              <div className="concept-detail__link-list">
                {links.relatedConcepts.map((item) => renderLinkChip(item))}
              </div>
            ) : (
              <p className="concept-detail__muted">No related concepts linked.</p>
            )}
          </Card>

          <Card hoverable={false} className="concept-detail__card">
            <div className="concept-detail__card-head">
              <ArrowRight size={18} style={{ color: 'var(--accent-emerald)' }} />
              <h2>Next Concepts</h2>
            </div>
            {links.nextConcepts.length > 0 ? (
              <div className="concept-detail__link-list">
                {links.nextConcepts.map((item) => renderLinkChip(item, 'next'))}
              </div>
            ) : (
              <p className="concept-detail__muted">
                You have reached a frontier topic in this path.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
