/**
 * Client-side function tool definitions offered to the OpenAI Realtime API,
 * plus the type and validator for the visual data the model sends us.
 *
 * The model calls these tools itself (they never touch a server): the app
 * renders the result locally and replies with a small JSON ack over the
 * WebRTC data channel. See lib/use-realtime.ts.
 */

import type { MetricKind } from "@/lib/format";

export const RENDER_CHART_TOOL = {
  type: "function",
  name: "render_chart",
  description:
    "Render a visual on the screen the user is looking at. Every answer that contains numbers " +
    "should come with a visual - call this right after you get the numbers back from a Data " +
    "Foundation tool call, using the real numbers, never placeholders. The screen is part of " +
    "your answer: keep talking normally while the visual renders in the background, do not " +
    "wait for it before continuing. Pick `kind` by shape: 'kpi' for 1-4 headline numbers (a " +
    "revenue figure, an order count, a conversion rate) - include `previous` on each point when " +
    "the report has a comparison (e.g. an *_comp column); 'funnel' for a step sequence that " +
    "narrows down (sessions -> carts -> checkouts -> orders); 'pie' for a share or mix of a " +
    "whole; 'line' for a trend over dates; 'bar' for a ranking or a comparison between a few " +
    "items. Always set `metricKind` so numbers format correctly, and fill `previous` on every " +
    "point whenever the underlying report returned a comparison column. For 'kpi', a row often " +
    "mixes units (e.g. revenue in EUR next to an order count next to a conversion percent) - " +
    "set each point's own `metricKind` to override the chart-level one for that tile.",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short chart title, e.g. 'Sales by category, last 7 days'.",
      },
      kind: {
        type: "string",
        enum: ["bar", "line", "pie", "kpi", "funnel"],
        description:
          "'kpi' for 1-4 headline numbers, 'funnel' for a narrowing step sequence, 'pie' for " +
          "share/mix, 'line' for a trend over dates, 'bar' for a ranking or comparison.",
      },
      metricKind: {
        type: "string",
        enum: ["currency", "percent", "count", "ratio"],
        description:
          "How to format every value: 'currency' (EUR), 'percent' (0-1 or 0-100, both accepted), " +
          "'count' (plain number, optionally with `unit`), or 'ratio' (a plain decimal number " +
          "such as an average or an index). Defaults to 'count' - set this explicitly.",
      },
      unit: {
        type: "string",
        description:
          "Free-text suffix shown after the number, only used when metricKind is 'count', " +
          "e.g. 'orders', 'SKUs'.",
      },
      series: {
        type: "array",
        minItems: 1,
        maxItems: 24,
        description: "The data points to plot, in the order they should appear.",
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              description: "Point label, e.g. a date, a category name, or a funnel step name.",
            },
            value: { type: "number", description: "Current numeric value for this point." },
            previous: {
              type: "number",
              description:
                "Value for the same point in the comparison period, when the report returned one.",
            },
            metricKind: {
              type: "string",
              enum: ["currency", "percent", "count", "ratio"],
              description:
                "Only for kind='kpi': override the chart-level metricKind for this one tile, " +
                "since a KPI row often mixes units (e.g. revenue in EUR next to a conversion " +
                "percent). Omit to use the chart's metricKind.",
            },
          },
          required: ["label", "value"],
        },
      },
      seriesLabel: {
        type: "string",
        description: "Legend label for the current values, e.g. 'This week'.",
      },
      compareLabel: {
        type: "string",
        description:
          "Short name of the comparison period, shown after 'vs' in delta chips and legends, " +
          "e.g. 'same day last week' or 'last week'. Do not include the word 'vs'.",
      },
      note: {
        type: "string",
        description:
          "Optional one-line insight shown in the caption band, e.g. 'Peaked on Tuesday'.",
      },
      replace: {
        type: "boolean",
        description:
          "Set true to replace ALL visuals currently on screen with this one, which becomes the " +
          "new hero. Use this whenever the user asks to change, filter, or refine what they are " +
          "looking at - never call clear_charts and render_chart in the same turn for that. " +
          "Defaults to false, which adds this visual alongside the others (or updates one with " +
          "a matching title in place).",
      },
    },
    required: ["title", "kind", "series"],
  },
} as const;

export const CLEAR_CHARTS_TOOL = {
  type: "function",
  name: "clear_charts",
  description:
    "Clear every visual currently shown on screen and return to the plain conversation view. " +
    "Call this when the user changes topic and asks to clear the view, or explicitly asks to " +
    "remove the charts.",
  parameters: {
    type: "object",
    properties: {},
  },
} as const;

export type ChartKind = "bar" | "line" | "pie" | "kpi" | "funnel";

export type ChartPoint = {
  label: string;
  value: number;
  previous?: number;
  /**
   * Per-point override of the chart's metricKind. Only meaningful for
   * "kpi" (a row of headline numbers rarely shares one unit - e.g. revenue
   * in EUR next to an order count next to a conversion percent). Falls back
   * to the chart-level metricKind when omitted.
   */
  metricKind?: MetricKind;
};

export type ChartSpec = {
  id: string;
  title: string;
  kind: ChartKind;
  metricKind: MetricKind;
  unit?: string;
  series: ChartPoint[];
  seriesLabel?: string;
  compareLabel?: string;
  note?: string;
  /**
   * When true, this chart should replace ALL current visuals and become the
   * hero (see lib/use-realtime.ts). Not persisted meaningfully beyond the
   * moment it is applied - purely an instruction from the tool call.
   */
  replace?: boolean;
};

const CHART_KINDS: ChartKind[] = ["bar", "line", "pie", "kpi", "funnel"];
const METRIC_KINDS: MetricKind[] = ["currency", "percent", "count", "ratio"];

function toFiniteNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `chart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Manually validates and coerces a raw `render_chart` tool-call payload into
 * a ChartSpec. Returns null when the payload cannot be salvaged into a
 * renderable visual (no zod - this is the app's only external input shape).
 */
export function parseChartSpec(raw: unknown): ChartSpec | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  const title = typeof obj.title === "string" && obj.title.trim() !== "" ? obj.title.trim() : null;
  if (!title) return null;

  const kind = CHART_KINDS.includes(obj.kind as ChartKind) ? (obj.kind as ChartKind) : null;
  if (!kind) return null;

  const metricKind = METRIC_KINDS.includes(obj.metricKind as MetricKind)
    ? (obj.metricKind as MetricKind)
    : "count";

  if (!Array.isArray(obj.series)) return null;

  const series: ChartPoint[] = [];
  for (const item of obj.series) {
    if (typeof item !== "object" || item === null) continue;
    const point = item as Record<string, unknown>;
    const label =
      typeof point.label === "string"
        ? point.label
        : typeof point.label === "number"
          ? String(point.label)
          : null;
    const value = toFiniteNumber(point.value);
    if (label === null || value === null) continue;
    const previous = toFiniteNumber(point.previous) ?? undefined;
    const pointMetricKind = METRIC_KINDS.includes(point.metricKind as MetricKind)
      ? (point.metricKind as MetricKind)
      : undefined;
    series.push({ label, value, previous, metricKind: pointMetricKind });
  }

  const minPoints = kind === "kpi" || kind === "funnel" ? 1 : 2;
  if (series.length < minPoints) return null;
  const bounded = series.slice(0, 24);

  const unit = typeof obj.unit === "string" && obj.unit.trim() !== "" ? obj.unit.trim() : undefined;
  const note = typeof obj.note === "string" && obj.note.trim() !== "" ? obj.note.trim() : undefined;
  const seriesLabel =
    typeof obj.seriesLabel === "string" && obj.seriesLabel.trim() !== ""
      ? obj.seriesLabel.trim()
      : undefined;
  const compareLabel =
    typeof obj.compareLabel === "string" && obj.compareLabel.trim() !== ""
      ? obj.compareLabel.trim()
      : undefined;
  const replace = obj.replace === true;

  return {
    id: newId(),
    title,
    kind,
    metricKind,
    unit,
    series: bounded,
    seriesLabel,
    compareLabel,
    note,
    replace,
  };
}
