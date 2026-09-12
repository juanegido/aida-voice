"use client";

import type { ChartSpec } from "@/lib/chart-tool";
import { formatDelta, formatMetric } from "@/lib/format";

export function KpiTiles({ chart }: { chart: ChartSpec }) {
  return (
    <div className="kpi-tiles" role="img" aria-label={chart.title}>
      {chart.series.map((point, i) => {
        const kind = point.metricKind ?? chart.metricKind;
        const delta = point.previous !== undefined ? formatDelta(point.value, point.previous) : null;
        return (
          <div className="kpi-tile" key={`${point.label}-${i}`}>
            <div className="kpi-tile-label">{point.label}</div>
            <div className="kpi-tile-value">{formatMetric(point.value, kind, { unit: chart.unit })}</div>
            {delta && (
              <div className="kpi-tile-delta" data-direction={delta.direction}>
                <span className="kpi-tile-delta-arrow" aria-hidden="true">
                  {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "■"}
                </span>
                {delta.text} vs {chart.compareLabel ?? "previous period"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
