import { NextRequest } from "next/server";
import { buildInstructions } from "@/lib/instructions";
import { CLEAR_CHARTS_TOOL, RENDER_CHART_TOOL } from "@/lib/chart-tool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionRequestBody = {
  voice?: string;
  language?: string;
};

export async function POST(req: NextRequest) {
  const missing: string[] = [];
  if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (!process.env.DATA_FOUNDATION_MCP_URL) missing.push("DATA_FOUNDATION_MCP_URL");
  if (!process.env.DATA_FOUNDATION_MCP_TOKEN) missing.push("DATA_FOUNDATION_MCP_TOKEN");

  if (missing.length > 0) {
    return Response.json({ error: `Missing env: ${missing.join(", ")}` }, { status: 500 });
  }

  let body: SessionRequestBody = {};
  try {
    const raw = await req.text();
    if (raw) body = JSON.parse(raw) as SessionRequestBody;
  } catch {
    body = {};
  }
  const { voice, language } = body;

  try {
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime",
          instructions: buildInstructions({ language }),
          tools: [
            {
              type: "mcp",
              server_label: "data_foundation",
              server_url: process.env.DATA_FOUNDATION_MCP_URL,
              authorization: process.env.DATA_FOUNDATION_MCP_TOKEN,
              require_approval: "never",
            },
            RENDER_CHART_TOOL,
            CLEAR_CHARTS_TOOL,
          ],
          audio: {
            input: { transcription: { model: "whisper-1" } },
            output: { voice: voice ?? process.env.OPENAI_REALTIME_VOICE ?? "marin" },
          },
        },
      }),
    });

    return new Response(r.body, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create realtime session";
    return Response.json({ error: message }, { status: 500 });
  }
}
