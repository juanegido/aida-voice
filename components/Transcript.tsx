"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/lib/use-realtime";

export function Transcript({ entries }: { entries: TranscriptEntry[] }) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div className="panel">
      <h2 className="panel-title">Transcript</h2>
      <div className="transcript-panel" ref={listRef}>
        {entries.length === 0 ? (
          <p className="transcript-empty">Start talking and the conversation will appear here.</p>
        ) : (
          entries.map((entry) => (
            <div className="transcript-entry" data-role={entry.role} key={entry.id}>
              {entry.text}
              {!entry.final && entry.role === "assistant" && (
                <span className="transcript-caret" aria-hidden="true" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
