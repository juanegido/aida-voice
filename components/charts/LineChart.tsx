"use client";

import type { ChartSpec } from "@/lib/chart-tool";
import { formatMetric } from "@/lib/format";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 360;
const PADDING = { top: 24, right: 48, bottom: 40, left: 56 };

function truncateLabel(label: string, max = 12): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

export function LineChart({ chart }: { chart: ChartSpec }) {
  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
  const hasCompare = chart.series.some((p) => p.previous !== undefined);
  const maxValue = Math.max(
    ...chart.series.map((p) => Math.max(p.value, p.previous ?? 0)),
    1,
  );
  const n = chart.series.length;
  const step = n > 1 ? plotWidth / (n - 1) : 0;

  const points = chart.series.map((point, i) => {
    const x = PADDING.left + step * i;
    const y = PADDING.top + plotHeight - (point.value / maxValue) * plotHeight;
    const prevY =
      point.previous !== undefined
        ? PADDING.top + plotHeight - (point.previous / maxValue) * plotHeight
        : null;
    return { x, y, prevY, point };
  });

  const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const comparePath = hasCompare
    ? points
        .filter((p) => p.prevY !== null)
        .map((p) => `${p.x},${p.prevY}`)
        .join(" ")
    : "";
  const baseline = PADDING.top + plotHeight;
  const areaPath = `${PADDING.left},${baseline} ${linePath} ${PADDING.left + step * (n - 1)},${baseline}`;
  const last = points[points.length - 1];
  const gridFractions = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      className="chart-svg chart-svg-line"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={chart.title}
    >
      {gridFractions.map((fraction) => {
        const y = PADDING.top + plotHeight * (1 - fraction);
        return (
          <g key={fraction}>
            <line className="chart-gridline" x1={PADDING.left} x2={VIEW_WIDTH - PADDING.right} y1={y} y2={y} />
            <text x={PADDING.left - 8} y={y + 3} textAnchor="end">
              {formatMetric(maxValue * fraction, chart.metricKind, { compact: true, unit: chart.unit })}
            </text>
          </g>
        );
      })}
      <polygon className="chart-area" points={areaPath} />
      {hasCompare && <polyline className="chart-line-compare" points={comparePath} />}
      <polyline className="chart-line" points={linePath} pathLength={100} />
      {points.map(({ x, y, point }, i) => (
        <g key={`${point.label}-${i}`}>
          <circle className="chart-point" cx={x} cy={y} r={3.5} />
          <text x={x} y={VIEW_HEIGHT - PADDING.bottom + 18} textAnchor="middle">
            <title>{point.label}</title>
            {truncateLabel(point.label)}
          </text>
        </g>
      ))}
      {last && (
        <text
          className="chart-value-label chart-line-last-label"
          x={last.x}
          y={last.y - 10}
          textAnchor="middle"
        >
          {formatMetric(last.point.value, chart.metricKind, { compact: true, unit: chart.unit })}
        </text>
      )}
      {hasCompare && (
        <g className="chart-legend" transform={`translate(${VIEW_WIDTH - PADDING.right - 160}, 4)`}>
          <rect className="chart-legend-swatch" x={0} y={0} width={10} height={10} rx={2} />
          <text x={16} y={9}>
            {chart.seriesLabel ?? "Current"}
          </text>
          <rect className="chart-legend-swatch chart-legend-swatch-compare" x={90} y={0} width={10} height={10} rx={2} />
          <text x={106} y={9}>
            {chart.compareLabel ?? "Previous"}
          </text>
        </g>
      )}
    </svg>
  );
}
