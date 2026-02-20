import * as fs from "node:fs";
import * as path from "node:path";

export interface PersistenceFileInfo {
  name: string;
  mtime: Date;
  entryCount?: number;
}

const TRACKED_FILES = [
  "task_plan.md",
  "progress.md",
  "learnings.md",
  "learnings-feature-spec.md",
  "learnings-design.md",
  "learnings-coding.md",
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
