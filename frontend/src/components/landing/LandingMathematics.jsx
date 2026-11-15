import { useNavigate } from 'react-router-dom';
import { Binary, Compass, ArrowRight, Sigma, FunctionSquare, LineChart } from 'lucide-react';
import Button from '../common/Button';
import './LandingMathematics.css';

const MATH_BRANCHES = [
  {
    title: 'Linear Algebra',
    icon: Binary,
    formula: 'A · v = λ · v',
    desc: 'Matrix transformations, dot products, vector spaces, eigenvalues, and SVD subspace decomposition.',
    accent: '#06b6d4',
  },
  {
    title: 'Differential Calculus',
    icon: FunctionSquare,
    formula: '∂L/∂w = (∂L/∂y) · (∂y/∂z) · (∂z/∂w)',
    desc: 'Partial derivatives, chain rule gradient backpropagation, Jacobians, and Hessians.',
    accent: '#164bff',
  },
  {
    title: 'Probability & Bayes',
    icon: Sigma,
    formula: 'P(A|B) = [P(B|A) · P(A)] / P(B)',
    desc: 'Bayesian inference, Gaussian density distributions, maximum likelihood estimation, and entropy.',
    accent: '#facc15',
  },
  {
    title: 'Optimization Theory',
    icon: LineChart,
    formula: 'θ_{t+1} = θ_t - α · ∇f(θ_t) + β · v_t',
    desc: 'Loss surfaces, gradient descent with momentum, convexity, saddle points, and convergence criteria.',
    accent: '#10b981',
  },
];

export default function LandingMathematics() {
  const navigate = useNavigate();

  return (
    <section className="landing-math" id="mathematics" aria-label="Mathematics of AI">
      <div className="landing-math__container">
        <div className="landing-section-header">
          <span className="landing-section-kicker">RIGOROUS FOUNDATIONS</span>
          <h2 className="landing-section-title">
            UNDERSTAND THE MATHEMATICS. UNLOCK THE INTELLIGENCE.
          </h2>
          <p className="landing-section-desc">
            Every algorithm has mathematics behind it. Learn what each formula means, why it is used, and how it affects model behavior.
          </p>
        </div>

        {/* 4 Math Branches Cards */}
        <div className="landing-math__grid">
          {MATH_BRANCHES.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="math-card" style={{ '--math-accent': b.accent }}>
                <div className="math-card__head">
                  <div className="math-card__icon-box">
                    <Icon size={22} color={b.accent} />
                  </div>
                  <span className="math-card__name">{b.title}</span>
                </div>

                <div className="math-card__formula-box">
                  <code>{b.formula}</code>
                </div>

                <p className="math-card__desc">{b.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Interactive Mathematics Lab Callout */}
        <div className="landing-math__banner">
          <div className="landing-math__banner-left">
            <div className="landing-math__badge">
              <Compass size={16} color="#facc15" />
              <span>INTERACTIVE LIBRARY GRAPH & EQUATION ENGINE</span>
            </div>
            <h3 className="landing-math__banner-title">
              Plot custom mathematical equations with safe AST evaluation
            </h3>
            <p className="landing-math__banner-desc">
              Enter custom functions $f(x)$, test activation curves (Sigmoid, Tanh, ReLU, GELU), inspect derivatives, and read contextual graph notes in English and natural Hinglish.
            </p>
          </div>

          <div className="landing-math__banner-actions">
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => navigate('/library-graph')}
              className="landing-math__primary-btn"
            >
              OPEN LIBRARY GRAPH
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/mathematics')}
              className="landing-math__secondary-btn"
            >
              Curriculum Roadmap
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
