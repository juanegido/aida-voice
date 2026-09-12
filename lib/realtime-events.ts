/**
 * Minimal typing for the OpenAI Realtime server events this app reacts to.
 * The Realtime API emits many more event types; anything we don't handle
 * falls through the `RealtimeEvent` union's generic member.
 */

export type InputAudioTranscriptionCompletedEvent = {
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  transcript: string;
  [key: string]: unknown;
};

export type OutputAudioTranscriptDeltaEvent = {
  type: "response.output_audio_transcript.delta";
  response_id: string;
  item_id: string;
  delta: string;
  [key: string]: unknown;
};

export type OutputAudioTranscriptDoneEvent = {
  type: "response.output_audio_transcript.done";
  item_id: string;
  transcript: string;
  [key: string]: unknown;
};

export type FunctionCallArgumentsDoneEvent = {
  type: "response.function_call_arguments.done";
  call_id: string;
  name: string;
  arguments: string;
  [key: string]: unknown;
};

export type McpCallInProgressEvent = {
  type: "response.mcp_call.in_progress";
  item_id: string;
  [key: string]: unknown;
};

export type McpCallFailedEvent = {
  type: "response.mcp_call.failed";
  item_id: string;
  [key: string]: unknown;
};

export type OutputItemDoneItem = {
  id: string;
  type: string;
  name?: string;
  arguments?: string;
  output?: string;
  error?: unknown;
  server_label?: string;
  [key: string]: unknown;
};

export type OutputItemDoneEvent = {
  type: "response.output_item.done";
  item: OutputItemDoneItem;
  [key: string]: unknown;
};

export type McpCallArgumentsDoneEvent = {
  type: "response.mcp_call_arguments.done";
  item_id: string;
  arguments: string;
  [key: string]: unknown;
};

export type ErrorEvent = {
  type: "error";
  error: { message: string; [key: string]: unknown };
  [key: string]: unknown;
};

export type UnknownRealtimeEvent = {
  type: string;
  [key: string]: unknown;
};

export type RealtimeEvent =
  | InputAudioTranscriptionCompletedEvent
  | OutputAudioTranscriptDeltaEvent
  | OutputAudioTranscriptDoneEvent
  | FunctionCallArgumentsDoneEvent
  | McpCallInProgressEvent
  | McpCallFailedEvent
  | OutputItemDoneEvent
  | McpCallArgumentsDoneEvent
  | ErrorEvent
  | UnknownRealtimeEvent;
