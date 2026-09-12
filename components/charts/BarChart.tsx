"use client";

import type { ChartSpec } from "@/lib/chart-tool";
import { formatMetric, niceTicks, truncateLabel } from "@/lib/format";

const VIEW_WIDTH = 880;
const VIEW_HEIGHT = 320;
const PADDING = { top: 28, right: 24, bottom: 52, left: 70 };

const FONT_SIZE = 10;
const LABEL_CHAR_WIDTH = 0.62;

function estimateLabelWidth(label: string, fontSize = FONT_SIZE): number {
  return label.length * LABEL_CHAR_WIDTH * fontSize;
}

/**
 * Tries to fit a label within `maxWidth` by splitting it onto two lines at
 * its most balanced space. Returns null when the label has no space to split
 * on, or when even the best split still overflows - the caller should then
 * fall back to a different layout (horizontal bars) rather than overlap.
 */
function tryWrapToFit(label: string, maxWidth: number, fontSize = FONT_SIZE): string[] | null {
  if (estimateLabelWidth(label, fontSize) <= maxWidth) return [label];
  const words = label.split(" ");
  if (words.length < 2) return null;
  let bestIdx = 1;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  const line1 = words.slice(0, bestIdx).join(" ");
  const line2 = words.slice(bestIdx).join(" ");
  if (estimateLabelWidth(line1, fontSize) <= maxWidth && estimateLabelWidth(line2, fontSize) <= maxWidth) {
    return [line1, line2];
  }
  return null;
}

export function BarChart({ chart }: { chart: ChartSpec }) {
  const n = chart.series.length;
  const vertPlotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const vertSlot = n > 0 ? vertPlotWidth / n : vertPlotWidth;
  const labelBudget = vertSlot - 8;
  const wrappedLabels = chart.series.map((p) => tryWrapToFit(p.label, labelBudget));
  const horizontal = n > 6 || wrappedLabels.some((w) => w === null);

  if (horizontal) return <HorizontalBarChart chart={chart} />;
  return <VerticalBarChart chart={chart} wrappedLabels={wrappedLabels as string[][]} />;
}

function VerticalBarChart({ chart, wrappedLabels }: { chart: ChartSpec; wrappedLabels: string[][] }) {
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
  const slot = plotWidth / n;
  const barWidth = Math.min(64, slot * (hasCompare ? 0.32 : 0.6));
  const gap = hasCompare ? Math.min(10, barWidth * 0.3) : 0;
  const labelY = VIEW_HEIGHT - PADDING.bottom + 18;

  return (
    <svg
      className="chart-svg chart-svg-bar"
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
      {chart.series.map((point, i) => {
        const barHeight = (point.value / niceMax) * plotHeight;
        const centerX = PADDING.left + slot * i + slot / 2;
        const x = hasCompare ? centerX - barWidth - gap / 2 : centerX - barWidth / 2;
        const y = PADDING.top + plotHeight - barHeight;
        const prevHeight = point.previous !== undefined ? (point.previous / niceMax) * plotHeight : 0;
        const prevX = centerX + gap / 2;
        const prevY = PADDING.top + plotHeight - prevHeight;
        const lines = wrappedLabels[i] ?? [truncateLabel(point.label, 14)];
        return (
          <g key={`${point.label}-${i}`} className="chart-bar-group">
            <rect
              className="chart-bar"
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 3)}
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
                height={Math.max(prevHeight, 3)}
                rx={4}
              />
            )}
            <text x={centerX} y={labelY} textAnchor="middle">
              <title>{point.label}</title>
              {lines.map((line, li) => (
                <tspan key={li} x={centerX} dy={li === 0 ? 0 : 12}>
                  {line}
                </tspan>
              ))}
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

/**
 * One row per category, label on the left, bar growing right. Used for
 * rankings with many categories or long labels, where vertical bars would
 * overlap their x-axis labels or shrink long-tail values to illegible
 * slivers.
 */
function HorizontalBarChart({ chart }: { chart: ChartSpec }) {
  const hasCompare = chart.series.some((p) => p.previous !== undefined);
  const maxValue = Math.max(
    ...chart.series.map((p) => Math.max(p.value, p.previous ?? 0)),
    1,
  );
  const ticks = niceTicks(maxValue, 4);
  const niceMax = ticks[ticks.length - 1] || 1;

  return (
    <div className="bar-chart-h" role="img" aria-label={chart.title}>
      <div className="bar-chart-h-rows">
        {chart.series.map((point, i) => {
          const pct = Math.min(100, (point.value / niceMax) * 100);
          const comparePct =
            point.previous !== undefined ? Math.min(100, (point.previous / niceMax) * 100) : null;
          const insideLabel = pct > 80;
          const valueText = formatMetric(point.value, chart.metricKind, {
            compact: true,
            unit: chart.unit,
          });
          return (
            <div className="bar-row-h" key={`${point.label}-${i}`}>
              <div className="bar-row-h-label" title={point.label}>
                {truncateLabel(point.label, 22)}
              </div>
              <div className="bar-row-h-bars">
                <div className="bar-row-h-track">
                  <div className="bar-row-h-bar" style={{ width: `max(3px, ${pct}%)` }}>
                    {insideLabel && (
                      <span className="bar-row-h-value bar-row-h-value-inside">{valueText}</span>
                    )}
                  </div>
                  {!insideLabel && (
                    <span
                      className="bar-row-h-value bar-row-h-value-outside"
                      style={{ left: `max(3px, ${pct}%)` }}
                    >
                      {valueText}
                    </span>
                  )}
                </div>
                {comparePct !== null && (
                  <div className="bar-row-h-compare-track">
                    <div
                      className="bar-row-h-compare-bar"
                      style={{ width: `max(3px, ${comparePct}%)` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {hasCompare && (
        <div className="bar-chart-h-legend">
          <span className="bar-chart-h-legend-item">
            <span className="chart-legend-swatch-html" aria-hidden="true" />
            {chart.seriesLabel ?? "Current"}
          </span>
          <span className="bar-chart-h-legend-item">
            <span className="chart-legend-swatch-html chart-legend-swatch-html-compare" aria-hidden="true" />
            {chart.compareLabel ?? "Previous"}
          </span>
        </div>
      )}
    </div>
  );
}
