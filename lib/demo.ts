/**
 * Seed data used only when the page is loaded with `?demo=1` - lets us
 * screenshot and record the stage layout without an active voice session.
 * See app/page.tsx, gated behind a Suspense boundary (useSearchParams).
 */

import type { ChartSpec } from "@/lib/chart-tool";

export const DEMO_CAPTION = {
  user: "How did sales close yesterday?",
  assistant:
    "Yesterday closed at €184K in revenue, up 4.2% versus the same day last week, from the sales report.",
};

export const DEMO_CHARTS: ChartSpec[] = [
  {
    id: "demo-kpi",
    title: "Yesterday vs. same day last week",
    kind: "kpi",
    metricKind: "currency",
    compareLabel: "same day last week",
    series: [
      { label: "Revenue", value: 184320, previous: 176900 },
      { label: "Orders", value: 1781, previous: 1713, metricKind: "count" },
      { label: "Conversion", value: 0.031, previous: 0.029, metricKind: "percent" },
      { label: "AOV", value: 103.5, previous: 103.3 },
    ],
    note: "Revenue up 4.2% on the same day last week, driven by a higher conversion rate.",
  },
  {
    id: "demo-bar",
    title: "Top categories, this week vs last week",
    kind: "bar",
    metricKind: "currency",
    seriesLabel: "This week",
    compareLabel: "Last week",
    series: [
      { label: "Skincare", value: 42800, previous: 39100 },
      { label: "Vitamins", value: 35600, previous: 33900 },
      { label: "Baby care", value: 28100, previous: 29700 },
      { label: "Haircare", value: 21400, previous: 19800 },
      { label: "Sun care", value: 17300, previous: 12200 },
      { label: "Oral care", value: 12900, previous: 12500 },
    ],
    note: "Sun care is the fastest riser this week, up sharply on last week.",
  },
  {
    id: "demo-funnel",
    title: "Checkout funnel, yesterday",
    kind: "funnel",
    metricKind: "count",
    series: [
      { label: "Sessions", value: 58400 },
      { label: "Product views", value: 31200 },
      { label: "Add to cart", value: 6900 },
      { label: "Checkout", value: 2650 },
      { label: "Orders", value: 1781 },
    ],
    note: "The biggest drop is between product views and add to cart.",
  },
];
