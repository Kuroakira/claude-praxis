import * as fs from "node:fs";
import * as path from "node:path";
import { parseFileConfidence } from "./confidence-parser.js";

export interface PersistenceFileInfo {
  name: string;
  mtime: Date;
  entryCount?: number;
  avgConfirmed?: number;
  unverifiedCount?: number;
}

export interface CompoundLastRun {
  timestamp: string;
  promotedCount: number;
}

export interface ProgressSummary {
  entryCount: number;
  recentHeadings: string[];
}

export interface ConfidenceSummary {
  totalEntries: number;
  avgConfirmed: number;
  unverifiedCount: number;
}

export interface LastCompact {
  timestamp: string;
  compoundRun: boolean;
  progressSummary: ProgressSummary;
  confidenceSummary: ConfidenceSummary;
}

export interface ContextPressure {
  usedPercentage: number;
  timestamp: string;
  lastNotifiedLevel: "none" | "info" | "urgent";
}

const TRACKED_FILES = [
  "task_plan.md",
  "progress.md",
  "learnings.md",
  "learnings-feature-spec.md",
  "learnings-design.md",
  "learnings-coding.md",
  "compound-last-run.json",
  "last-compact.json",
  "context-pressure.json",
];

export function detectPersistenceFiles(
  contextDir: string,
  globalLearningsPath?: string,
): PersistenceFileInfo[] {
  const results: PersistenceFileInfo[] = [];

  if (fs.existsSync(contextDir)) {
    for (const name of TRACKED_FILES) {
      const filePath = path.join(contextDir, name);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        const info: PersistenceFileInfo = { name, mtime: stat.mtime };
        if (name === "progress.md" || name.startsWith("learnings-")) {
          const content = fs.readFileSync(filePath, "utf-8");
          info.entryCount = (content.match(/^## /gm) ?? []).length;
          if (name.startsWith("learnings-")) {
            const stats = parseFileConfidence(content);
            info.avgConfirmed = stats.avgConfirmed;
            info.unverifiedCount = stats.unverifiedCount;
          }
        }
        results.push(info);
      }
    }
  }

  if (globalLearningsPath && fs.existsSync(globalLearningsPath)) {
    const stat = fs.statSync(globalLearningsPath);
    results.push({ name: "global-learnings.md", mtime: stat.mtime });
  }

  return results;
}

export function trimProgressFile(filePath: string, maxEntries: number): void {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let entryCount = 0;
  let cutIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      entryCount++;
      if (entryCount === maxEntries + 1) {
        cutIndex = i;
        break;
      }
    }
  }

  if (cutIndex === -1) return;

  const trimmed = lines.slice(0, cutIndex).join("\n");
  fs.writeFileSync(filePath, trimmed);
}

export function updateCompactTimestamp(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf-8");
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const lines = content.split("\n");

  const lastCompactedIndex = lines.findIndex((line) =>
    line.startsWith("Last compacted:"),
  );

  if (lastCompactedIndex !== -1) {
    lines[lastCompactedIndex] = `Last compacted: ${timestamp}`;
  } else if (lines.length > 0) {
    lines.splice(1, 0, `Last compacted: ${timestamp}`);
  }

  fs.writeFileSync(filePath, lines.join("\n"));
}

function readJsonFile(filePath: string): unknown {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function writeJsonFile(dir: string, fileName: string, data: unknown): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2));
}

function isCompoundLastRun(data: unknown): data is CompoundLastRun {
  if (!isRecord(data)) return false;
  return typeof data.timestamp === "string" && typeof data.promotedCount === "number";
}

function isLastCompact(data: unknown): data is LastCompact {
  if (!isRecord(data)) return false;
  if (typeof data.timestamp !== "string" || typeof data.compoundRun !== "boolean") return false;
  if (!isRecord(data.progressSummary)) return false;
  const ps = data.progressSummary;
  if (typeof ps.entryCount !== "number" || !Array.isArray(ps.recentHeadings)) return false;
  if (!isRecord(data.confidenceSummary)) return false;
  const cs = data.confidenceSummary;
  if (typeof cs.totalEntries !== "number" || typeof cs.avgConfirmed !== "number" || typeof cs.unverifiedCount !== "number") return false;
  return true;
}

function isContextPressure(data: unknown): data is ContextPressure {
  if (!isRecord(data)) return false;
  if (typeof data.usedPercentage !== "number" || typeof data.timestamp !== "string") return false;
  if (typeof data.lastNotifiedLevel !== "string") return false;
  const validLevels = ["none", "info", "urgent"];
  if (!validLevels.includes(data.lastNotifiedLevel)) return false;
  return true;
}

export function readCompoundLastRun(
  contextDir: string,
): CompoundLastRun | null {
  const data = readJsonFile(path.join(contextDir, "compound-last-run.json"));
  return isCompoundLastRun(data) ? data : null;
}

export function writeCompoundLastRun(
  contextDir: string,
  data: CompoundLastRun,
): void {
  writeJsonFile(contextDir, "compound-last-run.json", data);
}

export function readLastCompact(contextDir: string): LastCompact | null {
  const data = readJsonFile(path.join(contextDir, "last-compact.json"));
  return isLastCompact(data) ? data : null;
}

export function writeLastCompact(
  contextDir: string,
  data: LastCompact,
): void {
  writeJsonFile(contextDir, "last-compact.json", data);
}

export function readContextPressure(
  contextDir: string,
): ContextPressure | null {
  const data = readJsonFile(path.join(contextDir, "context-pressure.json"));
  return isContextPressure(data) ? data : null;
}

export function writeContextPressure(
  contextDir: string,
  data: ContextPressure,
): void {
  writeJsonFile(contextDir, "context-pressure.json", data);
}

export function getProgressSummary(
  filePath: string,
  maxHeadings: number,
): ProgressSummary {
  if (!fs.existsSync(filePath)) {
    return { entryCount: 0, recentHeadings: [] };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const headings: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      headings.push(line.slice(3).trim());
    }
  }

  return {
    entryCount: headings.length,
    recentHeadings: headings.slice(0, maxHeadings),
  };
}
