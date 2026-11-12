import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import './PlotlyChart.css';

const DEFAULT_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: '#070b15',
  font: {
    family: 'Inter, system-ui, sans-serif',
    color: '#94a3b8',
    size: 12,
  },
  margin: { t: 28, r: 18, b: 42, l: 48 },
  xaxis: {
    gridcolor: 'rgba(148, 163, 184, 0.12)',
    zerolinecolor: 'rgba(148, 163, 184, 0.28)',
    tickcolor: '#475569',
  },
  yaxis: {
    gridcolor: 'rgba(148, 163, 184, 0.12)',
    zerolinecolor: 'rgba(148, 163, 184, 0.28)',
    tickcolor: '#475569',
  },
  legend: {
    orientation: 'h',
    y: 1.12,
    x: 0,
    font: { color: '#cbd5e1', size: 11 },
  },
};

const EMPTY_OBJ = {};

export default function PlotlyChart({
  data,
  layout = EMPTY_OBJ,
  config = EMPTY_OBJ,
  height = 320,
  onPlotClick,
}) {
  const containerRef = useRef(null);
  const clickHandlerRef = useRef(onPlotClick);

  useEffect(() => {
    clickHandlerRef.current = onPlotClick;
  }, [onPlotClick]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const mergedLayout = {
      ...DEFAULT_LAYOUT,
      ...layout,
      xaxis: { ...DEFAULT_LAYOUT.xaxis, ...(layout.xaxis || {}) },
      yaxis: { ...DEFAULT_LAYOUT.yaxis, ...(layout.yaxis || {}) },
      margin: { ...DEFAULT_LAYOUT.margin, ...(layout.margin || {}) },
      height,
    };

    const mergedConfig = {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
      ...config,
    };

    Plotly.react(el, data, mergedLayout, mergedConfig);

    const handlePlotlyClick = (eventData) => {
      if (clickHandlerRef.current) {
        clickHandlerRef.current(eventData);
      }
    };
    if (typeof el.on === 'function') {
      el.on('plotly_click', handlePlotlyClick);
    }

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (el && el.isConnected && el.offsetWidth > 0 && el.offsetHeight > 0) {
              Promise.resolve(Plotly.Plots.resize(el)).catch(() => {});
            }
          })
        : null;

    if (observer) observer.observe(el);

    return () => {
      if (observer) observer.disconnect();
      if (typeof el.removeListener === 'function') {
        el.removeListener('plotly_click', handlePlotlyClick);
      }
    };
  }, [data, layout, config, height]);

  useEffect(() => {
    const el = containerRef.current;
    return () => {
      if (el) Plotly.purge(el);
    };
  }, []);

  return <div ref={containerRef} className="plotly-chart" style={{ height }} />;
}
