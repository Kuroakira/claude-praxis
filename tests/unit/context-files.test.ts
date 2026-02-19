import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  detectPersistenceFiles,
  trimProgressFile,
  updateCompactTimestamp,
} from "../../hooks/src/lib/context-files.js";

describe("context-files", () => {
  let tmpDir: string;
  let contextDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-test-"));
    contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("detectPersistenceFiles", () => {
    it("returns list of found files with metadata", () => {
      fs.writeFileSync(path.join(contextDir, "task_plan.md"), "# Plan");
      fs.writeFileSync(
        path.join(contextDir, "progress.md"),
        "## Entry 1\nDetails\n## Entry 2\nMore",
      );
      const result = detectPersistenceFiles(contextDir);
      expect(result).toHaveLength(2);
      expect(result.map((f) => f.name)).toContain("task_plan.md");
      expect(result.map((f) => f.name)).toContain("progress.md");
    });

    it("detects task_plan.md, progress.md, learnings.md", () => {
      fs.writeFileSync(path.join(contextDir, "task_plan.md"), "plan");
      fs.writeFileSync(path.join(contextDir, "progress.md"), "progress");
      fs.writeFileSync(path.join(contextDir, "learnings.md"), "learnings");
      const result = detectPersistenceFiles(contextDir);
      expect(result).toHaveLength(3);
    });

    it("returns mtime for each file", () => {
      fs.writeFileSync(path.join(contextDir, "task_plan.md"), "plan");
      const result = detectPersistenceFiles(contextDir);
      expect(result[0].mtime).toBeInstanceOf(Date);
    });

    it("returns entry count for progress.md", () => {
      fs.writeFileSync(
        path.join(contextDir, "progress.md"),
        "## Entry 1\nDetails\n## Entry 2\nMore\n## Entry 3\n",
      );
      const result = detectPersistenceFiles(contextDir);
      const progress = result.find((f) => f.name === "progress.md");
      expect(progress?.entryCount).toBe(3);
    });

    it("returns empty list when directory doesn't exist", () => {
      const result = detectPersistenceFiles("/nonexistent/dir");
      expect(result).toHaveLength(0);
    });

    it("detects global-learnings.md from specified path", () => {
      const globalPath = path.join(tmpDir, "global-learnings.md");
      fs.writeFileSync(globalPath, "global learnings");
      const result = detectPersistenceFiles(contextDir, globalPath);
      const globalFile = result.find(
        (f) => f.name === "global-learnings.md",
      );
      expect(globalFile?.name).toBe("global-learnings.md");
      expect(globalFile?.mtime).toBeInstanceOf(Date);
    });
  });

  describe("trimProgressFile", () => {
    it("trims to last N entries when exceeding limit", () => {
      const entries = Array.from(
        { length: 15 },
        (_, i) => `## Entry ${i + 1}\nDetails for entry ${i + 1}`,
      ).join("\n");
      const filePath = path.join(contextDir, "progress.md");
      fs.writeFileSync(filePath, entries);

      trimProgressFile(filePath, 10);

      const content = fs.readFileSync(filePath, "utf-8");
      const count = (content.match(/^## /gm) ?? []).length;
      expect(count).toBe(10);
    });

    it("leaves file unchanged when under limit", () => {
      const entries = "## Entry 1\nDetails\n## Entry 2\nMore";
      const filePath = path.join(contextDir, "progress.md");
      fs.writeFileSync(filePath, entries);

      trimProgressFile(filePath, 10);

      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toBe(entries);
    });

    it("does not error when file doesn't exist", () => {
      expect(() =>
        trimProgressFile(path.join(contextDir, "nonexistent.md"), 10),
      ).not.toThrow();
    });
  });

  describe("updateCompactTimestamp", () => {
    it("updates existing 'Last compacted:' line", () => {
      const filePath = path.join(contextDir, "task_plan.md");
      fs.writeFileSync(
        filePath,
        "# Plan\nLast compacted: 2024-01-01T00:00:00Z\n## Tasks",
      );

      updateCompactTimestamp(filePath);

      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).not.toContain("2024-01-01T00:00:00Z");
      expect(content).toMatch(/Last compacted: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
      expect(content).toContain("# Plan");
      expect(content).toContain("## Tasks");
    });

    it("inserts after first line when no 'Last compacted:' exists", () => {
      const filePath = path.join(contextDir, "task_plan.md");
      fs.writeFileSync(filePath, "# Plan\n## Tasks\n- Task 1");

      updateCompactTimestamp(filePath);

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      expect(lines[0]).toBe("# Plan");
      expect(lines[1]).toMatch(/^Last compacted: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(lines[2]).toBe("## Tasks");
    });

    it("does not error when file doesn't exist", () => {
      expect(() =>
        updateCompactTimestamp(path.join(contextDir, "nonexistent.md")),
      ).not.toThrow();
    });
  });
});
