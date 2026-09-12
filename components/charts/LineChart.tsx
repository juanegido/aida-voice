"use client";

import type { ChartSpec } from "@/lib/chart-tool";
import { formatMetric, niceTicks, truncateLabel } from "@/lib/format";

const VIEW_WIDTH = 880;
const VIEW_HEIGHT = 320;
const PADDING = { top: 28, right: 48, bottom: 40, left: 70 };
const MAX_X_LABELS = 8;

export function LineChart({ chart }: { chart: ChartSpec }) {
  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
  const hasCompare = chart.series.some((p) => p.previous !== undefined);
  const maxValue = Math.max(
    ...chart.series.map((p) => Math.max(p.value, p.previous ?? 0)),
    1,
  );
  const ticks = niceTicks(maxValue, 4);
  const niceMax = ticks[ticks.length - 1] || 1;
  const n = chart.series.length;
  const step = n > 1 ? plotWidth / (n - 1) : 0;
  // Show at most MAX_X_LABELS labels (every nth), always including the first
  // and last point so the visible range is never ambiguous.
  const labelStep = n > MAX_X_LABELS ? Math.ceil((n - 1) / (MAX_X_LABELS - 1)) : 1;
  const shownLabelIndices = new Set<number>();
  for (let i = 0; i < n; i += labelStep) shownLabelIndices.add(i);
  if (n > 0) shownLabelIndices.add(n - 1);

  const points = chart.series.map((point, i) => {
    const x = PADDING.left + step * i;
    const y = PADDING.top + plotHeight - (point.value / niceMax) * plotHeight;
    const prevY =
      point.previous !== undefined
        ? PADDING.top + plotHeight - (point.previous / niceMax) * plotHeight
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

  return (
    <svg
      className="chart-svg chart-svg-line"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={chart.title}
    >
      {ticks.slice(1).map((tick) => {
        const y = PADDING.top + plotHeight * (1 - tick / niceMax);
        return (
          <g key={tick}>
            <line className="chart-gridline" x1={PADDING.left} x2={VIEW_WIDTH - PADDING.right} y1={y} y2={y} />
            <text x={PADDING.left - 8} y={y + 3} textAnchor="end">
              {formatMetric(tick, chart.metricKind, { compact: true, unit: chart.unit })}
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
          {shownLabelIndices.has(i) && (
            <text x={x} y={VIEW_HEIGHT - PADDING.bottom + 18} textAnchor="middle">
              <title>{point.label}</title>
              {truncateLabel(point.label, 12)}
            </text>
          )}
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
