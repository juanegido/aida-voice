/**
 * Client-side function tool definitions offered to the OpenAI Realtime API,
 * plus the type and validator for the chart data the model sends us.
 *
 * The model calls these tools itself (they never touch a server): the app
 * renders the result locally and replies with a small JSON ack over the
 * WebRTC data channel. See lib/use-realtime.ts.
 */

export const RENDER_CHART_TOOL = {
  type: "function",
  name: "render_chart",
  description:
    "Render a chart on the screen the user is looking at. Call this whenever your answer " +
    "contains a time series, a ranking, or a comparison between a few items, right after " +
    "you get the numbers back from a Data Foundation tool call. Keep talking normally while " +
    "the chart renders in the background - do not wait for it before continuing the answer. " +
    "Use real numbers only, never placeholders.",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short chart title, e.g. 'Sales by category, last 7 days'.",
      },
      kind: {
        type: "string",
        enum: ["bar", "line"],
        description: "Use 'bar' for rankings/comparisons, 'line' for trends over time.",
      },
      unit: {
        type: "string",
        description: "Optional unit shown next to values, e.g. '€', '%', 'orders'.",
      },
      series: {
        type: "array",
        minItems: 2,
        maxItems: 24,
        description: "The data points to plot, in the order they should appear.",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Point label, e.g. a date or a category name." },
            value: { type: "number", description: "Numeric value for this point." },
          },
          required: ["label", "value"],
        },
      },
      note: {
        type: "string",
        description: "Optional one-line insight to show under the chart, e.g. 'Peaked on Tuesday'.",
      },
    },
    required: ["title", "kind", "series"],
  },
} as const;

export const CLEAR_CHARTS_TOOL = {
  type: "function",
  name: "clear_charts",
  description:
    "Clear every chart currently shown on screen. Call this when the user changes topic " +
    "and asks to clear the view, or explicitly asks to remove the charts.",
  parameters: {
    type: "object",
    properties: {},
  },
} as const;

export type ChartPoint = {
  label: string;
  value: number;
};

export type ChartSpec = {
  id: string;
  title: string;
  kind: "bar" | "line";
  unit?: string;
  series: ChartPoint[];
  note?: string;
};

function toFiniteNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * Manually validates and coerces a raw `render_chart` tool-call payload into
 * a ChartSpec. Returns null when the payload cannot be salvaged into a
 * renderable chart (no zod - this is the app's only external input shape).
 */
export function parseChartSpec(raw: unknown): ChartSpec | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  const title = typeof obj.title === "string" && obj.title.trim() !== "" ? obj.title.trim() : null;
  if (!title) return null;

  const kind = obj.kind === "bar" || obj.kind === "line" ? obj.kind : null;
  if (!kind) return null;

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
    series.push({ label, value });
  }

  if (series.length < 2) return null;
  const bounded = series.slice(0, 24);

  const unit = typeof obj.unit === "string" && obj.unit.trim() !== "" ? obj.unit.trim() : undefined;
  const note = typeof obj.note === "string" && obj.note.trim() !== "" ? obj.note.trim() : undefined;

  return {
    id: `chart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    kind,
    unit,
    series: bounded,
    note,
  };
}
