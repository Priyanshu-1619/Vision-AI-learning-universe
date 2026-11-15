import { useState, useEffect, useCallback, useMemo } from 'react';
import { runGradientDescentLab } from '../../api/client';
import PlotlyChart from '../mathematics/PlotlyChart';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  function_type: 'quadratic',
  learning_rate: 0.1,
  epochs: 25,
  momentum: 0.0,
  start_x: 4.0,
  start_y: 3.0,
};

export default function GradientDescentLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gdResult, setGdResult] = useState(null);

  const executePipeline = useCallback(async (currentParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await runGradientDescentLab({
        functionType: currentParams.function_type,
        learningRate: currentParams.learning_rate,
        epochs: currentParams.epochs,
        momentum: currentParams.momentum,
        startPoint: [currentParams.start_x, currentParams.start_y],
      });
      setGdResult(res);
    } catch (err) {
      setError(err.message || 'Failed to compute Gradient Descent.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executePipeline(params);
    }, 180);
    return () => clearTimeout(timer);
  }, [params, executePipeline]);

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
  };

  // Generate background contour grid for the analytical function
  const contourData = useMemo(() => {
    const gridSize = 45;
    const xRange = [-5, 5];
    const yRange = [-5, 5];
    const xVals = Array.from({ length: gridSize }, (_, i) => xRange[0] + (i / (gridSize - 1)) * (xRange[1] - xRange[0]));
    const yVals = Array.from({ length: gridSize }, (_, i) => yRange[0] + (i / (gridSize - 1)) * (yRange[1] - yRange[0]));

    const zVals = [];
    for (let j = 0; j < gridSize; j++) {
      const row = [];
      const py = yVals[j];
      for (let i = 0; i < gridSize; i++) {
        const px = xVals[i];
        let val;
        if (params.function_type === 'quadratic') {
          val = 0.5 * (px * px + 2.0 * py * py);
        } else if (params.function_type === 'saddle') {
          val = px * px - py * py;
        } else {
          val = (1 - px) ** 2 + 10 * (py - px * px) ** 2;
        }
        row.push(val);
      }
      zVals.push(row);
    }

    return { xVals, yVals, zVals };
  }, [params.function_type]);

  const traces = useMemo(() => {
    const chartTraces = [];

    // Background loss landscape contour
    chartTraces.push({
      x: contourData.xVals,
      y: contourData.yVals,
      z: contourData.zVals,
      type: 'contour',
      colorscale: 'Viridis',
      reversescale: true,
      contours: {
        coloring: 'heatmap',
        showlines: true,
      },
      colorbar: {
        title: 'Loss f(x, y)',
        titleside: 'right',
        len: 0.75,
        tickfont: { color: '#94a3b8', size: 10 },
      },
      hoverinfo: 'none',
      showscale: true,
    });

    if (gdResult?.history && gdResult.history.length > 0) {
      const histX = gdResult.history.map((h) => h.x);
      const histY = gdResult.history.map((h) => h.y);

      // Trajectory Line
      chartTraces.push({
        x: histX,
        y: histY,
        mode: 'lines+markers',
        type: 'scatter',
        name: 'Descent Trajectory',
        line: { color: '#facc15', width: 2.5 },
        marker: {
          color: '#ffffff',
          size: 6,
          line: { color: '#164bff', width: 1.5 },
        },
      });

      // Start Point
      chartTraces.push({
        x: [histX[0]],
        y: [histY[0]],
        mode: 'markers+text',
        type: 'scatter',
        name: 'Start Point',
        text: ['Start'],
        textposition: 'top right',
        textfont: { color: '#38bdf8', size: 12 },
        marker: {
          symbol: 'diamond',
          color: '#38bdf8',
          size: 14,
          line: { color: '#050814', width: 2 },
        },
      });

      // End Point
      const last = gdResult.history[gdResult.history.length - 1];
      chartTraces.push({
        x: [last.x],
        y: [last.y],
        mode: 'markers+text',
        type: 'scatter',
        name: 'Final Step',
        text: ['Optimum'],
        textposition: 'bottom right',
        textfont: { color: '#10b981', size: 12 },
        marker: {
          symbol: 'star',
          color: '#10b981',
          size: 16,
          line: { color: '#050814', width: 2 },
        },
      });
    }

    return chartTraces;
  }, [contourData, gdResult]);

  const layout = useMemo(
    () => ({
      autosize: true,
      margin: { l: 48, r: 24, t: 32, b: 40 },
      plot_bgcolor: 'rgba(5, 8, 20, 0.8)',
      paper_bgcolor: 'transparent',
      xaxis: {
        title: { text: 'Parameter θ₁ (x)', font: { color: '#94a3b8', size: 12 } },
        gridcolor: 'rgba(255, 255, 255, 0.07)',
        tickfont: { color: '#64748b', size: 11 },
      },
      yaxis: {
        title: { text: 'Parameter θ₂ (y)', font: { color: '#94a3b8', size: 12 } },
        gridcolor: 'rgba(255, 255, 255, 0.07)',
        tickfont: { color: '#64748b', size: 11 },
      },
      legend: {
        x: 0.02,
        y: 0.98,
        font: { color: '#cbd5e1', size: 11 },
        bgcolor: 'rgba(11, 22, 51, 0.75)',
      },
    }),
    []
  );

  return (
    <LaboratoryLayout
      config={config}
      loading={loading}
      error={error}
      onReset={handleReset}
      onRetry={() => executePipeline(params)}
      datasetControls={
        <>
          <LabSelect
            id="gd-function"
            label="Loss Surface Manifold"
            value={params.function_type}
            options={[
              { value: 'quadratic', label: 'Convex Quadratic: 0.5(x² + 2y²)' },
              { value: 'rosenbrock', label: 'Rosenbrock Valley (Banana)' },
              { value: 'saddle', label: 'Saddle Point: x² - y²' },
            ]}
            onChange={(v) => setParams((p) => ({ ...p, function_type: v }))}
          />
          <LabSlider
            id="gd-start-x"
            label="Initial Parameter x₀"
            value={params.start_x}
            displayValue={params.start_x.toFixed(1)}
            min={-4.5}
            max={4.5}
            step={0.5}
            onChange={(v) => setParams((p) => ({ ...p, start_x: v }))}
          />
          <LabSlider
            id="gd-start-y"
            label="Initial Parameter y₀"
            value={params.start_y}
            displayValue={params.start_y.toFixed(1)}
            min={-4.5}
            max={4.5}
            step={0.5}
            onChange={(v) => setParams((p) => ({ ...p, start_y: v }))}
          />
        </>
      }
      parameterControls={
        <>
          <LabSlider
            id="gd-lr"
            label="Learning Rate (α)"
            value={params.learning_rate}
            displayValue={params.learning_rate.toFixed(3)}
            min={0.01}
            max={0.5}
            step={0.01}
            onChange={(v) => setParams((p) => ({ ...p, learning_rate: v }))}
          />
          <LabSlider
            id="gd-momentum"
            label="Momentum Coefficient (β)"
            value={params.momentum}
            displayValue={params.momentum.toFixed(2)}
            min={0.0}
            max={0.9}
            step={0.05}
            onChange={(v) => setParams((p) => ({ ...p, momentum: v }))}
          />
          <LabSlider
            id="gd-epochs"
            label="Max Iterations"
            value={params.epochs}
            min={5}
            max={100}
            step={5}
            onChange={(v) => setParams((p) => ({ ...p, epochs: v }))}
          />
        </>
      }
      stageTitle="Gradient Descent Convergence Trajectory"
      stageSubtitle={`Analytical descent across ${params.function_type} loss landscape`}
      visualization={
        loading && !gdResult ? (
          <div className="lab-chart-loading">
            <Loading text="Computing analytical gradient descent trajectory..." />
          </div>
        ) : (
          <PlotlyChart data={traces} layout={layout} />
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Final Loss"
            value={gdResult ? gdResult.final_loss.toFixed(4) : '—'}
            color="#10b981"
          />
          <LabMetricCard
            label="Steps Taken"
            value={gdResult ? gdResult.steps_taken : '—'}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Final Point (x, y)"
            value={gdResult ? `(${gdResult.final_point[0].toFixed(2)}, ${gdResult.final_point[1].toFixed(2)})` : '—'}
            color="#facc15"
          />
          <LabMetricCard
            label="Learning Rate α"
            value={params.learning_rate.toFixed(3)}
            color="#06b6d4"
          />
        </>
      }
    />
  );
}
