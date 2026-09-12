"use client";

import { AidaMark, AidaWordmark } from "@/components/AidaMark";
import { ChartPanel } from "@/components/ChartPanel";
import { ToolTrace } from "@/components/ToolTrace";
import { Transcript } from "@/components/Transcript";
import { VoiceOrb } from "@/components/VoiceOrb";
import { useRealtime } from "@/lib/use-realtime";

const STATUS_LABEL: Record<string, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  live: "Live",
  error: "Error",
};

export default function Home() {
  const { status, error, transcript, charts, toolCalls, start, stop } = useRealtime();

  const handleToggle = () => {
    if (status === "live" || status === "connecting") {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <AidaMark size={28} />
          <AidaWordmark />
        </div>
        <span className="status-pill" data-status={status}>
          <span className="status-pill-dot" aria-hidden="true" />
          {STATUS_LABEL[status]}
        </span>
      </header>

      <main className="app-main">
        <div className="app-column">
          <VoiceOrb status={status} error={error} onToggle={handleToggle} />
          <Transcript entries={transcript} />
        </div>
        <div className="app-column">
          <ChartPanel charts={charts} />
          <ToolTrace calls={toolCalls} />
        </div>
      </main>

      <footer className="app-footer">
        Answers grounded in Atida Data Foundation via the AIDA MCP gateway.
      </footer>
    </div>
  );
}
