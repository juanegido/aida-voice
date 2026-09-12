"use client";

import type { ToolCallEntry } from "@/lib/use-realtime";

function truncate(text: string | undefined, max = 400): string | undefined {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function ToolTrace({ calls }: { calls: ToolCallEntry[] }) {
  return (
    <div className="panel">
      <h2 className="panel-title">Data Foundation calls</h2>
      {calls.length === 0 ? (
        <p className="tool-trace-empty">No data calls yet.</p>
      ) : (
        <div className="tool-trace-list">
          {calls.map((call) => (
            <div className="tool-trace-card" key={call.id}>
              <div className="tool-trace-label">
                <span className="tool-trace-dot" data-status={call.status} aria-hidden="true" />
                {call.label}
              </div>
              <details>
                <summary>Details</summary>
                {call.args && <pre>{truncate(call.args)}</pre>}
                {call.output && <pre>{truncate(call.output)}</pre>}
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
