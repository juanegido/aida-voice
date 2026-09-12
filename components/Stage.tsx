"use client";

import { Caption } from "@/components/Caption";
import { ChartHero } from "@/components/charts/ChartHero";
import { Filmstrip } from "@/components/Filmstrip";
import type { ChartSpec } from "@/lib/chart-tool";
import type { ToolCallEntry } from "@/lib/use-realtime";

export function Stage({
  charts,
  focusedId,
  onFocus,
  userText,
  assistantText,
  assistantFinal,
  toolCalls,
}: {
  charts: ChartSpec[];
  focusedId: string;
  onFocus: (id: string) => void;
  userText: string | null;
  assistantText: string | null;
  assistantFinal: boolean;
  toolCalls: ToolCallEntry[];
}) {
  const focused = charts.find((c) => c.id === focusedId) ?? charts[0];

  return (
    <div className="stage">
      <div className="stage-hero">{focused && <ChartHero chart={focused} />}</div>
      <Caption
        userText={userText}
        assistantText={assistantText}
        assistantFinal={assistantFinal}
        note={focused?.note}
        toolCalls={toolCalls}
      />
      <Filmstrip charts={charts} focusedId={focused?.id ?? ""} onFocus={onFocus} />
    </div>
  );
}
