"use client";

import { useEffect } from "react";
import { ToolTrace } from "@/components/ToolTrace";
import { Transcript } from "@/components/Transcript";
import type { ToolCallEntry, TranscriptEntry } from "@/lib/use-realtime";

export function HistoryDrawer({
  open,
  onClose,
  transcript,
  toolCalls,
}: {
  open: boolean;
  onClose: () => void;
  transcript: TranscriptEntry[];
  toolCalls: ToolCallEntry[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div className="history-scrim" data-open={open} onClick={onClose} aria-hidden="true" />
      <aside className="history-drawer" data-open={open} aria-hidden={!open}>
        <div className="history-drawer-head">
          <h2>History</h2>
          <button type="button" className="ghost-button" onClick={onClose} aria-label="Close history">
            ✕
          </button>
        </div>
        <div className="history-drawer-body">
          <Transcript entries={transcript} />
          <ToolTrace calls={toolCalls} />
        </div>
      </aside>
    </>
  );
}
