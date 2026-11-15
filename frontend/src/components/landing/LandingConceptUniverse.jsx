import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, Search, ArrowRight, Share2, Compass, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import './LandingConceptUniverse.css';

const UNIVERSE_FEATURES = [
  { icon: Search, title: 'Instant Semantic Search', desc: 'Query 316 nodes with real-time substring and category filters' },
  { icon: Share2, title: 'Prerequisite Graphs', desc: 'Trace mathematical and foundational dependencies before tackling advanced models' },
  { icon: Compass, title: 'Spaceship Probe Cursor', desc: 'Navigate the cosmic constellation with physics-driven plasma guidance' },
  { icon: CheckCircle, title: 'Persistent Progress Aura', desc: 'Completed topics radiate glowing halos reflecting your mastery' },
];

export default function LandingConceptUniverse() {
  const navigate = useNavigate();
  const [activeBranch, setActiveBranch] = useState('ml');

  return (
    <section className="landing-universe" id="universe" aria-label="Concept Universe">
      <div className="landing-universe__container">
        <div className="landing-section-header">
          <span className="landing-section-kicker">316-NODE TOPOLOGY</span>
          <h2 className="landing-section-title">
            EXPLORE THE CONNECTED UNIVERSE OF AI KNOWLEDGE
          </h2>
          <p className="landing-section-desc">
            No concept exists in isolation. See how Linear Algebra feeds Optimization, how Gradient Descent trains Neural Networks, and how Attention gives rise to Transformers.
          </p>
        </div>

        {/* Constellation Preview Stage */}
        <div className="universe-preview-card">
          <div className="universe-preview-card__head">
            <div className="universe-preview-card__tag">
              <Globe2 size={16} color="#06b6d4" />
              <span>COSMIC TOPOLOGY EXPLORER</span>
            </div>
            {/* Branch Switcher */}
            <div className="universe-branch-toggle">
              <button
                type="button"
                className={`branch-btn ${activeBranch === 'ml' ? 'branch-btn--active' : ''}`}
                onClick={() => setActiveBranch('ml')}
              >
                ML Optimization Branch
              </button>
              <button
                type="button"
                className={`branch-btn ${activeBranch === 'dl' ? 'branch-btn--active' : ''}`}
                onClick={() => setActiveBranch('dl')}
              >
                DL Architecture Branch
              </button>
            </div>
          </div>

          {/* Interactive Topology Visualizer */}
          <div className="universe-stage-canvas">
            <svg viewBox="0 0 600 240" className="universe-svg">
              {/* Radial glow */}
              <circle cx="300" cy="120" r="140" fill="radial-gradient(circle, rgba(22,75,255,0.15) 0%, transparent 70%)" />

              {/* Connecting Edges */}
              <line x1="80" y1="120" x2="200" y2={activeBranch === 'ml' ? 80 : 160} stroke="#164bff" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="200" y1={activeBranch === 'ml' ? 80 : 160} x2="350" y2={activeBranch === 'ml' ? 80 : 160} stroke="#06b6d4" strokeWidth="2" />
              <line x1="350" y1={activeBranch === 'ml' ? 80 : 160} x2="500" y2={activeBranch === 'ml' ? 60 : 140} stroke="#facc15" strokeWidth="2" />
              <line x1="350" y1={activeBranch === 'ml' ? 80 : 160} x2="500" y2={activeBranch === 'ml' ? 110 : 190} stroke="#a855f7" strokeWidth="2" />

              {/* Node 1: AI Root */}
              <g className="universe-node-g" onClick={() => navigate('/concept-universe')}>
                <circle cx="80" cy="120" r="28" fill="#164bff" stroke="#38bdf8" strokeWidth="2.5" />
                <text x="80" y="124" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">AI Root</text>
              </g>

              {/* Node 2: Domain */}
              <g className="universe-node-g" onClick={() => navigate(activeBranch === 'ml' ? '/machine-learning' : '/deep-learning')}>
                <circle cx="200" cy={activeBranch === 'ml' ? 80 : 160} r="26" fill="#0b1633" stroke="#06b6d4" strokeWidth="2" />
                <text x="200" y={activeBranch === 'ml' ? 84 : 164} fill="#06b6d4" fontSize="11" fontWeight="bold" textAnchor="middle">
                  {activeBranch === 'ml' ? 'Machine Learning' : 'Deep Learning'}
                </text>
              </g>

              {/* Node 3: Pillar */}
              <g className="universe-node-g">
                <circle cx="350" cy={activeBranch === 'ml' ? 80 : 160} r="25" fill="#0b1633" stroke="#38bdf8" strokeWidth="2" />
                <text x="350" y={activeBranch === 'ml' ? 84 : 164} fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
                  {activeBranch === 'ml' ? 'Optimization' : 'Neural Networks'}
                </text>
              </g>

              {/* Leaf Nodes */}
              {activeBranch === 'ml' ? (
                <>
                  <g className="universe-node-g" onClick={() => navigate('/concept/gradient-descent')}>
                    <circle cx="500" cy="60" r="22" fill="rgba(250,204,21,0.2)" stroke="#facc15" strokeWidth="2" />
                    <text x="500" y="64" fill="#facc15" fontSize="10" fontWeight="bold" textAnchor="middle">Grad Descent</text>
                  </g>
                  <g className="universe-node-g" onClick={() => navigate('/concept/linear-regression')}>
                    <circle cx="500" cy="110" r="22" fill="rgba(168,85,247,0.2)" stroke="#c084fc" strokeWidth="2" />
                    <text x="500" y="114" fill="#c084fc" fontSize="10" fontWeight="bold" textAnchor="middle">Cost Functions</text>
                  </g>
                </>
              ) : (
                <>
                  <g className="universe-node-g" onClick={() => navigate('/concept/convolutional-neural-networks')}>
                    <circle cx="500" cy="140" r="22" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="2" />
                    <text x="500" y="144" fill="#06b6d4" fontSize="10" fontWeight="bold" textAnchor="middle">CNNs</text>
                  </g>
                  <g className="universe-node-g" onClick={() => navigate('/concept/transformers')}>
                    <circle cx="500" cy="190" r="22" fill="rgba(250,204,21,0.2)" stroke="#facc15" strokeWidth="2" />
                    <text x="500" y="194" fill="#facc15" fontSize="10" fontWeight="bold" textAnchor="middle">Transformers</text>
                  </g>
                </>
              )}
            </svg>
          </div>

          {/* Feature Grid Below Canvas */}
          <div className="universe-features-grid">
            {UNIVERSE_FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="universe-feature-col">
                  <div className="universe-feature-icon">
                    <Icon size={18} color="#06b6d4" />
                  </div>
                  <div>
                    <h4 className="universe-feature-title">{item.title}</h4>
                    <p className="universe-feature-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="universe-preview-card__foot">
            <span className="universe-foot-stat">
              682 Directed Edge Synapses • 8 Cosmic Clusters
            </span>
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => navigate('/concept-universe')}
              className="universe-cta-btn"
            >
              ENTER CONCEPT UNIVERSE
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
