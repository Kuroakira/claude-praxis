import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { runScript } from "../helpers/exec.js";

const SCRIPT_PATH = path.resolve("hooks/dist/pre-compact.js");

describe("pre-compact integration", () => {
  let tmpDir: string;
  let contextDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "precompact-test-"));
    contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function runHook(input: Record<string, unknown> = {}) {
    return runScript(SCRIPT_PATH, JSON.stringify(input), {
      cwd: tmpDir,
      env: { ...process.env },
    });
  }

  it("trims progress.md with 15 entries to 10", () => {
    const entries = Array.from(
      { length: 15 },
      (_, i) => `## Entry ${i + 1}\nDetails for entry ${i + 1}`,
    ).join("\n");
    fs.writeFileSync(path.join(contextDir, "progress.md"), entries);

    runHook({ session_id: "test" });

    const content = fs.readFileSync(
      path.join(contextDir, "progress.md"),
      "utf-8",
    );
    const count = (content.match(/^## /gm) ?? []).length;
    expect(count).toBe(10);
  });

  it("leaves progress.md with 5 entries unchanged", () => {
    const entries = Array.from(
      { length: 5 },
      (_, i) => `## Entry ${i + 1}\nDetails`,
    ).join("\n");
    fs.writeFileSync(path.join(contextDir, "progress.md"), entries);

    runHook({ session_id: "test" });

    const content = fs.readFileSync(
      path.join(contextDir, "progress.md"),
      "utf-8",
    );
    const count = (content.match(/^## /gm) ?? []).length;
    expect(count).toBe(5);
  });

  it("does not error when progress.md doesn't exist", () => {
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
  });

  it("updates existing 'Last compacted:' in task_plan.md", () => {
    fs.writeFileSync(
      path.join(contextDir, "task_plan.md"),
      "# Plan\nLast compacted: 2024-01-01T00:00:00Z\n## Tasks",
    );

    runHook({ session_id: "test" });

    const content = fs.readFileSync(
      path.join(contextDir, "task_plan.md"),
      "utf-8",
    );
    expect(content).not.toContain("2024-01-01T00:00:00Z");
    expect(content).toMatch(
      /Last compacted: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/,
    );
  });

  it("inserts 'Last compacted:' after first line when not present", () => {
    fs.writeFileSync(
      path.join(contextDir, "task_plan.md"),
      "# Plan\n## Tasks\n- Task 1",
    );

    runHook({ session_id: "test" });

    const content = fs.readFileSync(
      path.join(contextDir, "task_plan.md"),
      "utf-8",
    );
    const lines = content.split("\n");
    expect(lines[0]).toBe("# Plan");
    expect(lines[1]).toMatch(/^Last compacted:/);
  });

  it("does not error when task_plan.md doesn't exist", () => {
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
  });

  it("outputs correct JSON structure", () => {
    const result = runHook({ session_id: "test" });
    const output = JSON.parse(result.stdout);
    expect(output).toEqual({ hookSpecificOutput: {} });
  });

  it("exits with code 0", () => {
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
  });

  describe("last-compact.json", () => {
    it("writes last-compact.json with timestamp", () => {
      runHook({ session_id: "test" });
      const filePath = path.join(contextDir, "last-compact.json");
      expect(fs.existsSync(filePath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      expect(data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
      );
    });

    it("sets compoundRun false when compound-last-run.json does not exist", () => {
      runHook({ session_id: "test" });
      const data = JSON.parse(
        fs.readFileSync(path.join(contextDir, "last-compact.json"), "utf-8"),
      );
      expect(data.compoundRun).toBe(false);
    });

    it("sets compoundRun true when compound-last-run.json is newer than last-compact.json", () => {
      fs.writeFileSync(
        path.join(contextDir, "compound-last-run.json"),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          promotedCount: 2,
        }),
      );
      runHook({ session_id: "test" });
      const data = JSON.parse(
        fs.readFileSync(path.join(contextDir, "last-compact.json"), "utf-8"),
      );
      expect(data.compoundRun).toBe(true);
    });

    it("sets compoundRun false when compound-last-run.json is older than last compact", () => {
      fs.writeFileSync(
        path.join(contextDir, "last-compact.json"),
        JSON.stringify({
          timestamp: "2026-02-20T12:00:00Z",
          compoundRun: true,
          progressSummary: { entryCount: 0, recentHeadings: [] },
          confidenceSummary: { totalEntries: 0, avgConfirmed: 0, unverifiedCount: 0 },
        }),
      );
      fs.writeFileSync(
        path.join(contextDir, "compound-last-run.json"),
        JSON.stringify({
          timestamp: "2026-02-19T00:00:00Z",
          promotedCount: 1,
        }),
      );
      runHook({ session_id: "test" });
      const data = JSON.parse(
        fs.readFileSync(path.join(contextDir, "last-compact.json"), "utf-8"),
      );
      expect(data.compoundRun).toBe(false);
    });

    it("includes progressSummary with entry count and recent headings", () => {
      const entries = [
        "## 2026-02-20 — Task 3",
        "- Details",
        "## 2026-02-19 — Task 2",
        "- Details",
        "## 2026-02-18 — Task 1",
        "- Details",
      ].join("\n");
      fs.writeFileSync(path.join(contextDir, "progress.md"), entries);

      runHook({ session_id: "test" });

      const data = JSON.parse(
        fs.readFileSync(path.join(contextDir, "last-compact.json"), "utf-8"),
      );
      expect(data.progressSummary.entryCount).toBe(3);
      expect(data.progressSummary.recentHeadings).toHaveLength(3);
      expect(data.progressSummary.recentHeadings[0]).toBe(
        "2026-02-20 — Task 3",
      );
    });

    it("includes confidenceSummary from learnings files", () => {
      const learningsContent = [
        "# Learnings",
        "## Entry 1",
        "- **Learning**: something",
        "- **Confirmed**: 3回 | 2026-02-18 | implement",
        "## Entry 2",
        "- **Learning**: unverified",
      ].join("\n");
      fs.writeFileSync(
        path.join(contextDir, "learnings-coding.md"),
        learningsContent,
      );

      runHook({ session_id: "test" });

      const data = JSON.parse(
        fs.readFileSync(path.join(contextDir, "last-compact.json"), "utf-8"),
      );
      expect(data.confidenceSummary.totalEntries).toBe(2);
      expect(data.confidenceSummary.unverifiedCount).toBe(1);
    });

    it("handles missing progress.md gracefully in last-compact.json", () => {
      runHook({ session_id: "test" });
      const data = JSON.parse(
        fs.readFileSync(path.join(contextDir, "last-compact.json"), "utf-8"),
      );
      expect(data.progressSummary.entryCount).toBe(0);
      expect(data.progressSummary.recentHeadings).toEqual([]);
    });

    it("handles missing learnings files gracefully in last-compact.json", () => {
      runHook({ session_id: "test" });
      const data = JSON.parse(
        fs.readFileSync(path.join(contextDir, "last-compact.json"), "utf-8"),
      );
      expect(data.confidenceSummary.totalEntries).toBe(0);
      expect(data.confidenceSummary.avgConfirmed).toBe(0);
      expect(data.confidenceSummary.unverifiedCount).toBe(0);
    });
  });
});
