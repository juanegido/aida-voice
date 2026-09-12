# AIDA Voice

Talk to your company data.

AIDA Voice is a minimal voice interface for Atida managers: ask a question out loud, get an
answer grounded in the company's live sales, marketing, and pricing data, and see a chart draw
itself on screen while the agent keeps talking.

## Why voice, why here

- Managers are on the move — between meetings, on the shop floor, in a car — and a voice
  question is faster than opening a dashboard.
- The environment worth talking to is the company's own data: sales, trading days, marketing
  spend, pricing, stock. Voice only earns its place when the answer is real.
- Zero tool backend: every data call is executed by OpenAI itself against a remote MCP server,
  so this app never runs a query and never sees a warehouse credential.

## How it works

```
Browser (WebRTC audio + data channel)
        |
        v
OpenAI Realtime (gpt-realtime)
        |
        |  remote MCP tool call
        v
AIDA MCP gateway  (https://aida.atida.com/api/mcp/g/<slug>/mcp, bearer auth, per-user data policy)
        |
        v
Data Foundation MCP
        |
        v
Data warehouse
```

Two client-side function tools, `render_chart` and `clear_charts`, are executed directly in the
browser: the model calls them over the WebRTC data channel, the UI draws (or clears) a chart,
and the browser replies with a small JSON ack — no server round trip.

## Run it

```bash
pnpm install
cp .env.example .env.local
# fill in OPENAI_API_KEY, DATA_FOUNDATION_MCP_URL, DATA_FOUNDATION_MCP_TOKEN
pnpm dev
```

Open http://localhost:3000, allow microphone access, and tap the orb to start talking.

## Demo script

1. "How did sales close yesterday?"
2. "Show me the top 5 categories this week versus last week."
3. "Which SKUs are out of stock in Spain right now?"
4. "How is the current marketing spend trending this month?"
5. "Clear the charts and tell me one thing I should look at today."

## Built during the hackathon

Everything in this repository: the voice UI (orb, transcript, chart panel, tool trace), the
session route that mints ephemeral Realtime credentials and wires up the remote MCP tool, the
two client-side chart tools and their renderer, and the system prompt.

## Reused

- The AIDA brand mark and wordmark.
- The existing AIDA MCP gateway and Data Foundation MCP as infrastructure — this app adds no
  tools of its own, it only points the model at what already exists.
- The WebRTC handshake pattern, adapted from AIDA's existing voice mode.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes | Used server-side only, to mint short-lived Realtime client secrets. Never sent to the browser. |
| `DATA_FOUNDATION_MCP_URL` | yes | Connector URL for the Data Foundation MCP, from the MCP card in AIDA. |
| `DATA_FOUNDATION_MCP_TOKEN` | yes | Static gateway API key, scoped to Data Foundation, from `/settings/mcp-tokens` in AIDA. |
| `OPENAI_REALTIME_MODEL` | no | Defaults to `gpt-realtime`. |
| `OPENAI_REALTIME_VOICE` | no | Defaults to `marin`. |

## Notes on eligibility

This app contributes a new, working voice surface on top of infrastructure Atida already runs
in production (the AIDA MCP gateway and Data Foundation MCP); it reuses that infrastructure the
same way any other MCP client would, and adds no code to either of them — the voice UI, the
session-minting route, the remote MCP wiring, the client-side chart tools, and the prompt are
all new work written for this hackathon.

## Next

- Move to GPT-Live for full-duplex conversation instead of push-to-talk-style turns.
- Let the agent draw simple diagrams, not just bar/line charts.
- Deliver answers to Slack, with an explicit confirmation step before anything is sent.
