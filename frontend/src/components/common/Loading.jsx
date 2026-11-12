import './Loading.css';

export default function Loading({ text = 'Loading...', size = 'md' }) {
  return (
    <div className={`loading loading--${size}`}>
      <div className="loading__spinner">
        <div className="loading__dot"></div>
        <div className="loading__dot"></div>
        <div className="loading__dot"></div>
      </div>
      <p className="loading__text">{text}</p>
    </div>
  );
}
