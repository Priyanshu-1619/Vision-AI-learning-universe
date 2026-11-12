import './Button.css';

export default function Button({ children, variant = 'primary', icon: Icon, onClick, className = '', ...props }) {
  return (
    <button className={`btn btn--${variant} ${className}`} onClick={onClick} {...props}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}
