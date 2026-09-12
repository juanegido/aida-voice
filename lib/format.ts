/**
 * Number formatting helpers shared by every chart. Kept dependency-free
 * (Intl.NumberFormat only) so metric formatting stays consistent across
 * KPI tiles, bars, lines, pies, and funnels.
 */

export type MetricKind = "currency" | "percent" | "count" | "ratio";

const percentFormatter = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});

const ratioFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

/**
 * Normalizes a percent value to the 0..1 range `Intl.NumberFormat` expects.
 * Models sometimes send "12.4" meaning 12.4%, instead of 0.124 - if the
 * magnitude looks like a 0-100 value, assume that and rescale.
 */
function normalizePercent(value: number): number {
  return Math.abs(value) > 1.5 ? value / 100 : value;
}

export function formatMetric(
  value: number,
  kind: MetricKind = "count",
  opts?: { compact?: boolean; unit?: string },
): string {
  const compact = opts?.compact ?? false;

  if (kind === "percent") {
    return percentFormatter.format(normalizePercent(value));
  }

  if (kind === "currency") {
    const currencyFormatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: "EUR",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : Math.abs(value) < 100 ? 2 : 0,
    });
    return currencyFormatter.format(value);
  }

  if (kind === "ratio") {
    return ratioFormatter.format(value);
  }

  const countFormatter = new Intl.NumberFormat("en", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  });
  const n = countFormatter.format(value);
  return opts?.unit ? `${n} ${opts.unit}` : n;
}

const NICE_STEP_MULTIPLES = [1, 2, 2.5, 5, 10];

/**
 * Standard "nice number" tick algorithm: picks a step from {1, 2, 2.5, 5}×10^n
 * so axis ticks read as round numbers (e.g. €500K, €1M, €1.5M, €2M) instead of
 * whatever `max / count` happens to divide into. Returns ascending tick values
 * from 0 up to the smallest nice number ≥ `max`.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];
  const rawStep = max / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceMultiple = NICE_STEP_MULTIPLES.find((m) => m >= normalized) ?? 10;
  const step = niceMultiple * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 1000; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

/**
 * Truncates a label to `max` characters, adding an ellipsis. Shared by every
 * chart so labels never overlap or overflow their allotted space; pair with a
 * native `title` attribute/element so the full text is still available.
 */
export function truncateLabel(label: string, max: number): string {
  if (label.length <= max) return label;
  return `${label.slice(0, Math.max(1, max - 1))}…`;
}

export type Delta = {
  text: string;
  direction: "up" | "down" | "flat";
};

/**
 * Percent change from `previous` to `current`, e.g. "+4.2%". Treats
 * anything under 0.05% absolute change as flat (avoids noisy "+0.0%").
 */
export function formatDelta(current: number, previous: number): Delta {
  if (previous === 0) {
    if (current === 0) return { text: "±0.0%", direction: "flat" };
    return { text: current > 0 ? "+100.0%" : "-100.0%", direction: current > 0 ? "up" : "down" };
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;

  if (Math.abs(change) < 0.05) {
    return { text: "±0.0%", direction: "flat" };
  }

  const sign = change > 0 ? "+" : "";
  const text = `${sign}${change.toFixed(1)}%`;
  return { text, direction: change > 0 ? "up" : "down" };
}
