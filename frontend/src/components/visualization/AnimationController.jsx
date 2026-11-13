import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import './AnimationController.css';

/**
 * Reusable Animation Controller for continuous simulations and live training iterations.
 */
export default function AnimationController({
  isPlaying = false,
  onPlayToggle,
  onReset,
  speed = 1,
  onSpeedChange,
  progress = 0,
  currentFrame = 0,
  totalFrames = 100,
  label = 'Iteration',
  className = '',
}) {
  const speeds = [0.5, 1, 2];

  return (
    <div className={`anim-ctrl ${className}`}>
      <div className="anim-ctrl__left">
        <button
          type="button"
          className={`anim-btn ${isPlaying ? 'anim-btn--active' : 'anim-btn--primary'}`}
          onClick={onPlayToggle}
          title={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          <span>{isPlaying ? 'Pause' : 'Animate'}</span>
        </button>

        {onReset && (
          <button
            type="button"
            className="anim-btn anim-btn--ghost"
            onClick={onReset}
            title="Reset to frame 0"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="anim-ctrl__center">
        <div className="anim-ctrl__progress-track">
          <div
            className="anim-ctrl__progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <span className="anim-ctrl__counter">
          {label} {currentFrame} / {totalFrames}
        </span>
      </div>

      <div className="anim-ctrl__right">
        <span className="anim-ctrl__speed-label">
          <FastForward size={12} />
          Speed:
        </span>
        <div className="anim-ctrl__speed-group">
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              className={`anim-speed-btn ${speed === s ? 'anim-speed-btn--active' : ''}`}
              onClick={() => onSpeedChange && onSpeedChange(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

