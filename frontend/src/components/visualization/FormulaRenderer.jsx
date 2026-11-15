import './FormulaRenderer.css';

/**
 * Reusable Formula Renderer for Visualization Engine.
 * Shows mathematical formulation with dynamic variable value substitution.
 */
export default function FormulaRenderer({
  formula = '',
  formulas = [],
  substituted = '',
  variables = {},
  title = 'Mathematical Formulation',
  className = '',
}) {
  const formulaList = formulas.length > 0 ? formulas : formula ? [formula] : [];
  if (formulaList.length === 0) return null;

  return (
    <div className={`formula-renderer ${className}`}>
      <div className="formula-renderer__head">
        <span className="formula-renderer__title">{title}</span>
        {Object.keys(variables).length > 0 && (
          <div className="formula-renderer__vars">
            {Object.entries(variables).map(([k, v]) => (
              <span key={k} className="formula-renderer__var-chip">
                <em>{k}</em> = <strong>{typeof v === 'number' ? Number(v.toFixed(2)) : String(v)}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="formula-renderer__body">
        {formulaList.map((f, idx) => (
          <div key={idx} className="formula-renderer__equation">
            <span className="formula-renderer__symbol">ƒ(x)</span>
            <code className="formula-renderer__code">{f}</code>
          </div>
        ))}

        {substituted && (
          <div className="formula-renderer__substituted">
            <span className="formula-renderer__sub-label">Live Calculation:</span>
            <code className="formula-renderer__sub-code">{substituted}</code>
          </div>
        )}
      </div>
    </div>
  );
}

