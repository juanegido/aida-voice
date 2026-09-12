"use client";

import { KIND_GLYPH } from "@/components/charts/ChartHero";
import type { ChartSpec } from "@/lib/chart-tool";

export function Filmstrip({
  charts,
  focusedId,
  onFocus,
}: {
  charts: ChartSpec[];
  focusedId: string;
  onFocus: (id: string) => void;
}) {
  if (charts.length <= 1) return null;

  return (
    <div className="filmstrip">
      {charts.map((chart) => (
        <button
          type="button"
          key={chart.id}
          className="filmstrip-card"
          data-active={chart.id === focusedId}
          onClick={() => onFocus(chart.id)}
        >
          <span className="filmstrip-kind" aria-hidden="true">
            {KIND_GLYPH[chart.kind]}
          </span>
          <span className="filmstrip-title">{chart.title}</span>
        </button>
      ))}
    </div>
  );
}
