/**
 * Session MCP Server — operational context for ERP «ПРО Мебель»
 *
 * Stores session scratchpad between tool calls so the model doesn't
 * re-read files unnecessarily and can resume context across sessions.
 *
 * Tools:
 *   session_start    — read HANDOFF + STATE, return bootstrap context
 *   session_note     — write a tagged note
 *   session_track    — mark file work started/done/read
 *   session_recall   — search notes by keyword
 *   session_snapshot — dump context to SESSION-LAST.md
 *   session_checkpoint — save progress marker
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  load,
  save,
  addNote,
  trackFile,
  addCheckpoint,
  searchNotes,
  readBootstrapContext,
  writeSnapshot,
} from "./scratchpad.js";

// ── Server setup ─────────────────────────────────────────────

const server = new Server(
  {
    name: "erp-session-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ── Tool definitions ─────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "session_start",
      description:
        "Call this FIRST at the beginning of every session. " +
        "Reads HANDOFF.md and STATE.md from the ERP project, returns " +
        "a bootstrap summary: project context, current phase, progress, " +
        "and what to do next. Also initializes the session scratchpad. " +
        "Use this instead of reading those files manually — it's faster " +
        "and saves context window. Returns handoffSummary, stateSummary, " +
        "and projectRoot.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "session_note",
      description:
        "Write a tagged note into the session scratchpad. " +
        "Use this to remember what you've done: " +
        "tag='files_read' for files you've examined, " +
        "tag='decision' for architectural choices, " +
        "tag='todo' for pending items, " +
        "tag='blocker' for issues. " +
        "The scratchpad persists across tool calls within a session. " +
        "DO NOT use for trivial things — only information you'll need later.",
      inputSchema: {
        type: "object",
        properties: {
          tag: {
            type: "string",
            description:
              "Category tag: 'files_read', 'decision', 'todo', 'blocker', 'progress', 'error', 'api_test'",
          },
          text: {
            type: "string",
            description: "The note content. Be specific — include file paths, IDs, decisions made.",
          },
        },
        required: ["tag", "text"],
      },
    },
    {
      name: "session_track",
      description:
        "Mark a file as 'started' (you're about to edit it), " +
        "'done' (you've finished editing), or 'read' (you've examined it). " +
        "This builds an activity log that helps avoid re-reading files " +
        "unnecessarily. Call this BEFORE editing a file and AFTER finishing. " +
        "The track data appears in the snapshot for session continuity.",
      inputSchema: {
        type: "object",
        properties: {
          file: {
            type: "string",
            description: "Relative file path from project root, e.g. 'apps/web/src/lib/db/production.ts'",
          },
          action: {
            type: "string",
            enum: ["started", "done", "read"],
            description: "What you did with this file",
          },
        },
        required: ["file", "action"],
      },
    },
    {
      name: "session_recall",
      description:
        "Search session notes by keyword. Returns matching notes " +
        "with their tags and timestamps. Use this when you need to " +
        "find something you noted earlier — e.g. 'what did I decide " +
        "about the installation model?' The query matches against " +
        "both tags and note text.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search keyword — matches tag names and note text (case-insensitive)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "session_snapshot",
      description:
        "Write the full session context to SESSION-LAST.md " +
        "(human-readable markdown in .gsd/integration/) and return " +
        "a structured summary. Call this at the END of a session " +
        "or before a commit/push to preserve context for the next " +
        "session. The snapshot includes: checkpoints, file activity " +
        "log, and all tagged notes grouped by category.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "session_checkpoint",
      description:
        "Save a named progress marker. Use this when completing " +
        "a major step: 'phase 6 schema migration done', " +
        "'PROJ-08 API routes created', 'all smoke tests passed'. " +
        "Checkpoints appear in the snapshot and help with resumption. " +
        "The label should describe what was just COMPLETED.",
      inputSchema: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "What was just completed. Be specific: 'Step 3: PROJ-09 delivery API routes done'",
          },
        },
        required: ["label"],
      },
    },
  ],
}));

// ── Tool handlers ────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const state = load();

  switch (name) {
    case "session_start": {
      const bootstrap = readBootstrapContext();
      save(state);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                sessionId: state.sessionId,
                startedAt: state.startedAt,
                projectRoot: bootstrap.projectRoot,
                handoffSummary: bootstrap.handoffSummary,
                stateSummary: bootstrap.stateSummary,
                existingNotes: state.notes.length,
                existingCheckpoints: state.checkpoints.length,
                lastCheckpoint:
                  state.checkpoints.length > 0
                    ? state.checkpoints[state.checkpoints.length - 1]
                    : null,
                instruction:
                  "Session initialized. Use session_note to record findings, " +
                  "session_track to mark file work, session_checkpoint for milestones, " +
                  "and session_snapshot at the end.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "session_note": {
      const tag = (args as any).tag as string;
      const text = (args as any).text as string;
      addNote(state, tag, text);
      save(state);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ok: true,
              tag,
              text: text.slice(0, 100) + (text.length > 100 ? "..." : ""),
              totalNotes: state.notes.length,
            }),
          },
        ],
      };
    }

    case "session_track": {
      const file = (args as any).file as string;
      const action = (args as any).action as "started" | "done" | "read";
      trackFile(state, file, action);
      save(state);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ok: true,
              file,
              action,
              totalFilesTracked: state.files.length,
            }),
          },
        ],
      };
    }

    case "session_recall": {
      const query = (args as any).query as string;
      const results = searchNotes(state, query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query,
              count: results.length,
              notes: results.map((n) => ({
                tag: n.tag,
                text: n.text,
                at: n.at,
              })),
            }),
          },
        ],
      };
    }

    case "session_snapshot": {
      const bootstrap = readBootstrapContext();
      const snapshot = writeSnapshot(state, bootstrap);
      save(state);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ok: true,
              snapshotPath: ".gsd/integration/SESSION-LAST.md",
              summary: {
                sessionId: state.sessionId,
                notes: state.notes.length,
                filesTracked: state.files.length,
                checkpoints: state.checkpoints.length,
                lastActivity: state.lastActivity,
                checkpointList: state.checkpoints.map((c) => c.label),
              },
              instruction:
                "Snapshot written. The next session can read SESSION-LAST.md " +
                "for a human-readable summary or call session_start for bootstrap.",
            }),
          },
        ],
      };
    }

    case "session_checkpoint": {
      const label = (args as any).label as string;
      addCheckpoint(state, label);
      save(state);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ok: true,
              label,
              totalCheckpoints: state.checkpoints.length,
              previousCheckpoint:
                state.checkpoints.length > 1
                  ? state.checkpoints[state.checkpoints.length - 2].label
                  : null,
            }),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// ── Start ────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Session MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
