import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Edit3,
  Languages,
  Maximize2,
  Minimize2,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Layers,
  Map,
  FlaskConical,
  Clock,
  ChevronRight,
  Eye,
  Hammer,
} from 'lucide-react';
import { fetchConcept } from '../../api/client';
import { useConcepts } from '../../hooks/useConcepts';
import {
  markConceptExplored,
  resolveConceptLinks,
} from '../../concept-engine/ConceptEngine';
import {
  getTopicProgress,
  updateTopicStatus,
  STATUS_COMPLETED,
  STATUS_NOT_STARTED,
} from '../../services/roadmapProgressService';
import { getMathTopicForConcept } from '../mathematics/mathConfig';
import { getLabIdForConcept } from '../../utils/labEngine';
import { getInsideModelTabForConcept } from '../../utils/neuralEngine';
import {
  getBreakItScenarioForConcept,
  getWhatIfExpForConcept,
} from '../experiments/breakItConfig';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';
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

// Generates an intuitive Hinglish explanation for any concept
function getHinglishExplanation(concept) {
  const title = concept.title;
  const def = concept.definition || '';

  if (concept.id === 'linear-regression') {
    return 'Linear Regression ka basic matlab hai data points ke beech ek best-fit line draw karna. Is line ki madad se hum future values predict karte hain (jaise house size se price predict karna). Line ka formula hota hai y = mx + c.';
  }
  if (concept.id === 'kmeans-clustering') {
    return 'K-Means ek unsupervised algorithm hai jo data points ko k groups (clusters) me baant deta hai based on unki similarity. Ye centroids compute karta hai aur points ko unke nearest centroid se assign karta hai.';
  }
  if (concept.id === 'backpropagation') {
    return 'Backpropagation neural network ka sikhne ka tareeqa hai. Jab model galat prediction karta hai, to loss calculate hota hai aur chain rule se gradients peeche ki taraf bheje jaate hain taaki weights adjust ho sakein.';
  }
  if (concept.id === 'gradient-descent') {
    return 'Gradient Descent ek optimization algorithm hai jo loss ko minimize karta hai. Jaise andhere pahaad se neeche aana ho to dhalan (slope) dekh kar kadam badhate hain, waise hi weights ko update kiya jaata hai.';
  }

  return `${title} ka matlab aasaan shabdon me ye hai: ${def.slice(0, 160)}. Iska use models ko train karne, patterns samajhne aur accurate predictions lene ke liye kiya jaata hai.`;
}

// Generate code snippet for practical section
function getPythonCodeSnippet(concept) {
  const id = concept.id;
  if (id.includes('regression') || id === 'linear-regression') {
    return `# Linear Regression with scikit-learn
import numpy as np
from sklearn.linear_model import LinearRegression

# 1. Prepare sample features (X) and target (y)
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2.2, 3.9, 6.1, 7.8, 10.2])

# 2. Initialize and fit the Ordinary Least Squares model
model = LinearRegression()
model.fit(X, y)

# 3. Inspect parameters & predict
print("Slope (w):", model.coef_[0])
print("Intercept (b):", model.intercept_)
print("Prediction for x=6:", model.predict([[6]])[0])`;
  }

  if (id.includes('kmeans') || id.includes('clustering')) {
    return `# K-Means Clustering with scikit-learn
import numpy as np
from sklearn.cluster import KMeans

# 1. Sample 2D feature observations
X = np.array([[1, 2], [1.5, 1.8], [5, 8], [8, 8], [1, 0.6], [9, 11]])

# 2. Fit 2 clusters with k-means++ initialization
kmeans = KMeans(n_clusters=2, random_state=42, n_init='auto')
kmeans.fit(X)

# 3. View learned cluster centroids and labels
print("Cluster Centers:\\n", kmeans.cluster_centers_)
print("Assigned Labels:", kmeans.labels_)`;
  }

  if (id.includes('neural') || id.includes('perceptron') || id.includes('backprop')) {
    return `# Forward & Backward pass with NumPy
import numpy as np

# Single neuron: z = w*x + b, a = sigmoid(z)
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

x = np.array([1.5, 2.0])
w = np.array([0.4, -0.6])
b = 0.1

z = np.dot(x, w) + b
a = sigmoid(z)
print("Neuron Activation (a):", round(a, 4))`;
  }

  return `# Python Demonstration for ${concept.title}
import numpy as np
import pandas as pd

print("Concept: ${concept.title}")
print("Category: ${concept.category}")
# Ready to experiment in the interactive AI Laboratory`;
}

// Generate an interactive quiz question for the concept
function getConceptQuiz(concept) {
  const title = concept.title;
  return {
    question: `What is the primary objective of ${title} in practical machine learning?`,
    options: [
      `To systematically model patterns or relationships in data to make reliable predictions or groupings`,
      `To convert tabular data into completely unreadable encrypted strings`,
      `To eliminate the need for any mathematical formulation or training`,
      `To increase memory consumption without improving accuracy`,
    ],
    correctIndex: 0,
    explanation: `${title} is used to understand data distributions, extract meaningful representations, or minimize error on real-world tasks.`,
  };
}

export default function ConceptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { concepts, loading: listLoading } = useConcepts();

  const [fetchResult, setFetchResult] = useState({ id: null, data: null });
  const [useHinglish, setUseHinglish] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: 15px, 1: 16.5px, 2: 18.5px
  const [focusMode, setFocusMode] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('ailu_bookmarks') || '[]');
      return bookmarks.includes(id);
    } catch {
      return false;
    }
  });
  const [notesOpen, setNotesOpen] = useState(false);
  const [userNotes, setUserNotes] = useState(() => {
    try {
      return localStorage.getItem(`ailu_notes_${id}`) || '';
    } catch {
      return '';
    }
  });
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCompleted, setIsCompleted] = useState(() => {
    try {
      const prog = getTopicProgress('data-science', id);
      return prog.status === STATUS_COMPLETED;
    } catch {
      return false;
    }
  });

  // Quiz state
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

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

  // Reset / sync state during render when id changes (React recommended pattern)
  const [activeId, setActiveId] = useState(id);
  if (activeId !== id) {
    setActiveId(id);
    try {
      const bookmarks = JSON.parse(localStorage.getItem('ailu_bookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(id));
      setUserNotes(localStorage.getItem(`ailu_notes_${id}`) || '');
      const prog = getTopicProgress(concept?.domain || 'data-science', id);
      setIsCompleted(prog.status === STATUS_COMPLETED);
    } catch {}
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
  }

  useEffect(() => {
    if (id) {
      markConceptExplored(id);
    }
  }, [id]);

  const handleToggleBookmark = () => {
    if (!concept?.id) return;
    try {
      const bookmarks = JSON.parse(localStorage.getItem('ailu_bookmarks') || '[]');
      let updated;
      if (bookmarks.includes(concept.id)) {
        updated = bookmarks.filter((b) => b !== concept.id);
        setIsBookmarked(false);
      } else {
        updated = [...bookmarks, concept.id];
        setIsBookmarked(true);
      }
      localStorage.setItem('ailu_bookmarks', JSON.stringify(updated));
    } catch {}
  };

  const handleNotesChange = (text) => {
    setUserNotes(text);
    if (concept?.id) {
      try {
        localStorage.setItem(`ailu_notes_${concept.id}`, text);
      } catch {}
    }
  };

  const handleToggleComplete = () => {
    if (!concept?.id) return;
    const newStatus = isCompleted ? STATUS_NOT_STARTED : STATUS_COMPLETED;
    setIsCompleted(!isCompleted);
    updateTopicStatus(concept.domain || 'data-science', concept.id, newStatus, {
      estimatedMinutes: 20,
    });
  };

  const links = useMemo(
    () => resolveConceptLinks(concept, concepts),
    [concept, concepts]
  );

  const matchedVizTopic = useMemo(() => {
    if (!concept?.id) return null;
    const mapped = CONCEPT_TO_VIZ[concept.id] || concept.id;
    return getVisualizationConfig(mapped) ? mapped : null;
  }, [concept]);

  // Compute previous and next concepts in curriculum
  const { prevConcept, nextConcept } = useMemo(() => {
    if (!concept || concepts.length === 0) return { prevConcept: null, nextConcept: null };
    const idx = concepts.findIndex((c) => c.id === concept.id);
    return {
      prevConcept: idx > 0 ? concepts[idx - 1] : null,
      nextConcept: idx >= 0 && idx < concepts.length - 1 ? concepts[idx + 1] : null,
    };
  }, [concept, concepts]);

  if (detailLoading || (!concept && listLoading)) {
    return <Loading text="Loading lesson curriculum..." />;
  }

  if (!concept) {
    return (
      <div className="concept-detail fade-in">
        <Card className="concept-detail__not-found" hoverable={false}>
          <h2>Lesson Not Found</h2>
          <p>
            No curriculum topic matching <code>{id}</code> exists in the Concept Engine.
          </p>
          <div className="concept-detail__not-found-actions">
            <Button icon={Map} onClick={() => navigate('/roadmaps/data-science')}>
              Explore Roadmaps
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
  const primaryFormula = formulas[0] || 'y = f(x; θ)';
  const mathExplanation = concept.mathematics?.explanation || '';
  const accentColor = concept.color || 'var(--accent-primary)';
  const mathTopicId = getMathTopicForConcept(concept.id);
  const labId = getLabIdForConcept(concept.id);
  const insideModelTab = getInsideModelTabForConcept(concept.id);
  const evolutionTarget = getEvolutionTargetForConcept(concept.id);
  const breakItScenario = getBreakItScenarioForConcept(concept.id);
  const whatIfExp = getWhatIfExpForConcept(concept.id);
  const pythonCode = getPythonCodeSnippet(concept);
  const quiz = getConceptQuiz(concept);

  const copyToClipboard = (text, type) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'formula') {
        setCopiedFormula(true);
        setTimeout(() => setCopiedFormula(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  };

  const fontSizeClass =
    fontSizeLevel === 0 ? 'font-size-sm' : fontSizeLevel === 2 ? 'font-size-lg' : 'font-size-md';

  return (
    <div className={`lesson-page fade-in ${focusMode ? 'lesson-page--focus' : ''} ${fontSizeClass}`}>
      {/* 1. TOP BREADCRUMB & LESSON HEADER */}
      <header className="lesson-topbar">
        <div className="lesson-breadcrumbs">
          <Link to="/" className="lesson-breadcrumb-link">Dashboard</Link>
          <ChevronRight size={13} className="text-muted" />
          <Link to={`/${concept.domain || 'data-science'}`} className="lesson-breadcrumb-link">
            {concept.domain === 'deep-learning'
              ? 'Deep Learning'
              : concept.domain === 'machine-learning'
                ? 'Machine Learning'
                : 'Data Science'}
          </Link>
          <ChevronRight size={13} className="text-muted" />
          <span className="lesson-breadcrumb-current">{concept.category || 'Curriculum'}</span>
        </div>

        <div className="lesson-topbar__actions">
          {prevConcept && (
            <Button
              size="sm"
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => navigate(`/concept/${prevConcept.id}`)}
              title={`Previous: ${prevConcept.title}`}
            >
              Prev
            </Button>
          )}

          <Button
            size="sm"
            variant={isCompleted ? 'primary' : 'secondary'}
            icon={isCompleted ? CheckCircle2 : Circle}
            onClick={handleToggleComplete}
            style={isCompleted ? { background: 'var(--accent-primary)', color: '#0D0F12' } : {}}
          >
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </Button>

          {nextConcept && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/concept/${nextConcept.id}`)}
              title={`Next: ${nextConcept.title}`}
            >
              Next <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </Button>
          )}
        </div>
      </header>

      {/* LESSON TITLE & ESTIMATED TIME */}
      <section className="lesson-title-section">
        <div className="lesson-title-section__left">
          <div className="lesson-meta-badges">
            <span className="lesson-difficulty-pill" style={{ borderColor: accentColor, color: accentColor }}>
              {concept.difficulty || 'Intermediate'}
            </span>
            <span className="lesson-time-pill">
              <Clock size={13} />
              <span>{Math.max(5, Math.round((concept.definition?.length || 200) / 30))} min read</span>
            </span>
            <span className="lesson-domain-pill">{concept.category}</span>
          </div>
          <h1 className="lesson-main-title">{concept.title}</h1>
        </div>

        {/* Quick Launch Buttons */}
        <div className="lesson-quick-launches">
          {labId && (
            <Button
              size="sm"
              icon={FlaskConical}
              onClick={() => navigate(`/laboratory?lab=${labId}`)}
            >
              Laboratory
            </Button>
          )}
          {mathTopicId && (
            <Button
              size="sm"
              variant="secondary"
              icon={Calculator}
              onClick={() => navigate(`/mathematics?topic=${mathTopicId}`)}
            >
              Math Studio
            </Button>
          )}
          {insideModelTab && (
            <Button
              size="sm"
              variant="secondary"
              icon={Eye}
              onClick={() => navigate(`/inside-model?tab=${insideModelTab}`)}
            >
              Inside Model
            </Button>
          )}
          {breakItScenario && (
            <Button
              size="sm"
              variant="secondary"
              icon={Hammer}
              onClick={() => navigate(`/break-it?scenario=${breakItScenario}`)}
            >
              Break-It
            </Button>
          )}
          {whatIfExp && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/what-if?exp=${whatIfExp}`)}
            >
              What-If
            </Button>
          )}
          {evolutionTarget && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                navigate(
                  `/evolution?track=${evolutionTarget.track}&node=${evolutionTarget.node}`
                )
              }
            >
              Evolution
            </Button>
          )}
        </div>
      </section>

      {/* 2. IMPORTANT STUDY TOOLS BAR */}
      <section className="study-toolbar" aria-label="Student Study Tools">
        <div className="study-toolbar__group">
          <span className="study-toolbar__label">Text Size:</span>
          <button
            type="button"
            className={`tool-btn ${fontSizeLevel === 0 ? 'tool-btn--active' : ''}`}
            onClick={() => setFontSizeLevel(0)}
            title="Smaller Text (A-)"
          >
            A-
          </button>
          <button
            type="button"
            className={`tool-btn ${fontSizeLevel === 1 ? 'tool-btn--active' : ''}`}
            onClick={() => setFontSizeLevel(1)}
            title="Standard Text"
          >
            A
          </button>
          <button
            type="button"
            className={`tool-btn ${fontSizeLevel === 2 ? 'tool-btn--active' : ''}`}
            onClick={() => setFontSizeLevel(2)}
            title="Larger Text (A+)"
          >
            A+
          </button>
        </div>

        <div className="study-toolbar__divider" />

        <div className="study-toolbar__group">
          <button
            type="button"
            className={`tool-btn ${focusMode ? 'tool-btn--active' : ''}`}
            onClick={() => setFocusMode(!focusMode)}
            title="Reading Comfort (Toggle Focus Mode)"
          >
            {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{focusMode ? 'Standard Width' : 'Reading Focus'}</span>
          </button>

          <button
            type="button"
            className={`tool-btn ${useHinglish ? 'tool-btn--active' : ''}`}
            onClick={() => setUseHinglish(!useHinglish)}
            title="Toggle Hinglish Explanation"
          >
            <Languages size={14} />
            <span>Hinglish Explanation {useHinglish ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="study-toolbar__divider" />

        <div className="study-toolbar__group">
          <button
            type="button"
            className={`tool-btn ${isBookmarked ? 'tool-btn--active text-warm' : ''}`}
            onClick={handleToggleBookmark}
            title="Bookmark this Lesson"
          >
            {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          <button
            type="button"
            className={`tool-btn ${notesOpen ? 'tool-btn--active' : ''}`}
            onClick={() => setNotesOpen(!notesOpen)}
            title="Personal Study Notes"
          >
            <Edit3 size={14} />
            <span>Notes {userNotes ? '(Saved)' : ''}</span>
          </button>
        </div>
      </section>

      {/* Expandable Notes Drawer */}
      {notesOpen && (
        <Card className="lesson-notes-drawer" hoverable={false}>
          <div className="lesson-notes-drawer__head">
            <div className="lesson-notes-drawer__title">
              <Edit3 size={16} className="text-emerald" />
              <span>Personal Study Notes for {concept.title}</span>
            </div>
            <span className="lesson-notes-drawer__status">Auto-saved to your local study session</span>
          </div>
          <textarea
            className="lesson-notes-textarea"
            placeholder="Jot down personal intuition, questions, exam tips, or derivation reminders here..."
            value={userNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={4}
          />
        </Card>
      )}

      {/* 3. W3SCHOOLS-INSPIRED 14 STRUCTURED LEARNING SECTIONS */}
      <div className="lesson-sections-container">
        {/* SECTION 1: WHAT IS THIS CONCEPT? */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">01</span>
            <h2 className="lesson-section__title">What is {concept.title}?</h2>
          </div>
          <Card className="lesson-card lesson-card--highlight" hoverable={false}>
            <p className="lesson-lead-text">{concept.definition}</p>
            <div className="lesson-takeaway-box">
              <Lightbulb size={16} className="text-warm" />
              <span>
                <strong>Key Takeaway:</strong> {concept.title} serves as a foundational building block in{' '}
                {concept.category}, enabling models to generalize from observations rather than relying on hardcoded rules.
              </span>
            </div>
          </Card>
        </section>

        {/* SECTION 2: PLAIN ENGLISH / HINGLISH EXPLANATION */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">02</span>
            <h2 className="lesson-section__title">
              {useHinglish ? 'Aasaan Bhasha me Explanation (Hinglish)' : 'Plain English Explanation'}
            </h2>
          </div>
          <Card className="lesson-card" hoverable={false}>
            {useHinglish ? (
              <div className="hinglish-explanation-box">
                <span className="hinglish-badge">Hinglish View</span>
                <p>{getHinglishExplanation(concept)}</p>
              </div>
            ) : (
              <p className="lesson-body-text">
                {concept.beginnerExplanation ||
                  `Imagine looking at scattered data points on a sheet of paper. Instead of memorizing each coordinate by heart, ${concept.title} finds the underlying pattern or general rule that connects them. When you feed new, unseen data, it uses that established pattern to make a confident deduction.`}
              </p>
            )}
          </Card>
        </section>

        {/* SECTION 3: WHY DO WE NEED IT? */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">03</span>
            <h2 className="lesson-section__title">Why Do We Need It?</h2>
          </div>
          <Card className="lesson-card" hoverable={false}>
            <p className="lesson-body-text">
              Real-world systems generate noisy, high-dimensional observations that are impossible for human engineers to handcraft with <code>if/else</code> statements. We need {concept.title} because:
            </p>
            <ul className="lesson-bullet-list">
              <li>
                <strong>Scalability:</strong> It processes thousands of features and millions of rows automatically without manual rule rewriting.
              </li>
              <li>
                <strong>Robustness to Noise:</strong> Rather than breaking when encountering minor anomalies, it learns statistical tendencies.
              </li>
              <li>
                <strong>Mathematical Foundation:</strong> It provides formal convergence guarantees and error quantification metrics ($R^2$, MSE, Cross-Entropy).
              </li>
            </ul>
          </Card>
        </section>

        {/* SECTION 4: REAL-WORLD ANALOGY */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">04</span>
            <h2 className="lesson-section__title">Real-World Analogy</h2>
          </div>
          <Card className="lesson-card lesson-card--analogy" hoverable={false}>
            <div className="analogy-header">
              <span className="analogy-badge">Intuitive Metaphor</span>
            </div>
            <p className="lesson-body-text">
              {concept.example ||
                `Think of estimating the commute time to work based on the time you leave home. On rainy days, traffic delays increase proportionally. ${concept.title} is like noticing that each 10-minute delay in departure consistently adds 15 minutes of traffic, allowing you to estimate your arrival time with a simple mental equation.`}
            </p>
          </Card>
        </section>

        {/* SECTION 5: HOW DOES IT WORK? */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">05</span>
            <h2 className="lesson-section__title">How Does It Work?</h2>
          </div>
          <Card className="lesson-card" hoverable={false}>
            <div className="lesson-steps-grid">
              <div className="lesson-step-item">
                <span className="lesson-step-num">Step 1</span>
                <h4>Data Observation</h4>
                <p>Features are collected, normalized, and mapped onto a coordinate space or vector matrix.</p>
              </div>
              <div className="lesson-step-item">
                <span className="lesson-step-num">Step 2</span>
                <h4>Hypothesis Function</h4>
                <p>A parameterized mathematical function ($y = f(x; \theta)$) computes initial trial predictions.</p>
              </div>
              <div className="lesson-step-item">
                <span className="lesson-step-num">Step 3</span>
                <h4>Loss Evaluation</h4>
                <p>The difference between observed reality and prediction is quantified using an objective loss function.</p>
              </div>
              <div className="lesson-step-item">
                <span className="lesson-step-num">Step 4</span>
                <h4>Parameter Update</h4>
                <p>Parameters are iteratively refined (e.g. via gradients or closed-form OLS) to minimize error.</p>
              </div>
            </div>
          </Card>
        </section>

        {/* SECTION 6: MATHEMATICAL EXPLANATION */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">06</span>
            <h2 className="lesson-section__title">Mathematical Formulation</h2>
          </div>
          <Card className="lesson-card" hoverable={false}>
            <p className="lesson-body-text">
              {mathExplanation ||
                `The mathematical foundation of ${concept.title} relies on linear algebra, differential calculus, and probability. We model the target response as a function of our feature vector, balancing parameter weights to reduce residual deviation across the dataset.`}
            </p>
          </Card>
        </section>

        {/* SECTION 7: FORMULAS AND VARIABLE DEFINITIONS */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">07</span>
            <h2 className="lesson-section__title">Formulas &amp; Variable Definitions</h2>
          </div>
          <Card className="lesson-card" hoverable={false}>
            <div className="formula-box">
              <div className="formula-box__head">
                <span className="formula-box__label">Primary Governing Equation</span>
                <button
                  type="button"
                  className="formula-copy-btn"
                  onClick={() => copyToClipboard(primaryFormula, 'formula')}
                  title="Copy Formula to Clipboard"
                >
                  {copiedFormula ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  <span>{copiedFormula ? 'Copied' : 'Copy Formula'}</span>
                </button>
              </div>
              <pre className="formula-box__display">
                <code>{primaryFormula}</code>
              </pre>
            </div>

            {formulas.length > 1 && (
              <div className="sub-formulas-list">
                <span className="sub-formulas-title">Additional Associated Formulations:</span>
                {formulas.slice(1).map((f, idx) => (
                  <pre key={idx} className="sub-formula-item">
                    <code>{f}</code>
                  </pre>
                ))}
              </div>
            )}

            {/* Variable Definition Table */}
            <div className="variable-table-wrap">
              <span className="variable-table-title">Variable Symbol Reference:</span>
              <table className="variable-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Mathematical Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>y</code> / <code>ŷ</code></td>
                    <td>Target / Prediction</td>
                    <td>Actual observation versus predicted scalar output</td>
                  </tr>
                  <tr>
                    <td><code>x</code> / <code>X</code></td>
                    <td>Feature Vector / Design Matrix</td>
                    <td>Input observations with $N$ samples and $D$ dimensions</td>
                  </tr>
                  <tr>
                    <td><code>w</code> / <code>θ</code></td>
                    <td>Weights / Parameters</td>
                    <td>Learnable coefficients updated during training</td>
                  </tr>
                  <tr>
                    <td><code>b</code></td>
                    <td>Bias / Intercept</td>
                    <td>Offset allowing the model to shift away from origin</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* SECTION 8: VISUAL EXPLANATION */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">08</span>
            <h2 className="lesson-section__title">Visual Explanation &amp; Graph Geometry</h2>
          </div>
          <Card className="lesson-card" hoverable={false}>
            <div className="visual-guide-grid">
              <div className="visual-guide-card">
                <span className="visual-guide-card__kicker">Horizontal X-Axis</span>
                <h4>Input Space (Features)</h4>
                <p>Represents independent variables (e.g. square footage, epoch iterations, petal length).</p>
              </div>
              <div className="visual-guide-card">
                <span className="visual-guide-card__kicker">Vertical Y-Axis</span>
                <h4>Output Space (Response)</h4>
                <p>Represents continuous target values, class probabilities, or objective loss.</p>
              </div>
              <div className="visual-guide-card">
                <span className="visual-guide-card__kicker">Surface &amp; Boundaries</span>
                <h4>Model Decision Surface</h4>
                <p>The dividing hyper-plane or fitted manifold separating classes or fitting data trajectory.</p>
              </div>
              <div className="visual-guide-card">
                <span className="visual-guide-card__kicker">Residuals</span>
                <h4>Error Deviations</h4>
                <p>Vertical distance between scatter point observations and the fitted surface.</p>
              </div>
            </div>
          </Card>
        </section>

        {/* SECTION 9: INTERACTIVE EXAMPLE / GRAPH */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">09</span>
            <h2 className="lesson-section__title">Live Interactive Proving Ground</h2>
          </div>
          {matchedVizTopic ? (
            <div className="lesson-viz-container">
              <VisualizationEngine topicId={matchedVizTopic} />
            </div>
          ) : (
            <Card className="lesson-card lesson-card--empty-viz" hoverable={false}>
              <Sparkles size={24} className="text-emerald" />
              <p>
                Interactive parameter simulation for {concept.title} is available inside our specialized laboratory modules.
              </p>
              {labId && (
                <Button icon={FlaskConical} onClick={() => navigate(`/laboratory?lab=${labId}`)}>
                  Launch in AI Laboratory
                </Button>
              )}
            </Card>
          )}
        </section>

        {/* SECTION 10: CODE IMPLEMENTATION */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">10</span>
            <h2 className="lesson-section__title">Practical Python Implementation</h2>
          </div>
          <Card className="lesson-card" hoverable={false}>
            <div className="code-block-header">
              <span className="code-block-lang">Python 3 (NumPy / Scikit-Learn)</span>
              <button
                type="button"
                className="formula-copy-btn"
                onClick={() => copyToClipboard(pythonCode, 'code')}
                title="Copy Python Code"
              >
                {copiedCode ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied Code' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="code-block-pre">
              <code>{pythonCode}</code>
            </pre>
          </Card>
        </section>

        {/* SECTION 11: COMMON MISTAKES & PITFALLS */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">11</span>
            <h2 className="lesson-section__title">Common Mistakes &amp; Pitfalls</h2>
          </div>
          <Card className="lesson-card lesson-card--warning" hoverable={false}>
            <div className="warning-box">
              <AlertTriangle size={18} className="text-danger warning-icon" />
              <div className="warning-content">
                <h4>Frequent Student &amp; Practitioner Traps</h4>
                <ul className="warning-list">
                  <li>
                    <strong>Neglecting Feature Scaling:</strong> Gradient-based optimization and distance metrics (KNN, K-Means) fail or skew when features have wildly different units (e.g. Age: 0–100 vs Income: 0–1,000,000).
                  </li>
                  <li>
                    <strong>Data Leakage:</strong> Normalizing or imputing using the entire dataset before splitting train/test sets, giving your model false foresight.
                  </li>
                  <li>
                    <strong>Confusing Correlation with Causation:</strong> Observing a high $R^2$ fit does not mean changes in feature $X$ physically cause changes in target $Y$.
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* SECTION 12: PRACTICAL APPLICATIONS */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">12</span>
            <h2 className="lesson-section__title">Practical Industry Applications</h2>
          </div>
          <Card className="lesson-card" hoverable={false}>
            <div className="apps-grid">
              <div className="app-card">
                <span className="app-card__badge">Finance &amp; Risk</span>
                <h4>Credit Scoring &amp; Forecasting</h4>
                <p>Estimating default risk probabilities, insurance premiums, and algorithmic portfolio balancing.</p>
              </div>
              <div className="app-card">
                <span className="app-card__badge">Healthcare</span>
                <h4>Biomarker &amp; Diagnostic Models</h4>
                <p>Classifying medical imaging features and predicting patient recovery trajectories.</p>
              </div>
              <div className="app-card">
                <span className="app-card__badge">E-Commerce</span>
                <h4>Personalized Recommendations</h4>
                <p>Clustering customer cohorts based on browsing similarity and projecting inventory demand.</p>
              </div>
            </div>
          </Card>
        </section>

        {/* SECTION 13: RELATED CONCEPTS & PREREQUISITES */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">13</span>
            <h2 className="lesson-section__title">Related Concepts &amp; Prerequisites</h2>
          </div>
          <div className="related-concepts-grid">
            {/* Prerequisites */}
            <Card className="lesson-card" hoverable={false}>
              <div className="related-group-title">
                <Layers size={16} className="text-blue" />
                <span>Prerequisites (Recommended Foundations)</span>
              </div>
              {links.prerequisites.length > 0 ? (
                <div className="related-chips-row">
                  {links.prerequisites.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="related-chip-btn"
                      onClick={() => navigate(`/concept/${p.id}`)}
                    >
                      <span>{p.title}</span>
                      <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="lesson-muted-text">Foundational topic with zero prerequisite requirements.</p>
              )}
            </Card>

            {/* Next Concepts */}
            <Card className="lesson-card" hoverable={false}>
              <div className="related-group-title">
                <ArrowRight size={16} className="text-emerald" />
                <span>Next Logical Concepts in Curriculum</span>
              </div>
              {links.nextConcepts.length > 0 ? (
                <div className="related-chips-row">
                  {links.nextConcepts.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="related-chip-btn"
                      onClick={() => navigate(`/concept/${n.id}`)}
                    >
                      <span>{n.title}</span>
                      <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="lesson-muted-text">Frontier topic in this specialized curriculum track.</p>
              )}
            </Card>
          </div>
        </section>

        {/* SECTION 14: CHECK YOUR UNDERSTANDING QUIZ */}
        <section className="lesson-section">
          <div className="lesson-section__head">
            <span className="lesson-section__num">14</span>
            <h2 className="lesson-section__title">Check Your Understanding</h2>
          </div>
          <Card className="quiz-card" hoverable={false}>
            <div className="quiz-card__header">
              <HelpCircle size={20} className="text-warm" />
              <div>
                <h3 className="quiz-card__title">Interactive Comprehension Check</h3>
                <span className="quiz-card__sub">Test your grasp of this topic before moving to the next lesson</span>
              </div>
            </div>

            <p className="quiz-card__question">{quiz.question}</p>

            <div className="quiz-card__options">
              {quiz.options.map((option, idx) => {
                const isSelected = selectedQuizOption === idx;
                let optionClass = 'quiz-option';
                if (isSelected) optionClass += ' quiz-option--selected';
                if (quizSubmitted) {
                  if (idx === quiz.correctIndex) {
                    optionClass += ' quiz-option--correct';
                  } else if (isSelected && idx !== quiz.correctIndex) {
                    optionClass += ' quiz-option--wrong';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={optionClass}
                    onClick={() => {
                      if (!quizSubmitted) setSelectedQuizOption(idx);
                    }}
                    disabled={quizSubmitted}
                  >
                    <span className="quiz-option__letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="quiz-option__text">{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="quiz-card__footer">
              {!quizSubmitted ? (
                <Button
                  disabled={selectedQuizOption === null}
                  onClick={() => setQuizSubmitted(true)}
                >
                  Submit Answer
                </Button>
              ) : (
                <div className="quiz-feedback-box">
                  {selectedQuizOption === quiz.correctIndex ? (
                    <div className="quiz-feedback quiz-feedback--correct">
                      <CheckCircle2 size={18} />
                      <div>
                        <strong>Correct! Outstanding job.</strong>
                        <p>{quiz.explanation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="quiz-feedback quiz-feedback--wrong">
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Incorrect. Review the correct option above.</strong>
                        <p>{quiz.explanation}</p>
                      </div>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setQuizSubmitted(false);
                      setSelectedQuizOption(null);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>

      {/* FOOTER NAVIGATION */}
      <footer className="lesson-footer-nav">
        {prevConcept ? (
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate(`/concept/${prevConcept.id}`)}
          >
            Previous: {prevConcept.title}
          </Button>
        ) : (
          <div />
        )}

        <Button
          onClick={handleToggleComplete}
          style={isCompleted ? { background: 'var(--accent-primary)', color: '#0D0F12' } : {}}
        >
          {isCompleted ? '✓ Completed Lesson' : 'Mark Lesson as Complete'}
        </Button>

        {nextConcept ? (
          <Button
            icon={ArrowRight}
            onClick={() => navigate(`/concept/${nextConcept.id}`)}
          >
            Next: {nextConcept.title}
          </Button>
        ) : (
          <Button
            variant="secondary"
            icon={Map}
            onClick={() => navigate(`/roadmaps/${concept.domain || 'data-science'}`)}
          >
            Back to Roadmap
          </Button>
        )}
      </footer>
    </div>
  );
}
