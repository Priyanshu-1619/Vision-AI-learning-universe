import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  Sliders,
  GitCommit,
  Grid3X3,
  Flame,
  ArrowRight,
  BookOpen,
  Code2,
} from 'lucide-react';
import Button from '../common/Button';
import './LandingVisualEngine.css';

const TABS = [
  { id: 'linear', label: 'Linear Regression', icon: TrendingUp },
  { id: 'kmeans', label: 'K-Means Clustering', icon: Target },
  { id: 'gradient', label: 'Gradient Descent', icon: Sliders },
  { id: 'backprop', label: 'Backpropagation', icon: GitCommit },
  { id: 'cnn', label: 'CNN Feature Map', icon: Grid3X3 },
  { id: 'attention', label: 'Self-Attention', icon: Flame },
];

const ENGINE_FEATURES = [
  'Interactive Graphs',
  'Custom Equations',
  'Parameter Sliders',
  'Step-by-Step Animations',
  'Mathematical Explanations',
  'Graph Notes in Hinglish & English',
];

export default function LandingVisualEngine() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('linear');

  // Interactive state for Tab 1: Linear Regression
  const [slope, setSlope] = useState(0.85);
  const [intercept, setIntercept] = useState(0.2);

  // Tab 2: K-Means
  const [kClusters, setKClusters] = useState(3);

  // Tab 3: Gradient Descent
  const [gdStep, setGdStep] = useState(3);
  const [gdLr, setGdLr] = useState(0.15);

  // Tab 4: Backpropagation Stepper
  const [backpropStage, setBackpropStage] = useState(1);

  // Tab 5: CNN Kernel
  const [cnnKernel, setCnnKernel] = useState('sobel_x');

  // Tab 6: Attention Active Word
  const [selectedWord, setSelectedWord] = useState('it');

  // Linear Regression synthetic points
  const points = useMemo(
    () => [
      { x: -2, y: -1.5 },
      { x: -1.2, y: -0.9 },
      { x: -0.5, y: -0.1 },
      { x: 0.2, y: 0.3 },
      { x: 1.0, y: 1.1 },
      { x: 1.8, y: 1.7 },
      { x: 2.3, y: 2.1 },
    ],
    []
  );

  const mse = useMemo(() => {
    let sum = 0;
    for (const p of points) {
      const pred = slope * p.x + intercept;
      sum += (p.y - pred) ** 2;
    }
    return (sum / points.length).toFixed(3);
  }, [slope, intercept, points]);

  return (
    <section className="landing-visual" id="visualization" aria-label="Visual Learning Engine">
      <div className="landing-visual__container">
        <div className="landing-section-header">
          <span className="landing-section-kicker">PROPRIETARY VISUAL ENGINE</span>
          <h2 className="landing-section-title">
            DON&apos;T JUST READ THE ALGORITHM. SEE IT WORK.
          </h2>
          <p className="landing-section-desc">
            Interact with live mathematical graphs and algorithm experiments powered by local scikit-learn and NumPy computation.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="landing-visual__feature-pills">
          {ENGINE_FEATURES.map((feat) => (
            <span key={feat} className="landing-visual__pill">
              <Code2 size={13} color="#06b6d4" />
              {feat}
            </span>
          ))}
        </div>

        {/* Studio Preview Frame */}
        <div className="visual-studio">
          {/* Studio Navigation Tabs */}
          <div className="visual-studio__tabs" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`visual-studio__tab ${isActive ? 'visual-studio__tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Stage Body */}
          <div className="visual-studio__stage">
            {/* 1. LINEAR REGRESSION */}
            {activeTab === 'linear' && (
              <div className="visual-stage-grid">
                <div className="visual-stage-controls">
                  <h4 className="visual-controls-title">OLS Parameter Sliders</h4>
                  <p className="visual-controls-desc">
                    Adjust slope $m$ and bias $b$ to align the linear hyperplane with training points and minimize Mean Squared Error.
                  </p>

                  <div className="visual-slider-group">
                    <div className="visual-slider-head">
                      <label>Slope (m)</label>
                      <span className="visual-slider-val">{slope.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.5"
                      max="2.0"
                      step="0.05"
                      value={slope}
                      onChange={(e) => setSlope(parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="visual-slider-group">
                    <div className="visual-slider-head">
                      <label>Intercept (b)</label>
                      <span className="visual-slider-val">{intercept.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
                      step="0.05"
                      value={intercept}
                      onChange={(e) => setIntercept(parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="visual-metric-box">
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Residual MSE</span>
                      <span className="visual-metric-val" style={{ color: mse < 0.1 ? '#10b981' : '#facc15' }}>
                        {mse}
                      </span>
                    </div>
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Equation</span>
                      <span className="visual-metric-val">ŷ = {slope}x + {intercept}</span>
                    </div>
                  </div>
                </div>

                {/* SVG Visualizer */}
                <div className="visual-stage-display">
                  <svg viewBox="-60 -60 120 120" className="visual-svg-canvas">
                    {/* Grid */}
                    <line x1="-50" y1="0" x2="50" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                    <line x1="0" y1="-50" x2="0" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

                    {/* Residual Lines */}
                    {points.map((p, idx) => {
                      const px = p.x * 18;
                      const py = -p.y * 18;
                      const predY = -(slope * p.x + intercept) * 18;
                      return (
                        <line
                          key={idx}
                          x1={px}
                          y1={py}
                          x2={px}
                          y2={predY}
                          stroke="rgba(239, 68, 68, 0.6)"
                          strokeWidth="1.2"
                          strokeDasharray="2,2"
                        />
                      );
                    })}

                    {/* Regression Line */}
                    <line
                      x1="-45"
                      y1={-(slope * (-2.5) + intercept) * 18}
                      x2="45"
                      y2={-(slope * (2.5) + intercept) * 18}
                      stroke="#facc15"
                      strokeWidth="2.5"
                    />

                    {/* Scatter Points */}
                    {points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x * 18}
                        cy={-p.y * 18}
                        r="3.5"
                        fill="#06b6d4"
                        stroke="#050814"
                        strokeWidth="1"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            )}

            {/* 2. K-MEANS CLUSTERING */}
            {activeTab === 'kmeans' && (
              <div className="visual-stage-grid">
                <div className="visual-stage-controls">
                  <h4 className="visual-controls-title">K-Means Centroid Tuning</h4>
                  <p className="visual-controls-desc">
                    Partition 2-D coordinates into $K$ Voronoi regions and observe centroid updates that minimize Within-Cluster Sum of Squares.
                  </p>

                  <div className="visual-btn-group">
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Number of Clusters (K):</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[2, 3, 4].map((k) => (
                        <button
                          key={k}
                          type="button"
                          className={`visual-toggle-btn ${kClusters === k ? 'visual-toggle-btn--active' : ''}`}
                          onClick={() => setKClusters(k)}
                        >
                          K = {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="visual-metric-box">
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Convergence</span>
                      <span className="visual-metric-val" style={{ color: '#10b981' }}>Δμ &lt; 10⁻⁴ (4 iter)</span>
                    </div>
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Inertia (WCSS)</span>
                      <span className="visual-metric-val">{(120 / kClusters).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="visual-stage-display">
                  <svg viewBox="-60 -60 120 120" className="visual-svg-canvas">
                    {/* Cluster Blobs */}
                    {/* Cluster 1 */}
                    <circle cx="-25" cy="-20" r="18" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeDasharray="3,3" />
                    <circle cx="-25" cy="-20" r="4.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                    {/* Cluster 2 */}
                    <circle cx="25" cy="20" r="18" fill="rgba(22, 75, 255, 0.15)" stroke="#164bff" strokeDasharray="3,3" />
                    <circle cx="25" cy="20" r="4.5" fill="#164bff" stroke="#ffffff" strokeWidth="1.5" />
                    {/* Cluster 3 (if K >= 3) */}
                    {kClusters >= 3 && (
                      <>
                        <circle cx="15" cy="-25" r="16" fill="rgba(250, 204, 21, 0.15)" stroke="#facc15" strokeDasharray="3,3" />
                        <circle cx="15" cy="-25" r="4.5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
                      </>
                    )}
                    {/* Cluster 4 (if K === 4) */}
                    {kClusters === 4 && (
                      <>
                        <circle cx="-20" cy="25" r="16" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" strokeDasharray="3,3" />
                        <circle cx="-20" cy="25" r="4.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                      </>
                    )}
                  </svg>
                </div>
              </div>
            )}

            {/* 3. GRADIENT DESCENT */}
            {activeTab === 'gradient' && (
              <div className="visual-stage-grid">
                <div className="visual-stage-controls">
                  <h4 className="visual-controls-title">Descent Surface & Momentum</h4>
                  <p className="visual-controls-desc">
                    Watch parameters iterate across a 2D convex loss bowl $f(\theta) = \theta^2$. Adjust learning rate to observe smooth convergence vs oscillation.
                  </p>

                  <div className="visual-slider-group">
                    <div className="visual-slider-head">
                      <label>Learning Rate (α)</label>
                      <span className="visual-slider-val">{gdLr.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.45"
                      step="0.05"
                      value={gdLr}
                      onChange={(e) => setGdLr(parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="visual-slider-group">
                    <div className="visual-slider-head">
                      <label>Step Counter (t)</label>
                      <span className="visual-slider-val">{gdStep} / 6</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      step="1"
                      value={gdStep}
                      onChange={(e) => setGdStep(parseInt(e.target.value, 10))}
                    />
                  </div>

                  <div className="visual-metric-box">
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Loss f(θ)</span>
                      <span className="visual-metric-val" style={{ color: '#10b981' }}>
                        {((4 * (1 - gdLr) ** (gdStep - 1)) ** 2).toFixed(4)}
                      </span>
                    </div>
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Gradient ∇f</span>
                      <span className="visual-metric-val">
                        {(2 * (4 * (1 - gdLr) ** (gdStep - 1))).toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="visual-stage-display">
                  <svg viewBox="-50 -10 100 80" className="visual-svg-canvas">
                    {/* Parabola */}
                    <path
                      d="M -40 60 Q 0 -5 40 60"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    {/* Current point */}
                    {(() => {
                      const curX = 35 * (1 - gdLr) ** (gdStep - 1);
                      const curY = 60 - (curX ** 2) / 25;
                      return (
                        <>
                          <circle cx={curX} cy={curY} r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1={curX} y1={curY} x2={curX} y2="60" stroke="rgba(250,204,21,0.4)" strokeDasharray="2,2" />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}

            {/* 4. BACKPROPAGATION */}
            {activeTab === 'backprop' && (
              <div className="visual-stage-grid">
                <div className="visual-stage-controls">
                  <h4 className="visual-controls-title">10-Stage Calculus Stepper</h4>
                  <p className="visual-controls-desc">
                    Step sequentially through forward propagation, cross-entropy error computation, chain-rule partial gradients, and synaptic weight adaptation.
                  </p>

                  <div className="visual-btn-group">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {[
                        { s: 1, name: '1. Forward Pass' },
                        { s: 2, name: '2. Sigmoid Activation' },
                        { s: 3, name: '3. Loss Computation' },
                        { s: 4, name: '4. Chain Rule Gradients' },
                      ].map(({ s, name }) => (
                        <button
                          key={s}
                          type="button"
                          className={`visual-toggle-btn ${backpropStage === s ? 'visual-toggle-btn--active' : ''}`}
                          onClick={() => setBackpropStage(s)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="visual-metric-box">
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Active Stage</span>
                      <span className="visual-metric-val">
                        {backpropStage === 1 && 'Forward Affine z = w·x + b'}
                        {backpropStage === 2 && 'Activation a = σ(z)'}
                        {backpropStage === 3 && 'Loss L = ½(y - a)²'}
                        {backpropStage === 4 && '∂L/∂w = (a - y)·σ\'(z)·x'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="visual-stage-display">
                  <svg viewBox="0 0 160 100" className="visual-svg-canvas">
                    {/* Layer 1 Nodes */}
                    <circle cx="30" cy="30" r="10" fill="#164bff" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="30" y="34" fill="#ffffff" fontSize="8" textAnchor="middle">x₁</text>

                    <circle cx="30" cy="70" r="10" fill="#164bff" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="30" y="74" fill="#ffffff" fontSize="8" textAnchor="middle">x₂</text>

                    {/* Layer 2 Node */}
                    <circle cx="90" cy="50" r="12" fill="#0b1633" stroke="#facc15" strokeWidth="2" />
                    <text x="90" y="54" fill="#facc15" fontSize="8" textAnchor="middle">Σ+σ</text>

                    {/* Layer 3 Output Node */}
                    <circle cx="140" cy="50" r="10" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="140" y="54" fill="#050814" fontSize="8" textAnchor="middle">ŷ</text>

                    {/* Synaptic Weights */}
                    <line
                      x1="40"
                      y1="30"
                      x2="78"
                      y2="50"
                      stroke={backpropStage >= 4 ? '#ef4444' : '#38bdf8'}
                      strokeWidth="2"
                    />
                    <line
                      x1="40"
                      y1="70"
                      x2="78"
                      y2="50"
                      stroke={backpropStage >= 4 ? '#ef4444' : '#38bdf8'}
                      strokeWidth="2"
                    />
                    <line
                      x1="102"
                      y1="50"
                      x2="130"
                      y2="50"
                      stroke="#facc15"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* 5. CNN FEATURE MAP */}
            {activeTab === 'cnn' && (
              <div className="visual-stage-grid">
                <div className="visual-stage-controls">
                  <h4 className="visual-controls-title">Spatial Convolution & Pooling</h4>
                  <p className="visual-controls-desc">
                    Slide a 3×3 spatial filter across pixel channels. Observe edge feature maps and spatial subsampling through 2×2 Max Pooling.
                  </p>

                  <div className="visual-btn-group">
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Filter Kernel:</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { id: 'sobel_x', label: 'Sobel X (Vertical)' },
                        { id: 'edge', label: 'Laplacian Edge' },
                        { id: 'blur', label: 'Gaussian Blur' },
                      ].map((k) => (
                        <button
                          key={k.id}
                          type="button"
                          className={`visual-toggle-btn ${cnnKernel === k.id ? 'visual-toggle-btn--active' : ''}`}
                          onClick={() => setCnnKernel(k.id)}
                        >
                          {k.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="visual-metric-box">
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Input Size</span>
                      <span className="visual-metric-val">8×8 Image</span>
                    </div>
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Output Feature Map</span>
                      <span className="visual-metric-val">6×6 (Valid Conv)</span>
                    </div>
                  </div>
                </div>

                <div className="visual-stage-display">
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Input Pattern</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 12px)', gap: '2px', marginTop: '4px' }}>
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: '12px',
                              height: '12px',
                              background: i % 5 === 2 ? '#38bdf8' : '#0b1633',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <span style={{ color: '#facc15', fontWeight: 'bold' }}>* [3×3] →</span>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Feature Map</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 14px)', gap: '2px', marginTop: '4px' }}>
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: '14px',
                              height: '14px',
                              background: i % 3 === 1 ? '#10b981' : '#050814',
                              border: '1px solid rgba(255,255,255,0.15)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SELF-ATTENTION */}
            {activeTab === 'attention' && (
              <div className="visual-stage-grid">
                <div className="visual-stage-controls">
                  <h4 className="visual-controls-title">Transformer Attention Heatmap</h4>
                  <p className="visual-controls-desc">
                    Click tokens to inspect scaled dot-product attention scores $\text{softmax}(QK^T / \sqrt{d_k})$. Observe how pronoun &ldquo;it&rdquo; links to &ldquo;animal&rdquo;.
                  </p>

                  <div className="visual-btn-group">
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Select Query Token:</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['The', 'animal', 'didn\'t', 'cross', 'it', 'tired'].map((w) => (
                        <button
                          key={w}
                          type="button"
                          className={`visual-toggle-btn ${selectedWord === w ? 'visual-toggle-btn--active' : ''}`}
                          onClick={() => setSelectedWord(w)}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="visual-metric-box">
                    <div className="visual-metric-col">
                      <span className="visual-metric-label">Highest Attention</span>
                      <span className="visual-metric-val" style={{ color: '#facc15' }}>
                        {selectedWord === 'it' ? 'animal (88.4%)' : 'The (64.1%)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="visual-stage-display">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '300px' }}>
                    {[
                      { word: 'animal', weight: selectedWord === 'it' ? 0.88 : 0.12 },
                      { word: 'street', weight: selectedWord === 'it' ? 0.08 : 0.15 },
                      { word: 'tired', weight: selectedWord === 'it' ? 0.72 : 0.1 },
                      { word: 'cross', weight: selectedWord === 'it' ? 0.05 : 0.65 },
                    ].map(({ word, weight }) => (
                      <div key={word} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '50px', fontSize: '0.8rem', color: '#cbd5e1' }}>{word}</span>
                        <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${weight * 100}%`,
                              height: '100%',
                              background: weight > 0.5 ? '#facc15' : '#38bdf8',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', width: '38px', textAlign: 'right' }}>
                          {(weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Callout */}
          <div className="visual-studio__footer">
            <div className="visual-studio__footer-info">
              <BookOpen size={16} color="#06b6d4" />
              <span>Full mathematical derivation notes in English and Hinglish available in every lab.</span>
            </div>
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => navigate('/laboratory')}
              className="visual-studio__footer-btn"
            >
              ENTER AI LABORATORY
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
