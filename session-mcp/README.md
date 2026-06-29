# Session MCP Server

**ERP «ПРО Мебель»** — operational context persistence between tool calls and sessions.

## Why

Claude/ZCode loses context between tool calls and sessions. This causes:
- Re-reading files already examined (wasted calls)
- Forgetting decisions made 10 steps ago
- No structured handoff between sessions

Session MCP stores a scratchpad in `.gsd/integration/session-scratchpad.json` and dumps human-readable snapshots to `SESSION-LAST.md`.

## Quick Start

```bash
cd session-mcp
npm install
npm run build
npm start
```

The server runs on stdio — connect it to ZCode via whatever MCP configuration mechanism ZCode uses.

## Tools

| Tool | When to use |
|------|-------------|
| `session_start` | FIRST call of every session. Reads HANDOFF+STATE, returns bootstrap context |
| `session_note` | Remember findings, decisions, blockers |
| `session_track` | Mark file as started/done/read |
| `session_recall` | Find earlier notes by keyword |
| `session_snapshot` | End of session: dump to SESSION-LAST.md |
| `session_checkpoint` | Mark milestone completion |

## Storage

- `.gsd/integration/session-scratchpad.json` — machine-readable state
- `.gsd/integration/SESSION-LAST.md` — human-readable snapshot

## Configuration

Set env var `ERP_PROJECT_ROOT` to override the project directory. Default: two levels up from the server's cwd (i.e., the repo root).
