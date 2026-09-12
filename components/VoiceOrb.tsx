"use client";

import { AidaMark } from "@/components/AidaMark";
import type { ConnectionStatus } from "@/lib/use-realtime";

const SUGGESTED_PROMPTS = [
  "How did sales close yesterday?",
  "Top 5 categories this week vs last week",
  "Which SKUs are out of stock in Spain?",
];

const LABELS: Record<ConnectionStatus, string> = {
  idle: "Tap to talk",
  connecting: "Connecting…",
  live: "Listening — tap to end",
  error: "Tap to try again",
};

export function VoiceOrb({
  status,
  error,
  onToggle,
}: {
  status: ConnectionStatus;
  error: string | null;
  onToggle: () => void;
}) {
  return (
    <div className="orb-panel">
      <button
        type="button"
        className="voice-orb"
        data-status={status}
        onClick={onToggle}
        aria-label={LABELS[status]}
      >
        <AidaMark size={56} />
      </button>
      <div className="voice-orb-label">{LABELS[status]}</div>
      {error && <div className="voice-orb-error">{error}</div>}
      {status === "idle" && (
        <div className="voice-orb-chips">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <span className="voice-orb-chip" key={prompt}>
              {prompt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
