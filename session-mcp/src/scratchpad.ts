/**
 * Session Scratchpad — persistent operational context store.
 *
 * State lives in .gsd/integration/session-scratchpad.json.
 * On snapshot, a human-readable dump is written to SESSION-LAST.md.
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ── Types ────────────────────────────────────────────────────

export interface SessionNote {
  tag: string;
  text: string;
  at: string; // ISO timestamp
}

export interface FileTrack {
  file: string;
  action: "started" | "done" | "read";
  at: string;
}

export interface Checkpoint {
  label: string;
  at: string;
}

export interface ScratchpadState {
  sessionId: string;
  startedAt: string;
  notes: SessionNote[];
  files: FileTrack[];
  checkpoints: Checkpoint[];
  lastActivity: string;
}

// ── Paths ────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(
  process.env.ERP_PROJECT_ROOT || process.cwd()
);

const GSD_DIR = path.join(PROJECT_ROOT, ".gsd", "integration");
const SCRATCHPAD_PATH = path.join(GSD_DIR, "session-scratchpad.json");
const HANDOFF_PATH = path.join(GSD_DIR, "HANDOFF.md");
const STATE_PATH = path.join(PROJECT_ROOT, ".planning", "STATE.md");
const SESSION_LAST_PATH = path.join(GSD_DIR, "SESSION-LAST.md");

// ── Helpers ──────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function now(): string {
  return new Date().toISOString();
}

function emptyState(sessionId: string): ScratchpadState {
  const ts = now();
  return {
    sessionId,
    startedAt: ts,
    notes: [],
    files: [],
    checkpoints: [],
    lastActivity: ts,
  };
}

// ── Read / Write ─────────────────────────────────────────────

export function load(): ScratchpadState {
  ensureDir(GSD_DIR);
  if (!fs.existsSync(SCRATCHPAD_PATH)) {
    const fresh = emptyState(`sess_${Date.now().toString(36)}`);
    save(fresh);
    return fresh;
  }
  try {
    const raw = fs.readFileSync(SCRATCHPAD_PATH, "utf-8");
    return JSON.parse(raw) as ScratchpadState;
  } catch {
    const fresh = emptyState(`sess_${Date.now().toString(36)}`);
    save(fresh);
    return fresh;
  }
}

export function save(state: ScratchpadState): void {
  ensureDir(GSD_DIR);
  state.lastActivity = now();
  fs.writeFileSync(SCRATCHPAD_PATH, JSON.stringify(state, null, 2), "utf-8");
}

// ── Operations ───────────────────────────────────────────────

export function addNote(state: ScratchpadState, tag: string, text: string): ScratchpadState {
  state.notes.push({ tag, text, at: now() });
  return state;
}

export function trackFile(state: ScratchpadState, file: string, action: FileTrack["action"]): ScratchpadState {
  // Remove previous track for same file+action to avoid duplicates
  state.files = state.files.filter(f => !(f.file === file && f.action === action));
  state.files.push({ file, action, at: now() });
  return state;
}

export function addCheckpoint(state: ScratchpadState, label: string): ScratchpadState {
  state.checkpoints.push({ label, at: now() });
  return state;
}

export function searchNotes(state: ScratchpadState, query: string): SessionNote[] {
  const q = query.toLowerCase();
  return state.notes.filter(
    n => n.tag.toLowerCase().includes(q) || n.text.toLowerCase().includes(q)
  );
}

// ── Bootstrap context readers ────────────────────────────────

export interface BootstrapContext {
  handoff: string;
  state: string;
  handoffSummary: string;
  stateSummary: string;
  projectRoot: string;
}

export function readBootstrapContext(): BootstrapContext {
  let handoff = "";
  let stateMd = "";

  try {
    handoff = fs.readFileSync(HANDOFF_PATH, "utf-8");
  } catch {
    handoff = "HANDOFF.md not found";
  }

  try {
    stateMd = fs.readFileSync(STATE_PATH, "utf-8");
  } catch {
    stateMd = "STATE.md not found";
  }

  // Extract key summaries
  const handoffSummary = extractSummary(handoff, [
    "Что за проект",
    "Дорожная карта",
    "Что делать дальше",
  ]);

  const stateSummary = extractSummary(stateMd, [
    "Active Milestone",
    "Active Phase",
    "progress",
    "Current Position",
  ]);

  return {
    handoff,
    state: stateMd,
    handoffSummary,
    stateSummary,
    projectRoot: PROJECT_ROOT,
  };
}

function extractSummary(md: string, keywords: string[]): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (keywords.some(k => trimmed.includes(k))) {
      inSection = true;
    }
    if (inSection) {
      result.push(line);
      if (trimmed === "" && result.length > 3) {
        inSection = false;
      }
    }
    if (result.length > 40) break;
  }

  return result.join("\n") || md.slice(0, 2000);
}

// ── Snapshot to Markdown ─────────────────────────────────────

export function writeSnapshot(state: ScratchpadState, bootstrap: BootstrapContext): string {
  ensureDir(GSD_DIR);

  const lines: string[] = [
    "# Session Snapshot",
    "",
    `**Session:** ${state.sessionId}`,
    `**Started:** ${state.startedAt}`,
    `**Last activity:** ${state.lastActivity}`,
    `**Notes:** ${state.notes.length} | **Files tracked:** ${state.files.length} | **Checkpoints:** ${state.checkpoints.length}`,
    "",
    "## Bootstrap Summary",
    "",
    "### From HANDOFF.md",
    "",
    "```",
    bootstrap.handoffSummary.slice(0, 3000),
    "```",
    "",
    "### From STATE.md",
    "",
    "```",
    bootstrap.stateSummary.slice(0, 2000),
    "```",
    "",
    "## Checkpoints",
    "",
  ];

  if (state.checkpoints.length === 0) {
    lines.push("*(none)*");
  } else {
    for (const cp of state.checkpoints) {
      lines.push(`- [${cp.at}] **${cp.label}**`);
    }
  }

  lines.push("", "## File Activity", "");
  if (state.files.length === 0) {
    lines.push("*(none)*");
  } else {
    // Group by file
    const byFile = new Map<string, FileTrack[]>();
    for (const f of state.files) {
      const list = byFile.get(f.file) || [];
      list.push(f);
      byFile.set(f.file, list);
    }
    for (const [file, tracks] of byFile) {
      const statuses = tracks.map(t => `${t.action} (${t.at.slice(11, 19)})`).join(", ");
      lines.push(`- \`${file}\`: ${statuses}`);
    }
  }

  lines.push("", "## Notes", "");
  if (state.notes.length === 0) {
    lines.push("*(none)*");
  } else {
    // Group by tag
    const byTag = new Map<string, SessionNote[]>();
    for (const n of state.notes) {
      const list = byTag.get(n.tag) || [];
      list.push(n);
      byTag.set(n.tag, list);
    }
    for (const [tag, notes] of byTag) {
      lines.push(`### ${tag}`);
      for (const n of notes) {
        lines.push(`- [${n.at.slice(11, 19)}] ${n.text}`);
      }
      lines.push("");
    }
  }

  const content = lines.join("\n");
  fs.writeFileSync(SESSION_LAST_PATH, content, "utf-8");
  return content;
}
