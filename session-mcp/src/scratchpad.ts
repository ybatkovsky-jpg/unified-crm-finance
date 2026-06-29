/**
 * Session Scratchpad — project-agnostic operational context store.
 *
 * Stores state in .session/scratchpad.json (auto-created).
 * On snapshot, writes .session/SESSION-LAST.md.
 *
 * Bootstrap auto-discovers context files in the project root:
 *   README.md, .planning/*.md, .gsd/**\/*.md, docs/*.md, TODO.md, CHANGELOG.md
 *
 * Set env SESSION_CONTEXT_FILES to override: "HANDOFF.md,STATE.md"
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ── Types ────────────────────────────────────────────────────

export interface SessionNote {
  tag: string;
  text: string;
  at: string;
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
  projectName: string;
  startedAt: string;
  notes: SessionNote[];
  files: FileTrack[];
  checkpoints: Checkpoint[];
  lastActivity: string;
}

export interface BootstrapContext {
  projectName: string;
  projectRoot: string;
  contextFiles: { path: string; content: string; summary: string }[];
  combinedSummary: string;
}

// ── Path resolution ──────────────────────────────────────────

const PROJECT_ROOT = path.resolve(process.cwd());
const SESSION_DIR = path.join(PROJECT_ROOT, ".session");
const SCRATCHPAD_PATH = path.join(SESSION_DIR, "scratchpad.json");
const SNAPSHOT_PATH = path.join(SESSION_DIR, "SESSION-LAST.md");

// ── Helpers ──────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function now(): string {
  return new Date().toISOString();
}

function projectName(): string {
  // Try package.json name first
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf-8"));
    if (pkg.name) return pkg.name;
  } catch { /* ignore */ }
  // Fall back to directory name
  return path.basename(PROJECT_ROOT);
}

function emptyState(): ScratchpadState {
  const ts = now();
  return {
    sessionId: `sess_${Date.now().toString(36)}`,
    projectName: projectName(),
    startedAt: ts,
    notes: [],
    files: [],
    checkpoints: [],
    lastActivity: ts,
  };
}

// ── Read / Write ─────────────────────────────────────────────

export function load(): ScratchpadState {
  ensureDir(SESSION_DIR);
  if (!fs.existsSync(SCRATCHPAD_PATH)) {
    const fresh = emptyState();
    save(fresh);
    return fresh;
  }
  try {
    return JSON.parse(fs.readFileSync(SCRATCHPAD_PATH, "utf-8")) as ScratchpadState;
  } catch {
    const fresh = emptyState();
    save(fresh);
    return fresh;
  }
}

export function save(state: ScratchpadState): void {
  ensureDir(SESSION_DIR);
  state.lastActivity = now();
  fs.writeFileSync(SCRATCHPAD_PATH, JSON.stringify(state, null, 2), "utf-8");
}

// ── Operations ───────────────────────────────────────────────

export function addNote(state: ScratchpadState, tag: string, text: string): ScratchpadState {
  state.notes.push({ tag, text, at: now() });
  return state;
}

export function trackFile(state: ScratchpadState, file: string, action: FileTrack["action"]): ScratchpadState {
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

// ── Context auto-discovery ───────────────────────────────────

const CONTEXT_DIRS = [
  ".",
  ".planning",
  ".gsd",
  "docs",
];

function findContextFiles(): string[] {
  // Allow override via env: comma-separated relative paths
  if (process.env.SESSION_CONTEXT_FILES) {
    return process.env.SESSION_CONTEXT_FILES.split(",").map(s => s.trim()).filter(Boolean);
  }

  const results: string[] = [];

  // Always check root MD files
  for (const file of ["README.md", "TODO.md", "CHANGELOG.md", "CONTRIBUTING.md"]) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      results.push(file);
    }
  }

  // Recursively find MD files in context directories
  for (const dir of CONTEXT_DIRS) {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) continue;
    collectMdFiles(dirPath, dir, results);
  }

  return [...new Set(results)];
}

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", ".turbo",
  ".session", "__pycache__", ".venv", "vendor", "coverage",
]);

function collectMdFiles(dirPath: string, relativePrefix: string, results: string[]): void {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith(".") && !["gsd", "planning"].includes(entry.name.slice(1))) continue;
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = (relativePrefix + "/" + entry.name).replace(/^\.\//, "");
      if (entry.isDirectory()) {
        // Limit recursion depth
        const depth = relativePath.split("/").length;
        if (depth > 5) continue;
        collectMdFiles(fullPath, relativePath, results);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(relativePath.replace(/\\/g, "/"));
      }
    }
  } catch { /* skip permission errors */ }
}

export function readBootstrapContext(): BootstrapContext {
  const files = findContextFiles();

  // Prioritize key context files for the summary
  const priorityPatterns = [
    /HANDOFF/i, /STATE/i, /README/i, /PRODUCT.SPEC/i, /REQUIREMENTS/i,
    /ROADMAP/i, /TODO/i, /CONTEXT/i,
  ];

  const contextFiles = files.map(relativePath => {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    let content = "";
    try {
      content = fs.readFileSync(fullPath, "utf-8");
    } catch {
      content = `[Could not read ${relativePath}]`;
    }
    // Determine priority: lower = more important
    let priority = 99;
    for (let i = 0; i < priorityPatterns.length; i++) {
      if (priorityPatterns[i].test(relativePath)) {
        priority = i;
        break;
      }
    }
    return { path: relativePath, content, priority };
  });

  // Sort by priority, take top 8 for summary
  const sorted = contextFiles.sort((a, b) => a.priority - b.priority);
  const topFiles = sorted.slice(0, 8);

  // Build combined summary: 500 chars per file, capped at 4000 total
  const parts: string[] = [];
  let totalChars = 0;
  for (const f of topFiles) {
    const excerpt = f.content.slice(0, 500);
    parts.push(`### ${f.path}\n${excerpt}`);
    totalChars += excerpt.length;
    if (totalChars > 4000) break;
  }

  return {
    projectName: projectName(),
    projectRoot: PROJECT_ROOT,
    contextFiles: sorted.slice(0, 30).map(f => ({ path: f.path, content: f.content, summary: f.content.slice(0, 300) })),
    combinedSummary: parts.join("\n\n") || "No context files found. Add README.md or set SESSION_CONTEXT_FILES env var.",
  };
}

// ── Snapshot ─────────────────────────────────────────────────

export function writeSnapshot(state: ScratchpadState, bootstrap: BootstrapContext): string {
  ensureDir(SESSION_DIR);

  const lines: string[] = [
    `# Session Snapshot — ${bootstrap.projectName}`,
    "",
    `**Session:** ${state.sessionId}`,
    `**Started:** ${state.startedAt}`,
    `**Last activity:** ${state.lastActivity}`,
    `**Notes:** ${state.notes.length} | **Files:** ${state.files.length} | **Checkpoints:** ${state.checkpoints.length}`,
    "",
    "## Context Files Found",
    "",
  ];

  for (const cf of bootstrap.contextFiles) {
    lines.push(`- \`${cf.path}\` (${cf.content.length} chars)`);
  }

  lines.push("", "## Checkpoints", "");
  if (state.checkpoints.length === 0) {
    lines.push("*(none)*");
  } else {
    for (const cp of state.checkpoints) {
      lines.push(`- [${cp.at.slice(11, 19)}] **${cp.label}**`);
    }
  }

  lines.push("", "## File Activity", "");
  if (state.files.length === 0) {
    lines.push("*(none)*");
  } else {
    const byFile = new Map<string, FileTrack[]>();
    for (const f of state.files) byFile.set(f.file, [...(byFile.get(f.file) || []), f]);
    for (const [file, tracks] of byFile) {
      lines.push(`- \`${file}\`: ${tracks.map(t => `${t.action} (${t.at.slice(11, 19)})`).join(", ")}`);
    }
  }

  lines.push("", "## Notes", "");
  if (state.notes.length === 0) {
    lines.push("*(none)*");
  } else {
    const byTag = new Map<string, SessionNote[]>();
    for (const n of state.notes) byTag.set(n.tag, [...(byTag.get(n.tag) || []), n]);
    for (const [tag, notes] of byTag) {
      lines.push(`### ${tag}`);
      for (const n of notes) lines.push(`- [${n.at.slice(11, 19)}] ${n.text}`);
      lines.push("");
    }
  }

  const content = lines.join("\n");
  fs.writeFileSync(SNAPSHOT_PATH, content, "utf-8");
  return content;
}
