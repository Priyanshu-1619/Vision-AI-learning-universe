import { useState, useMemo } from 'react';
import { CheckCircle, Play, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { ALL_CHURN_FEATURES, ALGORITHMS } from './missionData';
import {
  cleanChurnPreview,
  predictChurnCustomer,
  simulateChurnDebug,
} from '../../api/client';
import PlotlyChart from '../mathematics/PlotlyChart';
import Button from '../common/Button';
import Loading from '../common/Loading';

/* ── Stage 1: Dataset Explorer ───────────────────────────── */

export function DataExplorerWidget({ data }) {
  const [view, setView] = useState('overview');

  if (!data) return <Loading text="Loading CSV schema..." />;

  const stayed = data.churn_distribution?.['Stayed (0)'] || 0;
  const churned = data.churn_distribution?.['Churned (1)'] || 0;
  const total = Math.max(1, stayed + churned);

  return (
    <div className="mission-data-explorer">
      <div className="mission-data-explorer__tabs">
        {[
          { id: 'overview', label: 'Schema Overview' },
          { id: 'features', label: 'Columns & Missing' },
          { id: 'sample', label: 'CSV Sample Rows' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`mission-data-tab ${view === tab.id ? 'mission-data-tab--active' : ''}`}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <div className="mission-data-overview">
          <div className="mission-data-stat-grid">
            <div className="mission-data-stat">
              <span>Rows</span>
              <strong>{data.n_samples}</strong>
            </div>
            <div className="mission-data-stat">
              <span>Columns</span>
              <strong>{data.n_columns} ({data.n_features} features)</strong>
            </div>
            <div className="mission-data-stat">
              <span>Target</span>
              <strong>{data.target} (0 / 1)</strong>
            </div>
            <div className="mission-data-stat">
              <span>Missing Values</span>
              <strong style={{ color: '#f59e0b' }}>{data.total_missing}</strong>
            </div>
          </div>
          <div className="mission-churn-dist">
            <span className="mission-churn-dist__label">
              Class Distribution (Churn Rate: {(data.churn_rate * 100).toFixed(1)}%)
            </span>
            <div className="mission-churn-dist__bar-wrap">
              <div className="mission-churn-dist__bar mission-churn-dist__bar--no" style={{ flex: stayed }}>
                Stayed 0 ({stayed})
              </div>
              <div className="mission-churn-dist__bar mission-churn-dist__bar--yes" style={{ flex: churned }}>
                Churned 1 ({churned})
              </div>
            </div>
            <div className="mission-churn-dist__pcts">
              <span>{((stayed / total) * 100).toFixed(1)}% stayed</span>
              <span>{((churned / total) * 100).toFixed(1)}% churned</span>
            </div>
          </div>
        </div>
      )}

      {view === 'features' && (
        <div className="mission-features-table-wrap">
          <table className="mission-features-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>dtype</th>
                <th>Missing</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.stats || {}).map(([col, s]) => (
                <tr key={col}>
                  <td><code>{col}</code></td>
                  <td>{s.type}</td>
                  <td><code>{s.dtype}</code></td>
                  <td style={{ color: s.missing > 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                    {s.missing}
                  </td>
                  <td>
                    {s.type === 'numeric'
                      ? `mean=${s.mean}, range=[${s.min}..${s.max}]`
                      : `${s.unique} unique (top: ${s.top})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'sample' && (
        <div className="mission-features-table-wrap">
          <table className="mission-features-table mission-features-table--small">
            <thead>
              <tr>
                <th>#</th>
                {data.feature_names?.map((f) => (
                  <th key={f}>{f}</th>
                ))}
                <th>churn</th>
              </tr>
            </thead>
            <tbody>
              {(data.sample_rows || []).slice(0, 10).map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  {data.feature_names?.map((f) => (
                    <td key={f}>
                      {row[f] === null || row[f] === undefined ? (
                        <span style={{ color: '#f59e0b' }}>NaN</span>
                      ) : (
                        String(row[f])
                      )}
                    </td>
                  ))}
                  <td>
                    <span className={`mission-churn-badge ${row.churn ? 'mission-churn-badge--yes' : 'mission-churn-badge--no'}`}>
                      {row.churn ? 'Churned' : 'Stayed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Stage 2: Interactive EDA Charts ─────────────────────── */

export function EdaExplorerWidget({ data }) {
  const [chartTab, setChartTab] = useState('contract');

  const chartConfig = useMemo(() => {
    const eda = data?.eda;
    if (!eda) return { traces: [], layout: {} };

    if (chartTab === 'contract') {
      const rows = eda.contract_churn || [];
      return {
        traces: [
          {
            x: rows.map((r) => r.label),
            y: rows.map((r) => r.churn_rate),
            type: 'bar',
            text: rows.map((r) => `${r.churn_rate}% (n=${r.count})`),
            textposition: 'auto',
            marker: { color: ['#f43f5e', '#f59e0b', '#10b981'] },
          },
        ],
        layout: {
          yaxis: { title: 'Churn Rate (%)', range: [0, 55] },
          xaxis: { title: 'Contract Type' },
        },
      };
    }

    if (chartTab === 'internet') {
      const rows = eda.internet_churn || [];
      return {
        traces: [
          {
            x: rows.map((r) => r.label),
            y: rows.map((r) => r.churn_rate),
            type: 'bar',
            text: rows.map((r) => `${r.churn_rate}% (n=${r.count})`),
            textposition: 'auto',
            marker: { color: ['#38bdf8', '#8b5cf6', '#10b981'] },
          },
        ],
        layout: {
          yaxis: { title: 'Churn Rate (%)', range: [0, 55] },
          xaxis: { title: 'Internet Service' },
        },
      };
    }

    if (chartTab === 'tenure') {
      return {
        traces: [
          {
            x: eda.tenure_by_churn?.stayed || [],
            type: 'histogram',
            name: 'Stayed (0)',
            opacity: 0.68,
            marker: { color: '#10b981' },
            nbinsx: 12,
          },
          {
            x: eda.tenure_by_churn?.churned || [],
            type: 'histogram',
            name: 'Churned (1)',
            opacity: 0.72,
            marker: { color: '#f43f5e' },
            nbinsx: 12,
          },
        ],
        layout: {
          barmode: 'overlay',
          xaxis: { title: 'Tenure (Months)' },
          yaxis: { title: 'Customers' },
        },
      };
    }

    // monthly charges vs churn
    return {
      traces: [
        {
          x: eda.charges_by_churn?.stayed || [],
          type: 'histogram',
          name: 'Stayed (0)',
          opacity: 0.68,
          marker: { color: '#38bdf8' },
          nbinsx: 14,
        },
        {
          x: eda.charges_by_churn?.churned || [],
          type: 'histogram',
          name: 'Churned (1)',
          opacity: 0.72,
          marker: { color: '#f43f5e' },
          nbinsx: 14,
        },
      ],
      layout: {
        barmode: 'overlay',
        xaxis: { title: 'Monthly Charges ($)' },
        yaxis: { title: 'Customers' },
      },
    };
  }, [data, chartTab]);

  return (
    <div className="mission-data-explorer">
      <div className="mission-data-explorer__tabs">
        {[
          { id: 'contract', label: 'By Contract Type' },
          { id: 'internet', label: 'By Internet Service' },
          { id: 'tenure', label: 'Tenure Distribution' },
          { id: 'charges', label: 'Monthly Charges' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`mission-data-tab ${chartTab === t.id ? 'mission-data-tab--active' : ''}`}
            onClick={() => setChartTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <PlotlyChart
        data={chartConfig.traces}
        layout={{ ...chartConfig.layout, margin: { t: 22, r: 20, b: 42, l: 50 } }}
        height={265}
      />
    </div>
  );
}

/* ── Stage 3: Data Cleaning & ColumnTransformer Preview ──── */

export function CleaningPipelineWidget({ cleaningConfig, onChange, onPreviewReady }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const handleRunPreview = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await cleanChurnPreview({
        missing_strategy: cleaningConfig.missing_strategy,
        categorical_encoding: cleaningConfig.categorical_encoding,
        scale_numeric: cleaningConfig.scale_numeric,
      });
      setPreview(res);
      onPreviewReady(res);
    } catch (e) {
      setErr(e.message || 'Preprocessing preview failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mission-clean-box">
      <div className="mission-clean-grid">
        <div className="mission-clean-field">
          <label htmlFor="clean-missing-select">1. Missing Values (`total_charges`: 14, `support_calls`: 10)</label>
          <select
            id="clean-missing-select"
            className="lab-select"
            value={cleaningConfig.missing_strategy}
            onChange={(e) => onChange({ ...cleaningConfig, missing_strategy: e.target.value })}
          >
            <option value="median_impute">SimpleImputer (Median / Mode — Recommended)</option>
            <option value="drop_rows">Drop Rows with NaN (loses ~24 rows)</option>
          </select>
        </div>

        <div className="mission-clean-field">
          <label htmlFor="clean-enc-select">2. Categorical Encoding (`contract_type`, `internet_service`, `payment_method`)</label>
          <select
            id="clean-enc-select"
            className="lab-select"
            value={cleaningConfig.categorical_encoding}
            onChange={(e) => onChange({ ...cleaningConfig, categorical_encoding: e.target.value })}
          >
            <option value="onehot">OneHotEncoder (Recommended — no false ordering)</option>
            <option value="ordinal">OrdinalEncoder (integer codes)</option>
          </select>
        </div>

        <div className="mission-clean-field" style={{ gridColumn: '1 / -1' }}>
          <label className="lab-toggle-row" htmlFor="clean-scale-check">
            <span>3. Fit <code>StandardScaler</code> inside training fold (`ColumnTransformer + Pipeline`, zero data leakage)</span>
            <input
              id="clean-scale-check"
              type="checkbox"
              className="lab-toggle-checkbox"
              checked={cleaningConfig.scale_numeric}
              onChange={(e) => onChange({ ...cleaningConfig, scale_numeric: e.target.checked })}
            />
          </label>
        </div>
      </div>

      <Button variant="primary" icon={Play} onClick={handleRunPreview} disabled={loading}>
        {loading ? 'Running ColumnTransformer...' : 'Run Preprocessing Preview'}
      </Button>

      {err && <div className="lab-error-banner" style={{ marginTop: '0.75rem' }}>{err}</div>}

      {preview && (
        <div className="mission-clean-result">
          <div className="mission-data-stat-grid">
            <div className="mission-data-stat">
              <span>Rows Retained</span>
              <strong>{preview.rows_after_cleaning} / {preview.initial_rows}</strong>
            </div>
            <div className="mission-data-stat">
              <span>Missing After</span>
              <strong style={{ color: '#10b981' }}>{preview.remaining_missing} NaNs</strong>
            </div>
            <div className="mission-data-stat">
              <span>Encoded Columns</span>
              <strong style={{ color: '#38bdf8' }}>{preview.encoded_feature_count}</strong>
            </div>
            <div className="mission-data-stat">
              <span>Leakage Guard</span>
              <strong style={{ color: '#10b981' }}>Train-Fold Fit ✓</strong>
            </div>
          </div>
          <div className="mission-clean-cols">
            {preview.transformed_feature_names?.map((col) => (
              <code key={col} className="mission-col-tag">{col}</code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared Quiz Widget ──────────────────────────────────── */

export function QuizWidget({
  question,
  options,
  selectedOption,
  submitted,
  isCorrect,
  correctAnswer,
  explanation,
  onSelect,
  onSubmit,
}) {
  return (
    <div className="mission-quiz">
      <p className="mission-quiz__question">❓ {question}</p>
      <div className="mission-quiz__options">
        {options.map((opt, idx) => {
          let cls = 'mission-quiz-option';
          if (submitted) {
            if (idx === correctAnswer) cls += ' mission-quiz-option--correct';
            else if (idx === selectedOption && !isCorrect) cls += ' mission-quiz-option--wrong';
          } else if (idx === selectedOption) {
            cls += ' mission-quiz-option--selected';
          }
          return (
            <button
              key={idx}
              type="button"
              className={cls}
              onClick={() => !submitted && onSelect(idx)}
              disabled={submitted}
            >
              <span className="mission-quiz-option__letter">{String.fromCharCode(65 + idx)}</span>
              <span className="mission-quiz-option__text">{opt}</span>
              {submitted && idx === correctAnswer && <CheckCircle size={15} color="#10b981" />}
            </button>
          );
        })}
      </div>
      {!submitted && (
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={selectedOption === null}
          style={{ marginTop: '0.75rem', opacity: selectedOption !== null ? 1 : 0.4 }}
        >
          Submit Answer
        </Button>
      )}
      {submitted && (
        <div
          className={`mission-quiz__feedback ${
            isCorrect ? 'mission-quiz__feedback--correct' : 'mission-quiz__feedback--wrong'
          }`}
        >
          <span>{isCorrect ? '✓ Correct!' : '✗ Review this insight:'}</span>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}

/* ── Stage 4: Feature Selector ───────────────────────────── */

export function FeatureSelectorWidget({
  selectedFeatures,
  onToggle,
  onConfirm,
  submitted,
  sc,
}) {
  return (
    <div className="mission-feature-selector">
      <p className="mission-feature-selector__info">
        Select features ({selectedFeatures.length} / {ALL_CHURN_FEATURES.length} selected).
        Required: <strong>{sc?.required?.join(', ')}</strong> (minimum {sc?.minSelected || 5}).
      </p>
      <div className="mission-feature-selector__grid">
        {ALL_CHURN_FEATURES.map((f) => {
          const checked = selectedFeatures.includes(f.key);
          return (
            <label
              key={f.key}
              className={`mission-feature-chip ${checked ? 'mission-feature-chip--active' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => !submitted && onToggle(f.key)}
                disabled={submitted}
                style={{ display: 'none' }}
              />
              <span className="mission-feature-chip__check">{checked ? '✓' : '+'}</span>
              <div>
                <span className="mission-feature-chip__name">{f.label}</span>
                <span className="mission-feature-chip__desc">{f.description}</span>
              </div>
            </label>
          );
        })}
      </div>
      {!submitted && (
        <Button variant="primary" onClick={onConfirm} style={{ marginTop: '0.75rem' }}>
          Confirm Feature Set
        </Button>
      )}
      {submitted && (
        <div className="mission-quiz__feedback mission-quiz__feedback--correct">
          {sc?.explanation}
        </div>
      )}
    </div>
  );
}

/* ── Stage 5: Algorithm Selector ─────────────────────────── */

export function AlgorithmSelectorWidget({ selected, onSelect }) {
  return (
    <div className="mission-algo-selector">
      <div className="mission-algo-selector__grid">
        {ALGORITHMS.map((alg) => (
          <button
            key={alg.id}
            type="button"
            className={`mission-algo-card ${selected === alg.id ? 'mission-algo-card--active' : ''}`}
            onClick={() => onSelect(alg.id)}
          >
            <div className="mission-algo-card__icon">{alg.icon}</div>
            <div className="mission-algo-card__name">{alg.name}</div>
            <div className="mission-algo-card__desc">{alg.description}</div>
            <div className="mission-algo-card__pros">
              {alg.pros.map((p, i) => (
                <span key={i} className="mission-algo-pro">✓ {p}</span>
              ))}
            </div>
            <div className="mission-algo-card__cons">
              {alg.cons.map((c, i) => (
                <span key={i} className="mission-algo-con">⚠ {c}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mission-quiz__feedback mission-quiz__feedback--correct">
          ✓ Selected <strong>{ALGORITHMS.find((a) => a.id === selected)?.name}</strong>. Click Continue below to train & evaluate it.
        </div>
      )}
    </div>
  );
}

/* ── Stage 6 & 9: Train Config & Improve Studio ──────────── */

export function TrainConfigWidget({
  algorithm,
  onAlgorithmChange,
  allowAlgorithmSwitch = false,
  config,
  onConfigChange,
  onTrain,
  training,
  result,
  baselineResult,
  error,
  successCriteria,
}) {
  const algDef = ALGORITHMS.find((a) => a.id === algorithm);

  return (
    <div className="mission-train-config">
      <div className="mission-train-config__controls">
        {allowAlgorithmSwitch ? (
          <div className="mission-clean-field">
            <label htmlFor="improve-alg-select">Classifier Algorithm</label>
            <select
              id="improve-alg-select"
              className="lab-select"
              value={algorithm}
              onChange={(e) => onAlgorithmChange(e.target.value)}
            >
              {ALGORITHMS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mission-train-config__alg-badge">
            Active Algorithm: <strong>{algDef?.name || algorithm}</strong>
          </div>
        )}

        {algorithm === 'knn' && (
          <div className="mission-train-param">
            <label>K Neighbors: <strong>{config.n_neighbors}</strong></label>
            <input
              type="range"
              min={1}
              max={25}
              step={2}
              value={config.n_neighbors}
              onChange={(e) => onConfigChange((c) => ({ ...c, n_neighbors: Number(e.target.value) }))}
              className="lab-slider"
            />
          </div>
        )}

        {(algorithm === 'tree' || algorithm === 'forest') && (
          <div className="mission-train-param">
            <label>max_depth: <strong>{config.max_depth}</strong></label>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={config.max_depth}
              onChange={(e) => onConfigChange((c) => ({ ...c, max_depth: Number(e.target.value) }))}
              className="lab-slider"
            />
          </div>
        )}

        {algorithm === 'forest' && (
          <div className="mission-train-param">
            <label>Trees (n_estimators): <strong>{config.n_estimators}</strong></label>
            <input
              type="range"
              min={10}
              max={150}
              step={10}
              value={config.n_estimators}
              onChange={(e) => onConfigChange((c) => ({ ...c, n_estimators: Number(e.target.value) }))}
              className="lab-slider"
            />
          </div>
        )}

        <div className="mission-train-param">
          <label>Holdout Test Split: <strong>{(config.test_size * 100).toFixed(0)}%</strong></label>
          <input
            type="range"
            min={0.15}
            max={0.40}
            step={0.05}
            value={config.test_size}
            onChange={(e) => onConfigChange((c) => ({ ...c, test_size: Number(e.target.value) }))}
            className="lab-slider"
          />
        </div>

        {allowAlgorithmSwitch && (
          <label className="lab-toggle-row" htmlFor="improve-cw-toggle">
            <span>Balance Minority Class Weights (`class_weight=&quot;balanced&quot;`)</span>
            <input
              id="improve-cw-toggle"
              type="checkbox"
              className="lab-toggle-checkbox"
              checked={Boolean(config.class_weight_balanced)}
              onChange={(e) =>
                onConfigChange((c) => ({ ...c, class_weight_balanced: e.target.checked }))
              }
            />
          </label>
        )}

        <Button variant="primary" icon={Play} onClick={onTrain} disabled={training}>
          {training ? 'Fitting sklearn Pipeline...' : allowAlgorithmSwitch ? 'Retrain & Compare' : 'Train sklearn Pipeline'}
        </Button>

        {error && <div className="lab-error-banner">{error}</div>}
      </div>

      {training && <Loading text="Training ColumnTransformer + Classifier..." />}

      {result && !training && (
        <>
          <MetricsResultWidget
            result={result}
            baselineResult={allowAlgorithmSwitch ? baselineResult : null}
            successCriteria={successCriteria}
          />
          {allowAlgorithmSwitch && result.feature_importances && (
            <FeatureImportanceChart importances={result.feature_importances} />
          )}
        </>
      )}
    </div>
  );
}

function FeatureImportanceChart({ importances }) {
  const entries = Object.entries(importances).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  return (
    <div className="mission-importance-wrap">
      <h4 className="lab-dt-chart-title">Trained Feature Importances</h4>
      <PlotlyChart
        data={[
          {
            x: entries.map(([k]) => k),
            y: entries.map(([, v]) => Number((v * 100).toFixed(1))),
            type: 'bar',
            marker: { color: '#38bdf8' },
          },
        ]}
        layout={{
          yaxis: { title: 'Importance (%)' },
          margin: { t: 14, r: 16, b: 64, l: 48 },
        }}
        height={220}
      />
    </div>
  );
}

export function MetricsResultWidget({ result, baselineResult, successCriteria }) {
  const sc = successCriteria;
  const meetsThreshold =
    sc?.type === 'value-check'
      ? sc.comparison === 'gte'
        ? result[sc.field] >= sc.threshold
        : result[sc.field] <= sc.threshold
      : true;

  const formatDelta = (curr, base, isPct = false) => {
    if (!base) return null;
    const diff = curr - base;
    if (Math.abs(diff) < 0.001) return null;
    const sign = diff > 0 ? '+' : '';
    return isPct ? `${sign}${(diff * 100).toFixed(1)}% vs base` : `${sign}${diff.toFixed(3)} vs base`;
  };

  return (
    <div className="mission-metrics-result">
      {result.pipeline_steps && (
        <div className="mission-pipeline-trace">
          Pipeline: {result.pipeline_steps.join(' → ')}
        </div>
      )}

      <div className="mission-metrics-grid">
        <div className="mission-metric-box">
          <span className="mission-metric-box__label">Test Accuracy</span>
          <span className="mission-metric-box__val" style={{ color: '#10b981' }}>
            {(result.accuracy * 100).toFixed(1)}%
          </span>
          {baselineResult && (
            <span className="mission-metric-delta">{formatDelta(result.accuracy, baselineResult.accuracy, true)}</span>
          )}
        </div>
        <div className="mission-metric-box">
          <span className="mission-metric-box__label">Train Accuracy</span>
          <span className="mission-metric-box__val" style={{ color: '#38bdf8' }}>
            {(result.train_accuracy * 100).toFixed(1)}%
          </span>
        </div>
        <div className="mission-metric-box">
          <span className="mission-metric-box__label">Precision</span>
          <span className="mission-metric-box__val" style={{ color: '#f59e0b' }}>
            {result.precision.toFixed(3)}
          </span>
        </div>
        <div className="mission-metric-box">
          <span className="mission-metric-box__label">Recall (Churn)</span>
          <span className="mission-metric-box__val" style={{ color: '#ec4899' }}>
            {result.recall.toFixed(3)}
          </span>
          {baselineResult && (
            <span className="mission-metric-delta">{formatDelta(result.recall, baselineResult.recall)}</span>
          )}
        </div>
        <div className="mission-metric-box">
          <span className="mission-metric-box__label">F1 Score</span>
          <span className="mission-metric-box__val" style={{ color: '#8b5cf6' }}>
            {result.f1.toFixed(3)}
          </span>
          {baselineResult && (
            <span className="mission-metric-delta">{formatDelta(result.f1, baselineResult.f1)}</span>
          )}
        </div>
      </div>

      {sc?.type === 'value-check' && (
        <div
          className={`mission-quiz__feedback ${
            meetsThreshold ? 'mission-quiz__feedback--correct' : 'mission-quiz__feedback--wrong'
          }`}
        >
          {meetsThreshold
            ? `✓ Goal reached! ${sc.field} = ${result[sc.field].toFixed(3)} ≥ ${sc.threshold}. ${sc.explanation}`
            : `Not there yet: ${sc.field} = ${result[sc.field].toFixed(3)} (target ≥ ${sc.threshold}). Try tuning depth, Random Forest, or balancing class weights.`}
        </div>
      )}
    </div>
  );
}

/* ── Stage 7: Confusion Matrix ───────────────────────────── */

export function ConfusionMatrixWidget({ result }) {
  const cm = result?.confusion_matrix;
  if (!cm || cm.length < 2) return null;

  const [[tn, fp], [fn, tp]] = cm;
  return (
    <div className="mission-cm-wrap">
      <h4 className="mission-cm-title">Confusion Matrix (Holdout Test Set)</h4>
      <div className="mission-cm-labels-row">
        <span />
        <span className="mission-cm-axis-label">Predicted: Stay (0)</span>
        <span className="mission-cm-axis-label">Predicted: Churn (1)</span>
      </div>
      <div className="mission-cm-grid">
        <span className="mission-cm-row-label">Actual: Stay (0)</span>
        <div className="mission-cm-cell" style={{ borderColor: '#10b981' }}>
          <span className="mission-cm-cell__label" style={{ color: '#10b981' }}>TN (True Stay)</span>
          <span className="mission-cm-cell__val">{tn}</span>
        </div>
        <div className="mission-cm-cell" style={{ borderColor: '#f59e0b' }}>
          <span className="mission-cm-cell__label" style={{ color: '#f59e0b' }}>FP (False Alarm)</span>
          <span className="mission-cm-cell__val">{fp}</span>
        </div>
        <span className="mission-cm-row-label">Actual: Churn (1)</span>
        <div className="mission-cm-cell" style={{ borderColor: '#ef4444' }}>
          <span className="mission-cm-cell__label" style={{ color: '#ef4444' }}>FN (Missed Churn!)</span>
          <span className="mission-cm-cell__val">{fn}</span>
          <span className="mission-cm-cell__desc">Lost customers</span>
        </div>
        <div className="mission-cm-cell" style={{ borderColor: '#38bdf8' }}>
          <span className="mission-cm-cell__label" style={{ color: '#38bdf8' }}>TP (Caught Churn)</span>
          <span className="mission-cm-cell__val">{tp}</span>
        </div>
      </div>
      <MetricsResultWidget result={result} />
    </div>
  );
}

/* ── Stage 8: Real ML Debugging Lab (Problems A, B, C) ───── */

const DEBUG_CASES = [
  {
    id: 'overfitting',
    title: 'Problem A: Unconstrained Tree Memorization',
    question: 'Why does Train Accuracy hit ~100% while Test Accuracy drops sharply (~78%)?',
    options: [
      'Underfitting — the tree has too few parameters',
      'Overfitting — unlimited max_depth memorizes noise in X_train',
      'Label encoding failed to map strings',
    ],
    answer: 1,
    fixHint: 'Limit max_depth / min_samples_split or average multiple trees via Random Forest.',
  },
  {
    id: 'leakage',
    title: 'Problem B: Preprocessing Before Split',
    question: 'What bug occurred when `preprocessor.fit_transform(X)` ran BEFORE `train_test_split`?',
    options: [
      'Data Leakage — test-set mean, median, and scaling parameters leaked into training',
      'Multicollinearity removed half the rows',
      'Gradient explosion corrupted logistic weights',
    ],
    answer: 0,
    fixHint: 'Always wrap StandardScaler/Imputer in a sklearn Pipeline and fit ONLY on X_train.',
  },
  {
    id: 'imbalance',
    title: 'Problem C: Majority Class Accuracy Paradox',
    question: 'The Dummy baseline scores ~75% Accuracy with 0.00 Recall. What is happening?',
    options: [
      '75% Accuracy means the model works very well',
      'Class Imbalance misleads Accuracy: predicting "Stay" for everyone misses 100% of churners',
      'Precision is too high to compute F1',
    ],
    answer: 1,
    fixHint: 'Track Recall/F1 and apply class_weight="balanced" to catch minority churners.',
  },
];

export function DebugLabWidget({ onAllSolved }) {
  const [demos, setDemos] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [solvedIds, setSolvedIds] = useState({});
  const [err, setErr] = useState(null);

  const handleRunDemo = async (id) => {
    setLoadingId(id);
    setErr(null);
    try {
      const res = await simulateChurnDebug({ scenario: id });
      setDemos((prev) => ({ ...prev, [id]: res }));
    } catch (e) {
      setErr(e.message || 'Failed to execute debug scenario.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleChoose = (caseObj, idx) => {
    setAnswers((prev) => ({ ...prev, [caseObj.id]: idx }));
    if (idx === caseObj.answer) {
      const nextSolved = { ...solvedIds, [caseObj.id]: true };
      setSolvedIds(nextSolved);
      const count = Object.keys(nextSolved).length;
      onAllSolved(count, count === DEBUG_CASES.length);
    }
  };

  return (
    <div className="mission-debug-grid">
      {err && <div className="lab-error-banner">{err}</div>}
      {DEBUG_CASES.map((c) => {
        const demo = demos[c.id];
        const chosen = answers[c.id];
        const solved = Boolean(solvedIds[c.id]);

        return (
          <div key={c.id} className={`mission-debug-card ${solved ? 'mission-debug-card--solved' : ''}`}>
            <div className="mission-debug-card__head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {solved ? <ShieldCheck size={17} color="#10b981" /> : <AlertTriangle size={17} color="#f59e0b" />}
                <h4>{c.title}</h4>
              </div>
              <Button
                variant="secondary"
                icon={Play}
                onClick={() => handleRunDemo(c.id)}
                disabled={loadingId === c.id}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                {loadingId === c.id ? 'Running...' : demo ? 'Re-run in sklearn' : 'Run Bug Demo'}
              </Button>
            </div>

            {demo && (
              <div className="mission-debug-card__evidence">
                <pre className="mission-code-block" style={{ margin: '0 0 0.5rem' }}>
                  <code>{demo.code_snippet}</code>
                </pre>
                <div className="mission-debug-metrics">
                  {Object.entries(demo.metrics || {}).map(([k, v]) => (
                    <span key={k} className="mission-debug-pill">
                      {k}: <strong>{typeof v === 'number' && v <= 1 ? `${(v * 100).toFixed(1)}%` : String(v)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mission-debug-card__q">{c.question}</p>
            <div className="mission-debug-options">
              {c.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={solved}
                  onClick={() => handleChoose(c, idx)}
                  className={`mission-debug-opt ${
                    solved && idx === c.answer
                      ? 'mission-debug-opt--correct'
                      : chosen === idx && idx !== c.answer
                        ? 'mission-debug-opt--wrong'
                        : ''
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {solved && (
              <div className="mission-quiz__feedback mission-quiz__feedback--correct" style={{ marginTop: '0.5rem' }}>
                ✓ Verified! {c.fixHint}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Stage 10: Live Inference Widget ─────────────────────── */

export function LivePredictWidget({ pipelineConfig, onPredicted }) {
  const [customer, setCustomer] = useState({
    tenure: 4,
    monthly_charges: 92,
    contract_type: 'Month-to-month',
    internet_service: 'Fiber optic',
    payment_method: 'Electronic check',
    support_calls: 4,
    senior_customer: 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [pred, setPred] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setErr(null);
    try {
      const payload = {
        ...customer,
        total_charges: Number((customer.tenure * customer.monthly_charges).toFixed(2)),
      };
      const res = await predictChurnCustomer(payload, pipelineConfig);
      setPred(res);
      onPredicted(res);
    } catch (e) {
      setErr(e.message || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mission-predict-box">
      <div className="mission-predict-grid">
        <div className="mission-train-param">
          <label>Tenure: <strong>{customer.tenure} months</strong></label>
          <input
            type="range"
            min={1}
            max={72}
            step={1}
            value={customer.tenure}
            onChange={(e) => setCustomer((c) => ({ ...c, tenure: Number(e.target.value) }))}
            className="lab-slider"
          />
        </div>

        <div className="mission-train-param">
          <label>Monthly Charges: <strong>${customer.monthly_charges}</strong></label>
          <input
            type="range"
            min={20}
            max={120}
            step={2}
            value={customer.monthly_charges}
            onChange={(e) => setCustomer((c) => ({ ...c, monthly_charges: Number(e.target.value) }))}
            className="lab-slider"
          />
        </div>

        <div className="mission-train-param">
          <label>Support Calls: <strong>{customer.support_calls}</strong></label>
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={customer.support_calls}
            onChange={(e) => setCustomer((c) => ({ ...c, support_calls: Number(e.target.value) }))}
            className="lab-slider"
          />
        </div>

        <div className="mission-clean-field">
          <label htmlFor="pred-contract">Contract Type</label>
          <select
            id="pred-contract"
            className="lab-select"
            value={customer.contract_type}
            onChange={(e) => setCustomer((c) => ({ ...c, contract_type: e.target.value }))}
          >
            <option value="Month-to-month">Month-to-month</option>
            <option value="One year">One year</option>
            <option value="Two year">Two year</option>
          </select>
        </div>

        <div className="mission-clean-field">
          <label htmlFor="pred-internet">Internet Service</label>
          <select
            id="pred-internet"
            className="lab-select"
            value={customer.internet_service}
            onChange={(e) => setCustomer((c) => ({ ...c, internet_service: e.target.value }))}
          >
            <option value="Fiber optic">Fiber optic</option>
            <option value="DSL">DSL</option>
            <option value="No">No internet</option>
          </select>
        </div>

        <div className="mission-clean-field">
          <label htmlFor="pred-payment">Payment Method</label>
          <select
            id="pred-payment"
            className="lab-select"
            value={customer.payment_method}
            onChange={(e) => setCustomer((c) => ({ ...c, payment_method: e.target.value }))}
          >
            <option value="Electronic check">Electronic check</option>
            <option value="Mailed check">Mailed check</option>
            <option value="Bank transfer">Bank transfer</option>
            <option value="Credit card">Credit card</option>
          </select>
        </div>
      </div>

      <Button variant="primary" icon={Zap} onClick={handlePredict} disabled={loading} style={{ marginTop: '0.75rem' }}>
        {loading ? 'Predicting...' : 'Predict Churn Risk (sklearn Pipeline)'}
      </Button>

      {err && <div className="lab-error-banner" style={{ marginTop: '0.75rem' }}>{err}</div>}

      {pred && (
        <div className="mission-predict-output">
          <div>
            <span className="mission-metric-box__label">Predicted Outcome</span>
            <strong
              style={{
                fontSize: '1.15rem',
                color: pred.predicted_churn ? '#f43f5e' : '#10b981',
                display: 'block',
                marginTop: '0.2rem',
              }}
            >
              {pred.predicted_churn ? 'LIKELY TO CHURN' : 'LIKELY TO STAY'} ({pred.risk_tier})
            </strong>
          </div>
          <div>
            <span className="mission-metric-box__label">Churn Probability</span>
            <strong style={{ fontSize: '1.25rem', color: '#f59e0b', display: 'block', marginTop: '0.2rem' }}>
              {(pred.churn_probability * 100).toFixed(1)}%
            </strong>
          </div>
          <div>
            <span className="mission-metric-box__label">Retention Probability</span>
            <strong style={{ fontSize: '1.25rem', color: '#38bdf8', display: 'block', marginTop: '0.2rem' }}>
              {(pred.stay_probability * 100).toFixed(1)}%
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}

