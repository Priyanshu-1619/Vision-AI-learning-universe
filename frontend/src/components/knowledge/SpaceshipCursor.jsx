import { useEffect, useRef, useState } from 'react';
import './SpaceshipCursor.css';

const TRAIL_LENGTH = 7;
const SHIP_WIDTH = 26;
const SHIP_HEIGHT = 30;

export default function SpaceshipCursor({ containerRef }) {
  const [isSupported, setIsSupported] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });
  const [isVisible, setIsVisible] = useState(false);

  const cursorRef = useRef(null);
  const trailDotsRef = useRef([]);
  const mousePosRef = useRef({ x: -100, y: -100, lastX: -100, lastY: -100, angle: 0 });
  const trailPositionsRef = useRef(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100, opacity: 0 }))
  );
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');

    const handleMediaChange = (e) => setIsSupported(e.matches);
    try {
      media.addEventListener('change', handleMediaChange);
    } catch {
      // Fallback for older browsers
      media.addListener(handleMediaChange);
    }

    return () => {
      try {
        media.removeEventListener('change', handleMediaChange);
      } catch {
        media.removeListener(handleMediaChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSupported) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - mousePosRef.current.lastX;
      const dy = y - mousePosRef.current.lastY;
      const speed = Math.hypot(dx, dy);

      // Rotate towards direction of movement if moving fast enough
      let targetAngle = mousePosRef.current.angle;
      if (speed > 2.5) {
        // Point ship forward in movement direction (adding 90 deg because ship geometry points up)
        targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      }

      mousePosRef.current.x = x;
      mousePosRef.current.y = y;
      mousePosRef.current.lastX = x;
      mousePosRef.current.lastY = y;
      mousePosRef.current.angle = targetAngle;

      if (!isVisible) setIsVisible(true);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    // 60fps render loop with lerping for smooth engine exhaust trail
    let currentAngle = 0;
    const updateLoop = () => {
      const { x, y, angle } = mousePosRef.current;

      // Smooth angle interpolation
      let diff = angle - currentAngle;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;
      currentAngle += diff * 0.22;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x - SHIP_WIDTH / 2}px, ${
          y - SHIP_HEIGHT / 2
        }px, 0) rotate(${currentAngle}deg)`;
      }

      // Update trailing engine particle trail
      const trail = trailPositionsRef.current;
      trail.unshift({ x, y });
      trail.pop();

      trailDotsRef.current.forEach((dotEl, i) => {
        if (!dotEl) return;
        const pt = trail[i] || { x: -100, y: -100 };
        const factor = (TRAIL_LENGTH - i) / TRAIL_LENGTH;
        const size = Math.max(2, 6 * factor);
        dotEl.style.transform = `translate3d(${pt.x - size / 2}px, ${pt.y - size / 2}px, 0)`;
        dotEl.style.opacity = isVisible ? (factor * 0.45).toFixed(2) : '0';
      });

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [containerRef, isSupported, isVisible]);

  if (!isSupported) return null;

  return (
    <div
      className={`cu-spaceship-cursor-layer ${isVisible ? 'cu-spaceship-cursor-layer--visible' : ''}`}
      aria-hidden="true"
    >
      {/* Engine Exhaust Trail Particles */}
      <div className="cu-spaceship-trail">
        {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              trailDotsRef.current[i] = el;
            }}
            className="cu-trail-dot"
            style={{ '--dot-idx': i }}
          />
        ))}
      </div>

      {/* Stylized Spaceship Exploration Probe */}
      <div ref={cursorRef} className="cu-spaceship-cursor">
        <svg
          width={SHIP_WIDTH}
          height={SHIP_HEIGHT}
          viewBox="0 0 26 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Engine Plasma Thruster Flare */}
          <polygon
            points="11,26 13,31 15,26"
            className="cu-ship-thrust"
            fill="#38bdf8"
          />
          <polygon
            points="12,26 13,29 14,26"
            className="cu-ship-thrust-core"
            fill="#facc15"
          />

          {/* Swept Main Wings */}
          <path
            d="M13 2 L22 25 L16 23 L13 18 L10 23 L4 25 Z"
            fill="#0b1633"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Hull Inner Shading */}
          <path
            d="M13 5 L18 22 L13 18 L8 22 Z"
            fill="rgba(56, 189, 248, 0.25)"
          />

          {/* Cockpit Canopy */}
          <ellipse
            cx="13"
            cy="11"
            rx="2.2"
            ry="4.5"
            fill="#06b6d4"
            className="cu-ship-cockpit"
          />

          {/* Navigation Lights (Left Cyan, Right Yellow) */}
          <circle cx="5" cy="24" r="1.1" fill="#06b6d4" />
          <circle cx="21" cy="24" r="1.1" fill="#facc15" />
        </svg>
      </div>
    </div>
  );
}
