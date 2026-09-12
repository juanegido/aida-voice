"use client";

import type { ChartSpec } from "@/lib/chart-tool";

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 260;
const PADDING = { top: 20, right: 20, bottom: 34, left: 46 };

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function truncateLabel(label: string, max = 10): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

function formatValue(value: number, unit?: string): string {
  const formatted = compactFormatter.format(value);
  return unit ? `${formatted}${unit}` : formatted;
}

function gridLines(maxValue: number, unit: string | undefined) {
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
  return [0.25, 0.5, 0.75, 1].map((fraction) => {
    const y = PADDING.top + plotHeight * (1 - fraction);
    const value = maxValue * fraction;
    return { y, label: formatValue(value, unit) };
  });
}

function BarChart({ chart }: { chart: ChartSpec }) {
  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
  const maxValue = Math.max(...chart.series.map((p) => p.value), 1);
  const n = chart.series.length;
  const slot = plotWidth / n;
  const barWidth = Math.min(48, slot * 0.6);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={chart.title}>
      {gridLines(maxValue, chart.unit).map((line) => (
        <g key={line.y}>
          <line
            className="chart-gridline"
            x1={PADDING.left}
            x2={VIEW_WIDTH - PADDING.right}
            y1={line.y}
            y2={line.y}
          />
          <text x={PADDING.left - 8} y={line.y + 3} textAnchor="end">
            {line.label}
          </text>
        </g>
      ))}
      {chart.series.map((point, i) => {
        const barHeight = (point.value / maxValue) * plotHeight;
        const x = PADDING.left + slot * i + (slot - barWidth) / 2;
        const y = PADDING.top + plotHeight - barHeight;
        return (
          <g key={`${point.label}-${i}`}>
            <rect className="chart-bar" x={x} y={y} width={barWidth} height={Math.max(barHeight, 1)} rx={4} />
            <text className="chart-value-label" x={x + barWidth / 2} y={y - 6} textAnchor="middle">
              {formatValue(point.value, chart.unit)}
            </text>
            <text x={x + barWidth / 2} y={VIEW_HEIGHT - PADDING.bottom + 16} textAnchor="middle">
              {truncateLabel(point.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ chart }: { chart: ChartSpec }) {
  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
  const maxValue = Math.max(...chart.series.map((p) => p.value), 1);
  const n = chart.series.length;
  const step = n > 1 ? plotWidth / (n - 1) : 0;

  const points = chart.series.map((point, i) => {
    const x = PADDING.left + step * i;
    const y = PADDING.top + plotHeight - (point.value / maxValue) * plotHeight;
    return { x, y, point };
  });

  const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const baseline = PADDING.top + plotHeight;
  const areaPath = `${PADDING.left},${baseline} ${linePath} ${VIEW_WIDTH - PADDING.right},${baseline}`;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={chart.title}>
      {gridLines(maxValue, chart.unit).map((line) => (
        <g key={line.y}>
          <line
            className="chart-gridline"
            x1={PADDING.left}
            x2={VIEW_WIDTH - PADDING.right}
            y1={line.y}
            y2={line.y}
          />
          <text x={PADDING.left - 8} y={line.y + 3} textAnchor="end">
            {line.label}
          </text>
        </g>
      ))}
      <polygon className="chart-area" points={areaPath} />
      <polyline className="chart-line" points={linePath} />
      {points.map(({ x, y, point }, i) => (
        <g key={`${point.label}-${i}`}>
          <circle className="chart-point" cx={x} cy={y} r={3.5} />
          <text x={x} y={VIEW_HEIGHT - PADDING.bottom + 16} textAnchor="middle">
            {truncateLabel(point.label)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ChartPanel({ charts }: { charts: ChartSpec[] }) {
  return (
    <div className="panel">
      <h2 className="panel-title">Charts</h2>
      {charts.length === 0 ? (
        <div className="chart-panel-empty">
          Ask for a comparison or a trend and AIDA will draw it here.
        </div>
      ) : (
        <div className="chart-list">
          {charts.map((chart) => (
            <div className="chart-card" key={chart.id}>
              <div className="chart-card-title">{chart.title}</div>
              {chart.kind === "bar" ? <BarChart chart={chart} /> : <LineChart chart={chart} />}
              {chart.note && <div className="chart-card-note">{chart.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
