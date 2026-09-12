"use client";

import type { ChartSpec } from "@/lib/chart-tool";
import { formatMetric } from "@/lib/format";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 360;
const PADDING = { top: 24, right: 20, bottom: 40, left: 56 };

function truncateLabel(label: string, max = 12): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

export function BarChart({ chart }: { chart: ChartSpec }) {
  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;
  const hasCompare = chart.series.some((p) => p.previous !== undefined);
  const maxValue = Math.max(
    ...chart.series.map((p) => Math.max(p.value, p.previous ?? 0)),
    1,
  );
  const n = chart.series.length;
  const slot = plotWidth / n;
  const barWidth = Math.min(48, slot * (hasCompare ? 0.32 : 0.6));
  const gap = hasCompare ? Math.min(8, barWidth * 0.3) : 0;

  const gridFractions = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      className="chart-svg chart-svg-bar"
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
      {chart.series.map((point, i) => {
        const barHeight = (point.value / maxValue) * plotHeight;
        const centerX = PADDING.left + slot * i + slot / 2;
        const x = hasCompare ? centerX - barWidth - gap / 2 : centerX - barWidth / 2;
        const y = PADDING.top + plotHeight - barHeight;
        const prevHeight = point.previous !== undefined ? (point.previous / maxValue) * plotHeight : 0;
        const prevX = centerX + gap / 2;
        const prevY = PADDING.top + plotHeight - prevHeight;
        return (
          <g key={`${point.label}-${i}`} className="chart-bar-group">
            <rect
              className="chart-bar"
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 1)}
              rx={4}
            />
            <text className="chart-value-label" x={x + barWidth / 2} y={y - 6} textAnchor="middle">
              {formatMetric(point.value, chart.metricKind, { compact: true, unit: chart.unit })}
            </text>
            {point.previous !== undefined && (
              <rect
                className="chart-bar chart-bar-compare"
                x={prevX}
                y={prevY}
                width={barWidth}
                height={Math.max(prevHeight, 1)}
                rx={4}
              />
            )}
            <text x={centerX} y={VIEW_HEIGHT - PADDING.bottom + 18} textAnchor="middle">
              <title>{point.label}</title>
              {truncateLabel(point.label)}
            </text>
          </g>
        );
      })}
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
