import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import './LandingFooter.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function LandingFooter() {
  return (
    <footer className="landing-footer" aria-label="Footer Sitemap">
      <div className="landing-footer__container">
        {/* Brand Column */}
        <div className="landing-footer__brand-col">
          <div className="landing-footer__brand">
            <div className="landing-footer__logo-box">
              <Brain size={20} color="#38bdf8" />
            </div>
            <span className="landing-footer__title">AI LEARNING UNIVERSE</span>
          </div>
          <p className="landing-footer__tagline">
            An Interactive Visual Learning Universe for Data Science, Machine Learning, and Deep Learning.
          </p>
          <div className="landing-footer__badge">
            <span>Pure-Local ML • Zero External AI APIs</span>
          </div>
        </div>

        {/* Link Columns */}
        <div className="landing-footer__links-grid">
          {/* Domains */}
          <div className="landing-footer__col">
            <h5 className="landing-footer__heading">Domains</h5>
            <ul>
              <li><Link to="/data-science">Data Science</Link></li>
              <li><Link to="/machine-learning">Machine Learning</Link></li>
              <li><Link to="/deep-learning">Deep Learning</Link></li>
              <li><Link to="/roadmaps/machine-learning">Domain Roadmaps</Link></li>
            </ul>
          </div>

          {/* Laboratories */}
          <div className="landing-footer__col">
            <h5 className="landing-footer__heading">Laboratories</h5>
            <ul>
              <li><Link to="/laboratory">AI Laboratory (13 Models)</Link></li>
              <li><Link to="/inside-model">Inside the Model</Link></li>
              <li><Link to="/library-graph">Library Graph Lab</Link></li>
              <li><Link to="/concept-universe">Concept Universe (316 Nodes)</Link></li>
            </ul>
          </div>

          {/* Practice & Tools */}
          <div className="landing-footer__col">
            <h5 className="landing-footer__heading">Practice & Tools</h5>
            <ul>
              <li><Link to="/missions">AI Mission Mode</Link></li>
              <li><Link to="/debugging">Debugging Simulator</Link></li>
              <li><Link to="/break-it">Break-It Lab</Link></li>
              <li><Link to="/dictionary">AI Knowledge Dictionary</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div className="landing-footer__col">
            <h5 className="landing-footer__heading">Platform</h5>
            <ul>
              <li><Link to="/dashboard">Master Dashboard</Link></li>
              <li><Link to="/mathematics">Mathematics Track</Link></li>
              <li><a href="#hero" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to Top ↑</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="landing-footer__bottom">
        <div className="landing-footer__bottom-container">
          <span>&copy; {CURRENT_YEAR} AI Learning Universe. Built for rigorous education.</span>
          <span className="landing-footer__built-note">
            Render Single-Service Architecture • Fast local NumPy & scikit-learn
          </span>
        </div>
      </div>
    </footer>
  );
}
