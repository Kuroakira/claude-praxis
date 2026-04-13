import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const SCRIPT_PATH = path.resolve("hooks/dist/session-start.js");

describe("session-start integration", () => {
  let tmpDir: string;
  let markerDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "session-start-test-"));
    markerDir = fs.mkdtempSync(path.join(os.tmpdir(), "markers-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(markerDir, { recursive: true, force: true });
  });

  function runHook(
    input: Record<string, unknown>,
    envOverrides?: Record<string, string>,
  ): { exitCode: number; stdout: string; stderr: string } {
    const result = spawnSync("node", [SCRIPT_PATH], {
      input: JSON.stringify(input),
      encoding: "utf-8",
      cwd: tmpDir,
      env: {
        ...process.env,
        CLAUDE_PRAXIS_MARKER_DIR: markerDir,
        CLAUDE_PLUGIN_ROOT: tmpDir,
        HOME: tmpDir,
        ...envOverrides,
      },
    });
    return {
      exitCode: result.status ?? 1,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  }

  it("creates .claude/context/ directory on startup", () => {
    const contextDir = path.join(tmpDir, ".claude", "context");
    expect(fs.existsSync(contextDir)).toBe(false);

    runHook({ session_id: "test-session" });

    expect(fs.existsSync(contextDir)).toBe(true);
  });

  it("outputs empty when no persistence files exist", () => {
    const result = runHook({ session_id: "test-session" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("cleans session markers on start", () => {
    const sessionId = "test-session";
    fs.writeFileSync(path.join(markerDir, sessionId), "skill1\n");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-code-session`), "");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-stop-blocks`), "");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-task-abc123`), "");

    runHook({ session_id: sessionId });

    expect(fs.existsSync(path.join(markerDir, sessionId))).toBe(false);
    expect(
      fs.existsSync(path.join(markerDir, `${sessionId}-code-session`)),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(markerDir, `${sessionId}-stop-blocks`)),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(markerDir, `${sessionId}-task-abc123`)),
    ).toBe(false);
  });

  it("outputs persistence files section when files exist", () => {
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, "task_plan.md"), "# Plan");
    fs.writeFileSync(
      path.join(contextDir, "progress.md"),
      "## Entry 1\n## Entry 2\n",
    );

    const result = runHook({ session_id: "test-session" });
    expect(result.stdout).toContain("Persistence Files Available");
    expect(result.stdout).toContain(".claude/context/task_plan.md");
    expect(result.stdout).toContain(".claude/context/progress.md");
  });

  it("shows entry count for progress.md", () => {
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(
      path.join(contextDir, "progress.md"),
      "## Entry 1\n## Entry 2\n## Entry 3\n",
    );

    const result = runHook({ session_id: "test-session" });
    expect(result.stdout).toContain("3 entries");
  });

  it("always exits 0", () => {
    const result = runHook({ session_id: "test-session" });
    expect(result.exitCode).toBe(0);
  });

  it("cleans all marker types (skill, stop-blocks, code-session, task-*)", () => {
    const sessionId = "cleanup-test";
    fs.writeFileSync(path.join(markerDir, sessionId), "skill\n");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-stop-blocks`), "");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-code-session`), "");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-task-aaa111`), "");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-task-bbb222`), "");
    // other session should survive
    fs.writeFileSync(path.join(markerDir, "other-session"), "data\n");

    runHook({ session_id: sessionId });

    expect(fs.existsSync(path.join(markerDir, sessionId))).toBe(false);
    expect(
      fs.existsSync(path.join(markerDir, `${sessionId}-stop-blocks`)),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(markerDir, `${sessionId}-code-session`)),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(markerDir, `${sessionId}-task-aaa111`)),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(markerDir, `${sessionId}-task-bbb222`)),
    ).toBe(false);
    expect(fs.existsSync(path.join(markerDir, "other-session"))).toBe(true);
  });

  it("shows entry count for each learnings-* file", () => {
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(
      path.join(contextDir, "learnings-feature-spec.md"),
      "# L\n## E1\n## E2\n## E3\n",
    );
    fs.writeFileSync(
      path.join(contextDir, "learnings-design.md"),
      "# L\n## E1\n## E2\n",
    );
    fs.writeFileSync(
      path.join(contextDir, "learnings-coding.md"),
      "# L\n## E1\n",
    );

    const result = runHook({ session_id: "test-session" });
    expect(result.stdout).toContain(".claude/context/learnings-feature-spec.md (3 entries");
    expect(result.stdout).toContain(".claude/context/learnings-design.md (2 entries");
    expect(result.stdout).toContain(".claude/context/learnings-coding.md (1 entries");
  });

  it("shows both old and new learnings files during migration", () => {
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, "learnings.md"), "old content");
    fs.writeFileSync(
      path.join(contextDir, "learnings-coding.md"),
      "# L\n## E1\n",
    );

    const result = runHook({ session_id: "test-session" });
    expect(result.stdout).toContain(".claude/context/learnings.md (updated:");
    expect(result.stdout).toContain(".claude/context/learnings-coding.md (1 entries");
  });

  it("shows old learnings.md without entry count", () => {
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, "learnings.md"), "# Learnings\n## E1\n## E2");

    const result = runHook({ session_id: "test-session" });
    expect(result.stdout).toMatch(/\.claude\/context\/learnings\.md \(updated:/);
    expect(result.stdout).not.toMatch(/\.claude\/context\/learnings\.md \(\d+ entries/);
  });

  it("shows avg confirmed for learnings file with Confirmed fields", () => {
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
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

    const result = runHook({ session_id: "test-session" });
    expect(result.stdout).toContain(".claude/context/learnings-coding.md (2 entries, avg confirmed: 3.0");
  });

  it("shows unverified count when entries lack Confirmed field", () => {
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    const content = [
      "# Learnings",
      "## Entry 1",
      "- **Learning**: no confidence",
      "## Entry 2",
      "- **Learning**: also no confidence",
    ].join("\n");
    fs.writeFileSync(path.join(contextDir, "learnings-design.md"), content);

    const result = runHook({ session_id: "test-session" });
    expect(result.stdout).toContain(".claude/context/learnings-design.md (2 entries, 2 unverified");
  });

  it("does not depend on getting-started skill file", () => {
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, "task_plan.md"), "# Plan");

    const result = runHook({ session_id: "test-session" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(".claude/context/task_plan.md");
    expect(result.stdout).not.toContain("Getting Started");
  });

  describe("compact recovery guidance", () => {
    it("injects compact recovery guidance when last-compact.json exists", () => {
      const contextDir = path.join(tmpDir, ".claude", "context");
      fs.mkdirSync(contextDir, { recursive: true });
      fs.writeFileSync(
        path.join(contextDir, "last-compact.json"),
        JSON.stringify({
          timestamp: "2026-02-20T12:00:00Z",
          progressSummary: { entryCount: 5, recentHeadings: ["Task A", "Task B"] },
          confidenceSummary: { totalEntries: 3, avgConfirmed: 1.5, unverifiedCount: 1 },
        }),
      );

      const result = runHook({ session_id: "test-session" });
      expect(result.stdout).toContain("Compact occurred");
      expect(result.stdout).toContain("Read persistence files to resume");
    });

    it("does not inject compact guidance when last-compact.json does not exist", () => {
      const result = runHook({ session_id: "test-session" });
      expect(result.stdout.trim()).toBe("");
    });

    it("degrades gracefully when last-compact.json is corrupt", () => {
      const contextDir = path.join(tmpDir, ".claude", "context");
      fs.mkdirSync(contextDir, { recursive: true });
      fs.writeFileSync(
        path.join(contextDir, "last-compact.json"),
        "not valid json",
      );

      const result = runHook({ session_id: "test-session" });
      expect(result.exitCode).toBe(0);
    });

    it("does not mention /compound in compact recovery guidance", () => {
      const contextDir = path.join(tmpDir, ".claude", "context");
      fs.mkdirSync(contextDir, { recursive: true });
      fs.writeFileSync(
        path.join(contextDir, "last-compact.json"),
        JSON.stringify({
          timestamp: "2026-02-20T12:00:00Z",
          progressSummary: { entryCount: 5, recentHeadings: ["Implement auth", "Fix bug"] },
          confidenceSummary: { totalEntries: 0, avgConfirmed: 0, unverifiedCount: 0 },
        }),
      );

      const result = runHook({ session_id: "test-session" });
      expect(result.stdout).not.toContain("/claude-praxis:compound");
    });
  });
});
