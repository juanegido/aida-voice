"use client";

import type { ChartSpec } from "@/lib/chart-tool";
import { formatMetric, truncateLabel } from "@/lib/format";

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 130;
const STROKE = 44;
const MAX_SLICES = 8;

const PALETTE_VARS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];

function polarToCartesian(radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad),
  };
}

function arcPath(startAngle: number, endAngle: number): string {
  const start = polarToCartesian(RADIUS, endAngle);
  const end = polarToCartesian(RADIUS, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function PieChart({ chart }: { chart: ChartSpec }) {
  let slices = chart.series;
  if (slices.length > MAX_SLICES) {
    const top = slices.slice(0, MAX_SLICES - 1);
    const restTotal = slices.slice(MAX_SLICES - 1).reduce((sum, p) => sum + p.value, 0);
    slices = [...top, { label: "Other", value: restTotal }];
  }

  const total = slices.reduce((sum, p) => sum + p.value, 0) || 1;
  let cursor = 0;
  const arcs = slices.map((point, i) => {
    const fraction = point.value / total;
    const startAngle = cursor * 360;
    cursor += fraction;
    const endAngle = cursor * 360;
    return {
      point,
      path: arcPath(startAngle, endAngle),
      color: `var(${PALETTE_VARS[i % PALETTE_VARS.length]})`,
      share: fraction,
    };
  });

  const largest = arcs.reduce((max, a) => (a.point.value > max.point.value ? a : max), arcs[0]);

  return (
    <div className="pie-chart-wrap">
      <svg
        className="chart-svg chart-svg-pie"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={chart.title}
      >
        {arcs.map((arc, i) => (
          <path
            key={`${arc.point.label}-${i}`}
            d={arc.path}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE}
          />
        ))}
        <text className="pie-center-value" x={CENTER} y={CENTER - 6} textAnchor="middle">
          {formatMetric(total, chart.metricKind, { compact: true, unit: chart.unit })}
        </text>
        <text className="pie-center-label" x={CENTER} y={CENTER + 16} textAnchor="middle">
          {slices.length === 1 ? slices[0].label : `${(largest.share * 100).toFixed(0)}% ${largest.point.label}`}
        </text>
      </svg>
      <ul className="pie-legend">
        {arcs.map((arc, i) => (
          <li key={`${arc.point.label}-${i}`} className="pie-legend-row">
            <span className="pie-legend-swatch" style={{ background: arc.color }} aria-hidden="true" />
            <span className="pie-legend-label" title={arc.point.label}>
              {truncateLabel(arc.point.label, 20)}
            </span>
            <span className="pie-legend-value">
              {formatMetric(arc.point.value, chart.metricKind, { compact: true, unit: chart.unit })}
            </span>
            <span className="pie-legend-share">{(arc.share * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
