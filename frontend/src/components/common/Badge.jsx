import './Badge.css';

export default function Badge({ text, color, size = 'sm' }) {
  const safeColor = color || '#06b6d4';

  return (
    <span
      className={`badge badge--${size}`}
      style={{
        background: `color-mix(in srgb, ${safeColor} 15%, transparent)`,
        color: safeColor,
        borderColor: `color-mix(in srgb, ${safeColor} 30%, transparent)`,
      }}
    >
      {text}
    </span>
  );
}
