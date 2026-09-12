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
browser: the model calls them over the WebRTC data channel, the UI draws (or clears) a visual,
and the browser replies with a small JSON ack — no server round trip.

## Visuals

As soon as the agent renders a visual, the page switches into **stage mode**: the visual takes
most of the screen, the assistant's speech becomes a large caption underneath it, and the
transcript and tool trace move into a history drawer. Before any visual exists, the page stays
in a simplified **conversation mode** — a centered voice orb, suggested prompts, and the caption.

Five visual kinds, picked by the model based on the shape of the answer:

- **kpi** — 1 to 4 headline numbers, each with an optional delta chip against a `previous` value.
- **funnel** — a step sequence that narrows down (sessions → carts → checkouts → orders), with
  the conversion rate between consecutive steps and the overall conversion in the header.
- **pie** — a share/mix of a whole, as a donut with a side legend (label, value, share %).
- **line** — a trend over dates, with an optional dashed comparison series.
- **bar** — a ranking or comparison between a few items, with an optional muted comparison bar.

Every visual sets a `metricKind` (`currency`, `percent`, `count`, `ratio`) so numbers format
consistently, and fills `previous` on each point whenever the underlying report returned a
comparison column — that is what powers the delta chips and comparison bars/lines. All charts
share a 5-color palette and render as viewBox-based SVG with an entrance animation.

Add `?demo=1` to the URL to seed three visuals (a KPI row, a bar ranking, and a funnel) plus a
sample caption without connecting a voice session — useful for screenshots and the demo video.

## Run it

```bash
pnpm install
cp .env.example .env.local
# fill in OPENAI_API_KEY, DATA_FOUNDATION_MCP_URL, DATA_FOUNDATION_MCP_TOKEN
pnpm dev
```

Open http://localhost:3000, allow microphone access, and tap the orb to start talking.

## Demo script

1. "How did sales close yesterday?" — the screen switches to stage mode with a **KPI** row
   (revenue, orders, conversion, AOV), each with a delta chip against the same day last week.
2. "Show me the top 5 categories this week versus last week." — a **bar** chart ranks categories
   with a muted comparison bar per item.
3. "Where do we lose customers in checkout?" — a **funnel** from sessions down to orders, with
   the drop-off between each step called out.
4. "Which SKUs are out of stock in Spain right now?"
5. "How is the current marketing spend trending this month?"
6. "Clear the charts and tell me one thing I should look at today." — back to conversation mode.

## Built during the hackathon

Everything in this repository: the voice UI (stage layout, voice orb, caption, filmstrip,
history drawer with transcript and tool trace), the session route that mints ephemeral Realtime
credentials and wires up the remote MCP tool, the two client-side visual tools and their five
chart renderers, and the system prompt.

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
