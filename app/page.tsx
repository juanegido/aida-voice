"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AidaMark, AidaWordmark } from "@/components/AidaMark";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { LiveOrb } from "@/components/LiveOrb";
import { Stage } from "@/components/Stage";
import { VoiceOrb } from "@/components/VoiceOrb";
import type { ChartSpec } from "@/lib/chart-tool";
import { DEMO_CAPTION, DEMO_CHARTS } from "@/lib/demo";
import { useRealtime } from "@/lib/use-realtime";

const STATUS_LABEL: Record<string, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  live: "Live",
  error: "Error",
};

function useDemoSeed(): { charts: ChartSpec[]; user: string | null; assistant: string | null } {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  return useMemo(() => {
    if (!isDemo) return { charts: [], user: null, assistant: null };
    return { charts: DEMO_CHARTS, user: DEMO_CAPTION.user, assistant: DEMO_CAPTION.assistant };
  }, [isDemo]);
}

function HomeContent() {
  const { status, error, transcript, charts, toolCalls, start, stop, lastAssistant, lastUser } =
    useRealtime();
  const demo = useDemoSeed();

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeCharts = charts.length > 0 ? charts : demo.charts;
  const userText = lastUser ?? demo.user;
  const assistantText = lastAssistant?.text ?? demo.assistant;
  const assistantFinal = lastAssistant?.final ?? true;
  const isStage = activeCharts.length > 0;

  useEffect(() => {
    if (activeCharts.length === 0) {
      setFocusedId(null);
      return;
    }
    if (!focusedId || !activeCharts.some((c) => c.id === focusedId)) {
      setFocusedId(activeCharts[0].id);
    }
  }, [activeCharts, focusedId]);

  const handleToggle = () => {
    if (status === "live" || status === "connecting") {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="app-shell" data-mode={isStage ? "stage" : "conversation"}>
      <header className="app-header">
        <div className="app-header-brand">
          <AidaMark size={28} />
          <AidaWordmark />
        </div>
        <div className="app-header-actions">
          <button type="button" className="ghost-button" onClick={() => setHistoryOpen(true)}>
            History
          </button>
          {isStage && <LiveOrb status={status} onToggle={handleToggle} />}
          <span className="status-pill" data-status={status}>
            <span className="status-pill-dot" aria-hidden="true" />
            {STATUS_LABEL[status]}
          </span>
        </div>
      </header>

      {isStage ? (
        <main className="app-main app-main-stage">
          <Stage
            charts={activeCharts}
            focusedId={focusedId ?? activeCharts[0].id}
            onFocus={setFocusedId}
            userText={userText}
            assistantText={assistantText}
            assistantFinal={assistantFinal}
            toolCalls={toolCalls}
          />
        </main>
      ) : (
        <main className="app-main app-main-conversation">
          <div className="conversation-panel">
            <VoiceOrb status={status} error={error} onToggle={handleToggle} />
            {assistantText && (
              <p className="conversation-caption">
                {assistantText}
                {!assistantFinal && <span className="transcript-caret" aria-hidden="true" />}
              </p>
            )}
            {toolCalls.length > 0 && (
              <div className="caption-tools conversation-tools">
                {toolCalls.slice(-4).map((call) => (
                  <span className="caption-tool-chip" key={call.id} data-status={call.status}>
                    <span className="caption-tool-dot" aria-hidden="true" />
                    {call.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        transcript={transcript}
        toolCalls={toolCalls}
      />

      <footer className="app-footer">
        Answers grounded in Atida Data Foundation via the AIDA MCP gateway.
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
