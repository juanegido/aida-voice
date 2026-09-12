"use client";

import { BarChart } from "@/components/charts/BarChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { KpiTiles } from "@/components/charts/KpiTiles";
import { LineChart } from "@/components/charts/LineChart";
import { PieChart } from "@/components/charts/PieChart";
import type { ChartKind, ChartSpec } from "@/lib/chart-tool";

export const KIND_GLYPH: Record<ChartKind, string> = {
  bar: "▤",
  line: "📈",
  pie: "◔",
  kpi: "#",
  funnel: "▽",
};

export function ChartHero({ chart }: { chart: ChartSpec }) {
  return (
    <div className="chart-hero" key={chart.id} data-kind={chart.kind}>
      <div className="chart-hero-head">
        <span className="chart-hero-kind" aria-hidden="true">
          {KIND_GLYPH[chart.kind]}
        </span>
        <h2 className="chart-hero-title">{chart.title}</h2>
      </div>
      <div className="chart-hero-body">
        {chart.kind === "kpi" && <KpiTiles chart={chart} />}
        {chart.kind === "bar" && <BarChart chart={chart} />}
        {chart.kind === "line" && <LineChart chart={chart} />}
        {chart.kind === "pie" && <PieChart chart={chart} />}
        {chart.kind === "funnel" && <FunnelChart chart={chart} />}
      </div>
    </div>
  );
}
