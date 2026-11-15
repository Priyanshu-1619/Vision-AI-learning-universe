import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Sparkles, Activity, Cpu, ShieldCheck, Binary, ChevronRight } from 'lucide-react';
import Button from '../common/Button';
import './LandingHero.css';

const PHILOSOPHY_STEPS = [
  'UNDERSTAND',
  'VISUALIZE',
  'EXPERIMENT',
  'BREAK',
  'DEBUG',
  'CHALLENGE',
  'APPLY',
];

const FEATURE_INDICATORS = [
  { icon: Sparkles, label: 'Interactive Visualizations' },
  { icon: Binary, label: 'Real Mathematical Calculations' },
  { icon: Activity, label: 'Hands-on Experiments' },
  { icon: Cpu, label: 'Real-world ML Missions' },
  { icon: ShieldCheck, label: 'Personalized Learning Progress' },
];

export default function LandingHero() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Subtle interactive cosmic neural constellation background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate starry particles & constellation nodes
    const nodeCount = Math.min(45, Math.floor(width / 30));
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.2,
      color: Math.random() > 0.6 ? '#06b6d4' : Math.random() > 0.3 ? '#164bff' : '#facc15',
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(22, 75, 255, ${(1 - dist / 130) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw & update nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = node.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="landing-hero" aria-label="Introduction to AI Learning Universe">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="landing-hero__canvas" />

      {/* Planetary Atmosphere & Horizon Glow */}
      <div className="landing-hero__glow-orb" />
      <div className="landing-hero__horizon" />

      <div className="landing-hero__container">
        {/* Left Column: Headlines & CTAs */}
        <div className="landing-hero__content">
          <div className="landing-hero__badge-pill">
            <span className="landing-hero__badge-dot" />
            <span>Interactive Scientific Learning Environment</span>
          </div>

          <h1 className="landing-hero__headline">
            EXPLORE THE<br />
            <span className="landing-hero__headline--gradient">UNIVERSE OF</span><br />
            ARTIFICIAL INTELLIGENCE
          </h1>

          <p className="landing-hero__desc">
            Don&apos;t just learn AI. Understand how it works. Visualize algorithms, experiment with mathematical concepts, break models, debug failures, and build real-world intelligence.
          </p>

          {/* Learning Philosophy Sequential Pills */}
          <div className="landing-hero__philosophy" aria-label="Learning Philosophy Cycle">
            {PHILOSOPHY_STEPS.map((step, idx) => (
              <span key={step} className="landing-hero__philosophy-item">
                <span className="landing-hero__philosophy-text">{step}</span>
                {idx < PHILOSOPHY_STEPS.length - 1 && (
                  <ChevronRight size={13} className="landing-hero__philosophy-arrow" />
                )}
              </span>
            ))}
          </div>

          {/* CTA Cluster */}
          <div className="landing-hero__cta-group">
            <Button
              variant="primary"
              className="landing-hero__primary-btn"
              onClick={() => navigate('/dashboard')}
            >
              EXPLORE THE UNIVERSE
              <ArrowRight size={17} />
            </Button>

            <Button
              variant="secondary"
              className="landing-hero__secondary-btn"
              onClick={() => navigate('/dashboard')}
            >
              CONTINUE AS GUEST
              <Compass size={17} />
            </Button>
          </div>

          <p className="landing-hero__subline">
            Data Science • Machine Learning • Deep Learning
          </p>

          {/* Feature Indicator Badges */}
          <div className="landing-hero__indicators">
            {FEATURE_INDICATORS.map(({ icon: Icon, label }) => (
              <div key={label} className="landing-hero__indicator-item">
                <Icon size={14} className="landing-hero__indicator-icon" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Constellation & Visual Simulation Preview */}
        <div className="landing-hero__visual-side">
          <div className="hero-concept-card">
            <div className="hero-concept-card__header">
              <div className="hero-concept-card__status">
                <span className="hero-concept-card__pulse" />
                <span>COGNITIVE TOPOLOGY ACTIVE</span>
              </div>
              <span className="hero-concept-card__tag">316 NODES</span>
            </div>

            {/* Simulated Live Neural Topology */}
            <div className="hero-topology-preview">
              <div className="hero-topology-core">
                <div className="hero-node hero-node--root">AI</div>
                <div className="hero-line hero-line--1" />
                <div className="hero-line hero-line--2" />
                <div className="hero-line hero-line--3" />

                <div className="hero-node hero-node--ds" onClick={() => navigate('/data-science')}>DS</div>
                <div className="hero-node hero-node--ml" onClick={() => navigate('/machine-learning')}>ML</div>
                <div className="hero-node hero-node--dl" onClick={() => navigate('/deep-learning')}>DL</div>

                <div className="hero-orbit hero-orbit--outer" />
                <div className="hero-orbit hero-orbit--inner" />
              </div>

              {/* Real-time Math Formula Telemetry */}
              <div className="hero-telemetry-strip">
                <div className="hero-telemetry-col">
                  <span className="hero-telemetry-label">Loss Manifold</span>
                  <span className="hero-telemetry-val">MSE = 0.0142</span>
                </div>
                <div className="hero-telemetry-col">
                  <span className="hero-telemetry-label">Separation</span>
                  <span className="hero-telemetry-val">z = wᵀx + b</span>
                </div>
                <div className="hero-telemetry-col">
                  <span className="hero-telemetry-label">Optimizer</span>
                  <span className="hero-telemetry-val">∇θ + Momentum</span>
                </div>
              </div>
            </div>

            {/* Quick interactive peek button */}
            <div className="hero-concept-card__footer">
              <span className="hero-concept-card__note">Zero external AI APIs • 100% Local Scikit-learn</span>
              <button
                type="button"
                className="hero-concept-card__link"
                onClick={() => navigate('/concept-universe')}
              >
                Inspect Universe ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
