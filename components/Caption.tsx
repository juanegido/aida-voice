"use client";

import type { ToolCallEntry } from "@/lib/use-realtime";

export function Caption({
  userText,
  assistantText,
  assistantFinal,
  note,
  toolCalls,
}: {
  userText: string | null;
  assistantText: string | null;
  assistantFinal: boolean;
  note?: string;
  toolCalls: ToolCallEntry[];
}) {
  return (
    <div className="caption-band">
      <div className="caption-main">
        {userText && (
          <div className="caption-user">
            <span className="caption-mic" aria-hidden="true">
              🎙
            </span>
            {userText}
          </div>
        )}
        {assistantText ? (
          <p className="caption-assistant">
            {assistantText}
            {!assistantFinal && <span className="transcript-caret" aria-hidden="true" />}
          </p>
        ) : (
          <p className="caption-assistant caption-assistant-empty">Listening for the next question…</p>
        )}
        {note && <p className="caption-note">{note}</p>}
      </div>
      {toolCalls.length > 0 && (
        <div className="caption-tools">
          {toolCalls.slice(-4).map((call) => (
            <span className="caption-tool-chip" key={call.id} data-status={call.status}>
              <span className="caption-tool-dot" aria-hidden="true" />
              {call.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
