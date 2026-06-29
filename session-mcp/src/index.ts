/**
 * Session MCP Server — project-agnostic operational context.
 *
 * Auto-discovers project context files (README.md, .planning/*.md,
 * .gsd/**\/*.md, docs/*.md, etc.) and stores session scratchpad in
 * .session/scratchpad.json.
 *
 * Works with ANY project — no hardcoded paths.
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

const server = new Server(
  { name: "session-context", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "session_start",
      description:
        "Call this FIRST at the start of every session. Auto-discovers " +
        "project context files (README.md, .planning/*.md, .gsd/**/*.md, " +
        "docs/*.md, TODO.md, etc.) and returns a combined bootstrap summary. " +
        "Initializes the session scratchpad. Use this instead of manually " +
        "reading project files — saves context window. " +
        "Set env SESSION_CONTEXT_FILES to override discovery: " +
        "\"HANDOFF.md,STATE.md\"",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "session_note",
      description:
        "Write a tagged note into the session scratchpad. " +
        "Tags: 'files_read', 'decision', 'todo', 'blocker', 'progress', " +
        "'error', 'api_test'. The scratchpad persists across tool calls. " +
        "Be specific — include file paths, IDs, decisions made.",
      inputSchema: {
        type: "object",
        properties: {
          tag: { type: "string", description: "Category tag" },
          text: { type: "string", description: "Note content. Be specific." },
        },
        required: ["tag", "text"],
      },
    },
    {
      name: "session_track",
      description:
        "Mark a file as 'started', 'done', or 'read'. Builds an activity " +
        "log to avoid re-reading files. Call BEFORE editing and AFTER finishing. " +
        "File path should be relative to project root.",
      inputSchema: {
        type: "object",
        properties: {
          file: { type: "string", description: "Relative path from project root" },
          action: { type: "string", enum: ["started", "done", "read"] },
        },
        required: ["file", "action"],
      },
    },
    {
      name: "session_recall",
      description:
        "Search session notes by keyword (case-insensitive). Returns matching " +
        "notes with tags and timestamps. Use to find earlier decisions or context.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keyword" },
        },
        required: ["query"],
      },
    },
    {
      name: "session_snapshot",
      description:
        "Write full session context to .session/SESSION-LAST.md and return " +
        "a structured summary. Call at END of session or before commit. " +
        "Includes checkpoints, file activity, and notes grouped by tag.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "session_checkpoint",
      description:
        "Save a progress marker. Use when completing a major step. " +
        "Label should describe what was just COMPLETED. " +
        "Example: 'Step 3: API routes done'",
      inputSchema: {
        type: "object",
        properties: {
          label: { type: "string", description: "What was completed" },
        },
        required: ["label"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const state = load();

  switch (name) {
    case "session_start": {
      const bootstrap = readBootstrapContext();
      save(state);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            sessionId: state.sessionId,
            projectName: bootstrap.projectName,
            projectRoot: bootstrap.projectRoot,
            contextFilesFound: bootstrap.contextFiles.map(f => f.path),
            combinedSummary: bootstrap.combinedSummary,
            existingNotes: state.notes.length,
            existingCheckpoints: state.checkpoints.length,
            lastCheckpoint: state.checkpoints[state.checkpoints.length - 1] || null,
            instruction:
              "Session ready. Use session_note for findings, session_track for file work, " +
              "session_checkpoint for milestones, session_snapshot at end.",
          }, null, 2),
        }],
      };
    }

    case "session_note": {
      const tag = (args as any).tag;
      const text = (args as any).text;
      addNote(state, tag, text);
      save(state);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ ok: true, tag, totalNotes: state.notes.length }),
        }],
      };
    }

    case "session_track": {
      const file = (args as any).file;
      const action = (args as any).action;
      trackFile(state, file, action);
      save(state);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ ok: true, file, action, totalFiles: state.files.length }),
        }],
      };
    }

    case "session_recall": {
      const query = (args as any).query;
      const results = searchNotes(state, query);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            query, count: results.length,
            notes: results.map(n => ({ tag: n.tag, text: n.text, at: n.at })),
          }),
        }],
      };
    }

    case "session_snapshot": {
      const bootstrap = readBootstrapContext();
      writeSnapshot(state, bootstrap);
      save(state);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            ok: true,
            snapshotPath: ".session/SESSION-LAST.md",
            summary: {
              projectName: state.projectName,
              sessionId: state.sessionId,
              notes: state.notes.length,
              filesTracked: state.files.length,
              checkpoints: state.checkpoints.length,
              checkpointList: state.checkpoints.map(c => c.label),
            },
          }),
        }],
      };
    }

    case "session_checkpoint": {
      const label = (args as any).label;
      addCheckpoint(state, label);
      save(state);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            ok: true, label,
            totalCheckpoints: state.checkpoints.length,
            previousCheckpoint: state.checkpoints[state.checkpoints.length - 2]?.label || null,
          }),
        }],
      };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Session MCP v2.0 running on stdio");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
