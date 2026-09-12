"use client";

import type { ChartSpec } from "@/lib/chart-tool";
import { formatMetric } from "@/lib/format";

export function FunnelChart({ chart }: { chart: ChartSpec }) {
  const first = chart.series[0];
  const maxValue = Math.max(...chart.series.map((p) => p.value), 1);
  const overall = first && first.value !== 0 ? chart.series[chart.series.length - 1].value / first.value : 0;

  return (
    <div className="funnel-chart" role="img" aria-label={chart.title}>
      <div className="funnel-header">
        <span>Step conversion</span>
        <span className="funnel-overall">
          Overall {chart.series.length > 1 ? (overall * 100).toFixed(1) : "100.0"}%
        </span>
      </div>
      <div className="funnel-rows">
        {chart.series.map((point, i) => {
          const widthPct = Math.max((point.value / maxValue) * 100, 4);
          const prevValue = i > 0 ? chart.series[i - 1].value : null;
          const stepConversion = prevValue && prevValue !== 0 ? point.value / prevValue : null;
          return (
            <div className="funnel-row" key={`${point.label}-${i}`}>
              <div className="funnel-row-label">{point.label}</div>
              <div className="funnel-row-track">
                <div className="funnel-row-bar" style={{ width: `${widthPct}%` }}>
                  <span className="funnel-row-value">
                    {formatMetric(point.value, chart.metricKind, { compact: true, unit: chart.unit })}
                  </span>
                </div>
              </div>
              {stepConversion !== null && (
                <div className="funnel-row-chip">↓ {(stepConversion * 100).toFixed(1)}%</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
