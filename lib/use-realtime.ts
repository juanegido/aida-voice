"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChartSpec } from "@/lib/chart-tool";
import { parseChartSpec } from "@/lib/chart-tool";
import type {
  ErrorEvent,
  FunctionCallArgumentsDoneEvent,
  InputAudioTranscriptionCompletedEvent,
  McpCallArgumentsDoneEvent,
  McpCallFailedEvent,
  McpCallInProgressEvent,
  OutputAudioTranscriptDeltaEvent,
  OutputAudioTranscriptDoneEvent,
  OutputItemDoneEvent,
  RealtimeEvent,
} from "@/lib/realtime-events";

export type ConnectionStatus = "idle" | "connecting" | "live" | "error";

export type TranscriptEntry = {
  id: string;
  role: "user" | "assistant";
  text: string;
  final: boolean;
};

export type ToolCallStatus = "running" | "done" | "failed";

export type ToolCallEntry = {
  id: string;
  label: string;
  status: ToolCallStatus;
  args?: string;
  output?: string;
};

const MAX_CHARTS = 6;

export function useRealtime() {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [charts, setCharts] = useState<ChartSpec[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallEntry[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Remote MCP calls are executed by OpenAI, but the model does not resume on
  // its own: once the response is done and every MCP call has finished, the
  // client must send `response.create` so the model can use the results.
  const pendingMcpRef = useRef<Set<string>>(new Set());
  const responseActiveRef = useRef(false);
  const needsContinueRef = useRef(false);

  const continueAfterMcp = useCallback(() => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    if (!needsContinueRef.current) return;
    if (responseActiveRef.current || pendingMcpRef.current.size > 0) return;
    needsContinueRef.current = false;
    dc.send(JSON.stringify({ type: "response.create" }));
  }, []);

  const sendToolResult = useCallback((callId: string, result: unknown) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result),
        },
      }),
    );
    dc.send(JSON.stringify({ type: "response.create" }));
  }, []);

  const upsertToolCall = useCallback((id: string, patch: Partial<ToolCallEntry>) => {
    setToolCalls((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) {
        return [
          ...prev,
          {
            id,
            label: patch.label ?? "Data Foundation",
            status: patch.status ?? "running",
            args: patch.args,
            output: patch.output,
          },
        ];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case "conversation.item.input_audio_transcription.completed": {
          const { item_id, transcript: text } = event as InputAudioTranscriptionCompletedEvent;
          setTranscript((prev) => {
            const idx = prev.findIndex((e) => e.id === item_id);
            const entry: TranscriptEntry = { id: item_id, role: "user", text, final: true };
            if (idx === -1) return [...prev, entry];
            const next = [...prev];
            next[idx] = entry;
            return next;
          });
          break;
        }
        case "response.output_audio_transcript.delta": {
          const { item_id, delta } = event as OutputAudioTranscriptDeltaEvent;
          setTranscript((prev) => {
            const idx = prev.findIndex((e) => e.id === item_id);
            if (idx === -1) {
              return [...prev, { id: item_id, role: "assistant", text: delta, final: false }];
            }
            const next = [...prev];
            next[idx] = { ...next[idx], text: next[idx].text + delta, final: false };
            return next;
          });
          break;
        }
        case "response.output_audio_transcript.done": {
          const { item_id, transcript: text } = event as OutputAudioTranscriptDoneEvent;
          setTranscript((prev) => {
            const idx = prev.findIndex((e) => e.id === item_id);
            const entry: TranscriptEntry = { id: item_id, role: "assistant", text, final: true };
            if (idx === -1) return [...prev, entry];
            const next = [...prev];
            next[idx] = entry;
            return next;
          });
          break;
        }
        case "response.function_call_arguments.done": {
          const { call_id, name, arguments: args } = event as FunctionCallArgumentsDoneEvent;
          if (name === "render_chart") {
            let parsed: ChartSpec | null = null;
            try {
              parsed = parseChartSpec(JSON.parse(args));
            } catch {
              parsed = null;
            }
            if (parsed) {
              setCharts((prev) => [parsed as ChartSpec, ...prev].slice(0, MAX_CHARTS));
              sendToolResult(call_id, { ok: true });
            } else {
              sendToolResult(call_id, { ok: false, error: "invalid chart spec" });
            }
          } else if (name === "clear_charts") {
            setCharts([]);
            sendToolResult(call_id, { ok: true });
          } else {
            // The model guessed a tool name (typically before the MCP tool
            // list arrived). Steer it back to the remote MCP tools.
            sendToolResult(call_id, {
              ok: false,
              error: `Unknown tool "${name}". Use the data_foundation MCP tools instead.`,
            });
          }
          break;
        }
        case "response.created": {
          responseActiveRef.current = true;
          break;
        }
        case "response.done": {
          responseActiveRef.current = false;
          continueAfterMcp();
          break;
        }
        case "response.mcp_call.in_progress": {
          const { item_id } = event as McpCallInProgressEvent;
          pendingMcpRef.current.add(item_id);
          needsContinueRef.current = true;
          upsertToolCall(item_id, { label: "Data Foundation", status: "running" });
          break;
        }
        case "response.mcp_call.failed": {
          const { item_id } = event as McpCallFailedEvent;
          pendingMcpRef.current.delete(item_id);
          upsertToolCall(item_id, { status: "failed" });
          continueAfterMcp();
          break;
        }
        case "response.mcp_call_arguments.done": {
          const { item_id, arguments: args } = event as McpCallArgumentsDoneEvent;
          upsertToolCall(item_id, { args });
          break;
        }
        case "response.output_item.done": {
          const { item } = event as OutputItemDoneEvent;
          if (item.type === "mcp_call") {
            pendingMcpRef.current.delete(item.id);
            upsertToolCall(item.id, {
              label: item.name ?? "Data Foundation",
              status: item.error ? "failed" : "done",
              args: item.arguments,
              output: item.output,
            });
            continueAfterMcp();
          }
          break;
        }
        case "error": {
          const { error: err } = event as ErrorEvent;
          // Non-fatal: the session stays live, just surface the message.
          setError(err.message);
          break;
        }
        default:
          break;
      }
    },
    [sendToolResult, upsertToolCall, continueAfterMcp],
  );

  const cleanup = useCallback(() => {
    pendingMcpRef.current.clear();
    responseActiveRef.current = false;
    needsContinueRef.current = false;
    dcRef.current?.close();
    dcRef.current = null;
    micRef.current?.getTracks().forEach((t) => t.stop());
    micRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    try {
      const sessionRes = await fetch("/api/session", { method: "POST" });
      const sessionJson = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionJson.error ?? "Failed to create realtime session");
      }
      const token: string | undefined = sessionJson.value ?? sessionJson.client_secret?.value;
      if (!token) {
        throw new Error("Realtime session response did not include a client secret");
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
      };

      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = mic;
      mic.getTracks().forEach((t) => pc.addTrack(t, mic));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.addEventListener("message", (e) => {
        try {
          handleEvent(JSON.parse(e.data));
        } catch {
          // Ignore malformed events.
        }
      });
      dc.addEventListener("open", () => setStatus("live"));
      dc.addEventListener("close", () => setStatus("idle"));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/sdp",
        },
      });
      if (!sdpRes.ok) {
        throw new Error(await sdpRes.text());
      }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      cleanup();
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to start voice session");
    }
  }, [cleanup, handleEvent]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const lastAssistant = useMemo(() => {
    for (let i = transcript.length - 1; i >= 0; i--) {
      const entry = transcript[i];
      if (entry.role === "assistant") return { text: entry.text, final: entry.final };
    }
    return null;
  }, [transcript]);

  const lastUser = useMemo(() => {
    for (let i = transcript.length - 1; i >= 0; i--) {
      const entry = transcript[i];
      if (entry.role === "user") return entry.text;
    }
    return null;
  }, [transcript]);

  return {
    status,
    error,
    transcript,
    charts,
    toolCalls,
    start,
    stop,
    lastAssistant,
    lastUser,
  };
}
