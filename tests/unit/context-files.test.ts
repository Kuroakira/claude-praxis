import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  detectPersistenceFiles,
  trimProgressFile,
  updateCompactTimestamp,
  readCompoundLastRun,
  writeCompoundLastRun,
  readLastCompact,
  writeLastCompact,
  readContextPressure,
  writeContextPressure,
  getProgressSummary,
} from "../../hooks/src/lib/context-files.js";
import type {
  CompoundLastRun,
  LastCompact,
  ContextPressure,
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

    it("detects learnings-feature-spec.md with entry count", () => {
      fs.writeFileSync(
        path.join(contextDir, "learnings-feature-spec.md"),
        "# Learnings\n## Entry 1\nDetails\n## Entry 2\nMore",
      );
      const result = detectPersistenceFiles(contextDir);
      expect(result).toContainEqual(
        expect.objectContaining({ name: "learnings-feature-spec.md", entryCount: 2 }),
      );
    });

    it("detects learnings-design.md with entry count", () => {
      fs.writeFileSync(
        path.join(contextDir, "learnings-design.md"),
        "# Learnings\n## Entry 1\nDetails\n## Entry 2\nMore\n## Entry 3\n",
      );
      const result = detectPersistenceFiles(contextDir);
      expect(result).toContainEqual(
        expect.objectContaining({ name: "learnings-design.md", entryCount: 3 }),
      );
    });

    it("detects learnings-coding.md with entry count", () => {
      fs.writeFileSync(
        path.join(contextDir, "learnings-coding.md"),
        "# Learnings\n## Entry 1\n",
      );
      const result = detectPersistenceFiles(contextDir);
      expect(result).toContainEqual(
        expect.objectContaining({ name: "learnings-coding.md", entryCount: 1 }),
      );
    });

    it("returns all 4 files when old and new learnings coexist", () => {
      fs.writeFileSync(path.join(contextDir, "learnings.md"), "old");
      fs.writeFileSync(path.join(contextDir, "learnings-feature-spec.md"), "# L\n## E1");
      fs.writeFileSync(path.join(contextDir, "learnings-design.md"), "# L\n## E1");
      fs.writeFileSync(path.join(contextDir, "learnings-coding.md"), "# L\n## E1");
      const result = detectPersistenceFiles(contextDir);
      const names = result.map((f) => f.name);
      expect(names).toContain("learnings.md");
      expect(names).toContain("learnings-feature-spec.md");
      expect(names).toContain("learnings-design.md");
      expect(names).toContain("learnings-coding.md");
    });

    it("returns only old learnings.md when new files don't exist", () => {
      fs.writeFileSync(path.join(contextDir, "learnings.md"), "old");
      const result = detectPersistenceFiles(contextDir);
      const names = result.map((f) => f.name);
      expect(names).toContain("learnings.md");
      expect(names).not.toContain("learnings-feature-spec.md");
    });

    it("returns entry count 0 for empty learnings file", () => {
      fs.writeFileSync(path.join(contextDir, "learnings-coding.md"), "# Learnings\n");
      const result = detectPersistenceFiles(contextDir);
      const file = result.find((f) => f.name === "learnings-coding.md");
      expect(file?.entryCount).toBe(0);
    });

    it("returns avgConfirmed for learnings file with Confirmed fields", () => {
      const content = [
        "# Learnings",
        "## Entry 1",
        "- **Learning**: something",
        "- **Confirmed**: 4回 | 2026-02-18 | implement, design",
        "## Entry 2",
        "- **Learning**: another",
        "- **Confirmed**: 2回 | 2026-02-15 | review",
      ].join("\n");
      fs.writeFileSync(path.join(contextDir, "learnings-coding.md"), content);
      const result = detectPersistenceFiles(contextDir);
      const file = result.find((f) => f.name === "learnings-coding.md");
      expect(file?.avgConfirmed).toBe(3.0);
      expect(file?.unverifiedCount).toBe(0);
    });

    it("returns unverifiedCount for entries without Confirmed field", () => {
      const content = [
        "# Learnings",
        "## Entry 1",
        "- **Learning**: has confidence",
        "- **Confirmed**: 2回 | 2026-02-18 | implement",
        "## Entry 2",
        "- **Learning**: no confidence",
      ].join("\n");
      fs.writeFileSync(path.join(contextDir, "learnings-design.md"), content);
      const result = detectPersistenceFiles(contextDir);
      const file = result.find((f) => f.name === "learnings-design.md");
      expect(file?.avgConfirmed).toBe(2.0);
      expect(file?.unverifiedCount).toBe(1);
    });

    it("omits avgConfirmed for non-learnings files", () => {
      fs.writeFileSync(
        path.join(contextDir, "progress.md"),
        "## Entry 1\n## Entry 2\n",
      );
      const result = detectPersistenceFiles(contextDir);
      const file = result.find((f) => f.name === "progress.md");
      expect(file?.avgConfirmed).toBeUndefined();
      expect(file?.unverifiedCount).toBeUndefined();
    });

    it("returns avgConfirmed 0 when all entries are unverified", () => {
      const content = [
        "# Learnings",
        "## Entry 1",
        "- **Learning**: no confidence",
        "## Entry 2",
        "- **Learning**: also no confidence",
      ].join("\n");
      fs.writeFileSync(path.join(contextDir, "learnings-feature-spec.md"), content);
      const result = detectPersistenceFiles(contextDir);
      const file = result.find((f) => f.name === "learnings-feature-spec.md");
      expect(file?.avgConfirmed).toBe(0);
      expect(file?.unverifiedCount).toBe(2);
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

  describe("readCompoundLastRun", () => {
    it("returns data from valid compound-last-run.json", () => {
      const data: CompoundLastRun = {
        timestamp: "2026-02-20T12:00:00Z",
        promotedCount: 3,
      };
      fs.writeFileSync(
        path.join(contextDir, "compound-last-run.json"),
        JSON.stringify(data),
      );
      const result = readCompoundLastRun(contextDir);
      expect(result).toEqual(data);
    });

    it("returns null when file does not exist", () => {
      const result = readCompoundLastRun(contextDir);
      expect(result).toBeNull();
    });

    it("returns null when file contains invalid JSON", () => {
      fs.writeFileSync(
        path.join(contextDir, "compound-last-run.json"),
        "not json",
      );
      const result = readCompoundLastRun(contextDir);
      expect(result).toBeNull();
    });
  });

  describe("writeCompoundLastRun", () => {
    it("writes compound-last-run.json with timestamp and count", () => {
      const data: CompoundLastRun = {
        timestamp: "2026-02-20T12:00:00Z",
        promotedCount: 5,
      };
      writeCompoundLastRun(contextDir, data);
      const content = fs.readFileSync(
        path.join(contextDir, "compound-last-run.json"),
        "utf-8",
      );
      expect(JSON.parse(content)).toEqual(data);
    });

    it("creates context directory if it does not exist", () => {
      const newDir = path.join(tmpDir, "new", ".claude", "context");
      const data: CompoundLastRun = {
        timestamp: "2026-02-20T12:00:00Z",
        promotedCount: 0,
      };
      writeCompoundLastRun(newDir, data);
      expect(fs.existsSync(path.join(newDir, "compound-last-run.json"))).toBe(
        true,
      );
    });
  });

  describe("readLastCompact", () => {
    it("returns data from valid last-compact.json", () => {
      const data: LastCompact = {
        timestamp: "2026-02-20T12:00:00Z",
        compoundRun: false,
        progressSummary: {
          entryCount: 5,
          recentHeadings: ["Task 3", "Task 2", "Task 1"],
        },
        confidenceSummary: {
          totalEntries: 10,
          avgConfirmed: 2.5,
          unverifiedCount: 3,
        },
      };
      fs.writeFileSync(
        path.join(contextDir, "last-compact.json"),
        JSON.stringify(data),
      );
      const result = readLastCompact(contextDir);
      expect(result).toEqual(data);
    });

    it("returns null when file does not exist", () => {
      const result = readLastCompact(contextDir);
      expect(result).toBeNull();
    });

    it("returns null when file contains invalid JSON", () => {
      fs.writeFileSync(
        path.join(contextDir, "last-compact.json"),
        "corrupt",
      );
      const result = readLastCompact(contextDir);
      expect(result).toBeNull();
    });

    it("returns null when progressSummary is missing", () => {
      fs.writeFileSync(
        path.join(contextDir, "last-compact.json"),
        JSON.stringify({ timestamp: "2026-02-20T12:00:00Z", compoundRun: false }),
      );
      const result = readLastCompact(contextDir);
      expect(result).toBeNull();
    });

    it("returns null when confidenceSummary is missing", () => {
      fs.writeFileSync(
        path.join(contextDir, "last-compact.json"),
        JSON.stringify({
          timestamp: "2026-02-20T12:00:00Z",
          compoundRun: false,
          progressSummary: { entryCount: 0, recentHeadings: [] },
        }),
      );
      const result = readLastCompact(contextDir);
      expect(result).toBeNull();
    });
  });

  describe("writeLastCompact", () => {
    it("writes last-compact.json with full metadata", () => {
      const data: LastCompact = {
        timestamp: "2026-02-20T12:00:00Z",
        compoundRun: true,
        progressSummary: {
          entryCount: 2,
          recentHeadings: ["Done A"],
        },
        confidenceSummary: {
          totalEntries: 4,
          avgConfirmed: 1.5,
          unverifiedCount: 1,
        },
      };
      writeLastCompact(contextDir, data);
      const content = fs.readFileSync(
        path.join(contextDir, "last-compact.json"),
        "utf-8",
      );
      expect(JSON.parse(content)).toEqual(data);
    });
  });

  describe("readContextPressure", () => {
    it("returns data from valid context-pressure.json", () => {
      const data: ContextPressure = {
        usedPercentage: 65,
        timestamp: "2026-02-20T12:00:00Z",
        lastNotifiedLevel: "info",
      };
      fs.writeFileSync(
        path.join(contextDir, "context-pressure.json"),
        JSON.stringify(data),
      );
      const result = readContextPressure(contextDir);
      expect(result).toEqual(data);
    });

    it("returns null when file does not exist", () => {
      const result = readContextPressure(contextDir);
      expect(result).toBeNull();
    });

    it("returns null when file contains invalid JSON", () => {
      fs.writeFileSync(
        path.join(contextDir, "context-pressure.json"),
        "bad",
      );
      const result = readContextPressure(contextDir);
      expect(result).toBeNull();
    });

    it("returns null when lastNotifiedLevel is missing", () => {
      fs.writeFileSync(
        path.join(contextDir, "context-pressure.json"),
        JSON.stringify({ usedPercentage: 65, timestamp: "2026-02-20T12:00:00Z" }),
      );
      const result = readContextPressure(contextDir);
      expect(result).toBeNull();
    });

    it("returns null when lastNotifiedLevel has invalid value", () => {
      fs.writeFileSync(
        path.join(contextDir, "context-pressure.json"),
        JSON.stringify({ usedPercentage: 65, timestamp: "2026-02-20T12:00:00Z", lastNotifiedLevel: "unknown" }),
      );
      const result = readContextPressure(contextDir);
      expect(result).toBeNull();
    });
  });

  describe("writeContextPressure", () => {
    it("writes context-pressure.json with updated level", () => {
      const data: ContextPressure = {
        usedPercentage: 70,
        timestamp: "2026-02-20T12:00:00Z",
        lastNotifiedLevel: "info",
      };
      writeContextPressure(contextDir, data);
      const content = fs.readFileSync(
        path.join(contextDir, "context-pressure.json"),
        "utf-8",
      );
      expect(JSON.parse(content)).toEqual(data);
    });
  });

  describe("getProgressSummary", () => {
    it("returns entry count and recent headings", () => {
      const content = [
        "## 2026-02-20 — Task 3 complete",
        "- Details",
        "## 2026-02-19 — Task 2 complete",
        "- Details",
        "## 2026-02-18 — Task 1 complete",
        "- Details",
      ].join("\n");
      fs.writeFileSync(path.join(contextDir, "progress.md"), content);
      const result = getProgressSummary(
        path.join(contextDir, "progress.md"),
        3,
      );
      expect(result.entryCount).toBe(3);
      expect(result.recentHeadings).toEqual([
        "2026-02-20 — Task 3 complete",
        "2026-02-19 — Task 2 complete",
        "2026-02-18 — Task 1 complete",
      ]);
    });

    it("limits headings to requested count", () => {
      const content = Array.from(
        { length: 10 },
        (_, i) => `## Entry ${i + 1}\nDetails`,
      ).join("\n");
      fs.writeFileSync(path.join(contextDir, "progress.md"), content);
      const result = getProgressSummary(
        path.join(contextDir, "progress.md"),
        3,
      );
      expect(result.entryCount).toBe(10);
      expect(result.recentHeadings).toHaveLength(3);
      expect(result.recentHeadings[0]).toBe("Entry 1");
    });

    it("returns zero count and empty headings when file does not exist", () => {
      const result = getProgressSummary(
        path.join(contextDir, "nonexistent.md"),
        3,
      );
      expect(result.entryCount).toBe(0);
      expect(result.recentHeadings).toEqual([]);
    });

    it("returns zero count for empty file", () => {
      fs.writeFileSync(path.join(contextDir, "progress.md"), "# Progress\n");
      const result = getProgressSummary(
        path.join(contextDir, "progress.md"),
        3,
      );
      expect(result.entryCount).toBe(0);
      expect(result.recentHeadings).toEqual([]);
    });
  });

  describe("detectPersistenceFiles with marker files", () => {
    it("detects compound-last-run.json", () => {
      fs.writeFileSync(
        path.join(contextDir, "compound-last-run.json"),
        JSON.stringify({ timestamp: "2026-02-20T12:00:00Z", promotedCount: 1 }),
      );
      const result = detectPersistenceFiles(contextDir);
      expect(result.map((f) => f.name)).toContain("compound-last-run.json");
    });

    it("detects last-compact.json", () => {
      fs.writeFileSync(
        path.join(contextDir, "last-compact.json"),
        JSON.stringify({ timestamp: "2026-02-20T12:00:00Z" }),
      );
      const result = detectPersistenceFiles(contextDir);
      expect(result.map((f) => f.name)).toContain("last-compact.json");
    });

    it("detects context-pressure.json", () => {
      fs.writeFileSync(
        path.join(contextDir, "context-pressure.json"),
        JSON.stringify({ usedPercentage: 60 }),
      );
      const result = detectPersistenceFiles(contextDir);
      expect(result.map((f) => f.name)).toContain("context-pressure.json");
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
