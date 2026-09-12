"use client";

import { AidaMark } from "@/components/AidaMark";
import type { ConnectionStatus } from "@/lib/use-realtime";

const LABELS: Record<ConnectionStatus, string> = {
  idle: "Tap to talk",
  connecting: "Connecting…",
  live: "Listening — tap to end",
  error: "Tap to try again",
};

export function LiveOrb({
  status,
  onToggle,
}: {
  status: ConnectionStatus;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="live-orb"
      data-status={status}
      onClick={onToggle}
      aria-label={LABELS[status]}
      title={LABELS[status]}
    >
      <AidaMark size={22} />
    </button>
  );
}
