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
