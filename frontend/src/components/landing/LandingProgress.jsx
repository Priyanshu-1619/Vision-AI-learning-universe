import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Flame, CheckCircle, Database, Brain, Zap, ArrowRight, ShieldCheck, CloudUpload } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { readStorage, readMathStorage } from '../../services/roadmapProgressService';
import Button from '../common/Button';
import './LandingProgress.css';

export default function LandingProgress() {
  const navigate = useNavigate();
  const { user, isGuest, openAuthModal } = useAuth();

  const realRecords = useMemo(() => readStorage(), []);
  const realMathRecords = useMemo(() => readMathStorage(), []);

  // Compute actual completed counts
  const actualStats = useMemo(() => {
    let dsDone = 0;
    let mlDone = 0;
    let dlDone = 0;
    let totalDone = 0;

    Object.values(realRecords).forEach((rec) => {
      if (rec.status === 'completed') {
        totalDone++;
        if (rec.domain === 'data-science') dsDone++;
        else if (rec.domain === 'machine-learning') mlDone++;
        else if (rec.domain === 'deep-learning') dlDone++;
      }
    });

    const mathDone = Object.values(realMathRecords).filter((r) => r.status === 'completed').length;

    return {
      totalDone,
      dsDone,
      mlDone,
      dlDone,
      mathDone,
      hasRealData: totalDone > 0 || mathDone > 0,
    };
  }, [realRecords, realMathRecords]);

  // If signed in, show user real data. If guest has local activity, show real local activity.
  // Otherwise, show an explicitly labeled demo preview.
  const isDemo = isGuest && !actualStats.hasRealData;

  const stats = useMemo(() => {
    if (isDemo) {
      return {
        dsPercent: 45,
        mlPercent: 68,
        dlPercent: 32,
        mathPercent: 55,
        streakDays: 4,
        completedTopics: 18,
        completedMath: 7,
        currentTier: 'Intermediate ML',
      };
    }
    return {
      dsPercent: Math.min(100, Math.round((actualStats.dsDone / 12) * 100)),
      mlPercent: Math.min(100, Math.round((actualStats.mlDone / 12) * 100)),
      dlPercent: Math.min(100, Math.round((actualStats.dlDone / 12) * 100)),
      mathPercent: Math.min(100, Math.round((actualStats.mathDone / 10) * 100)),
      streakDays: actualStats.totalDone > 0 ? 1 : 0,
      completedTopics: actualStats.totalDone,
      completedMath: actualStats.mathDone,
      currentTier: user ? 'Synchronized Learner' : 'Local Session',
    };
  }, [isDemo, actualStats, user]);

  return (
    <section className="landing-progress" id="progress" aria-label="Personal Progress Tracker">
      <div className="landing-progress__container">
        <div className="landing-section-header">
          <span className="landing-section-kicker">REAL-TIME PERSISTENCE</span>
          <h2 className="landing-section-title">
            YOUR LEARNING JOURNEY. YOUR PROGRESS.
          </h2>
          <p className="landing-section-desc">
            Track completed curriculum topics, mathematics prerequisites, and mission achievements across independent learning paths.
          </p>
        </div>

        {/* Status Indicator Banner */}
        <div className={`progress-status-strip ${isDemo ? 'progress-status-strip--demo' : 'progress-status-strip--live'}`}>
          <div className="progress-status-text">
            {isDemo ? (
              <>
                <span className="progress-status-badge">DEMO PREVIEW</span>
                <span>Sample guest telemetry shown below. Start exploring topics or sign in to persist your real cloud progress.</span>
              </>
            ) : (
              <>
                <span className="progress-status-badge progress-status-badge--live">LIVE LEARNER TELEMETRY</span>
                <span>
                  {user
                    ? `Authenticated as ${user.displayName} (${user.email}) — Synchronized with SQLite cloud storage.`
                    : 'Saved locally in browser storage. Sign in anytime to sync across devices.'}
                </span>
              </>
            )}
          </div>

          {isGuest && (
            <button
              type="button"
              className="progress-sync-cta"
              onClick={() => openAuthModal('register', 'Create an account to transfer and cloud-sync your progress.')}
            >
              <CloudUpload size={14} />
              <span>Enable Cloud Sync</span>
            </button>
          )}
        </div>

        {/* Progress Metrics Display */}
        <div className="landing-progress__card">
          <div className="landing-progress__grid">
            {/* 3 Domain Progress Bars */}
            <div className="progress-domains-column">
              <h4 className="progress-col-title">Domain Roadmaps</h4>

              {/* Data Science */}
              <div className="progress-bar-row">
                <div className="progress-bar-head">
                  <span className="progress-bar-name">
                    <Database size={14} color="#06b6d4" />
                    Data Science
                  </span>
                  <span className="progress-bar-val">{stats.dsPercent}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${stats.dsPercent}%`, background: '#06b6d4' }} />
                </div>
              </div>

              {/* Machine Learning */}
              <div className="progress-bar-row">
                <div className="progress-bar-head">
                  <span className="progress-bar-name">
                    <Brain size={14} color="#164bff" />
                    Machine Learning
                  </span>
                  <span className="progress-bar-val">{stats.mlPercent}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${stats.mlPercent}%`, background: '#164bff' }} />
                </div>
              </div>

              {/* Deep Learning */}
              <div className="progress-bar-row">
                <div className="progress-bar-head">
                  <span className="progress-bar-name">
                    <Zap size={14} color="#8b5cf6" />
                    Deep Learning
                  </span>
                  <span className="progress-bar-val">{stats.dlPercent}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${stats.dlPercent}%`, background: '#8b5cf6' }} />
                </div>
              </div>

              {/* Mathematics Prerequisites */}
              <div className="progress-bar-row">
                <div className="progress-bar-head">
                  <span className="progress-bar-name">
                    <ShieldCheck size={14} color="#facc15" />
                    Mathematics Prerequisites
                  </span>
                  <span className="progress-bar-val">{stats.mathPercent}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${stats.mathPercent}%`, background: '#facc15' }} />
                </div>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="progress-stats-column">
              <h4 className="progress-col-title">Learner Metrics</h4>
              <div className="progress-stat-tiles">
                <div className="stat-tile">
                  <CheckCircle size={18} color="#10b981" />
                  <div>
                    <span className="stat-tile-val">{stats.completedTopics}</span>
                    <span className="stat-tile-label">Topics Mastered</span>
                  </div>
                </div>

                <div className="stat-tile">
                  <ShieldCheck size={18} color="#facc15" />
                  <div>
                    <span className="stat-tile-val">{stats.completedMath}</span>
                    <span className="stat-tile-label">Math Prerequisites</span>
                  </div>
                </div>

                <div className="stat-tile">
                  <Flame size={18} color="#f97316" />
                  <div>
                    <span className="stat-tile-val">{stats.streakDays} Days</span>
                    <span className="stat-tile-label">Learning Streak</span>
                  </div>
                </div>

                <div className="stat-tile">
                  <Award size={18} color="#38bdf8" />
                  <div>
                    <span className="stat-tile-val">{stats.currentTier}</span>
                    <span className="stat-tile-label">Active Learning Tier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="landing-progress__foot">
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Dual Storage Engine: Client-Side Offline First + SQLite Persistent Server Disk
            </span>
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => navigate('/dashboard')}
              className="landing-progress__btn"
            >
              OPEN FULL DASHBOARD
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
