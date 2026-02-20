import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const SCRIPT_PATH = path.resolve("hooks/dist/session-start.js");

describe("session-start integration", () => {
  let tmpDir: string;
  let markerDir: string;
  let skillDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "session-start-test-"));
    markerDir = fs.mkdtempSync(path.join(os.tmpdir(), "markers-test-"));
    skillDir = path.join(tmpDir, "skills", "getting-started");
    fs.mkdirSync(skillDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(markerDir, { recursive: true, force: true });
  });

  function writeSkillFile(content: string): void {
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), content);
  }

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

  it("outputs JSON with additionalContext containing skill content", () => {
    writeSkillFile("# Getting Started\nWelcome to the framework.");
    const result = runHook({ session_id: "test-session" });
    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "Getting Started",
    );
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "Welcome to the framework.",
    );
  });

  it("strips frontmatter from skill content", () => {
    writeSkillFile(
      "---\nname: getting-started\ndescription: test\n---\n# Getting Started\nContent here.",
    );
    const result = runHook({ session_id: "test-session" });
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).not.toContain(
      "name: getting-started",
    );
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "# Getting Started",
    );
  });

  it("cleans session markers on start", () => {
    const sessionId = "test-session";
    fs.writeFileSync(path.join(markerDir, sessionId), "skill1\n");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-code-session`), "");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-stop-blocks`), "");
    fs.writeFileSync(path.join(markerDir, `${sessionId}-task-abc123`), "");

    writeSkillFile("# Getting Started");
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

  it("appends persistence files section when files exist", () => {
    writeSkillFile("# Getting Started");
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, "task_plan.md"), "# Plan");
    fs.writeFileSync(
      path.join(contextDir, "progress.md"),
      "## Entry 1\n## Entry 2\n",
    );

    const result = runHook({ session_id: "test-session" });
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "Persistence Files Available",
    );
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "task_plan.md",
    );
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "progress.md",
    );
  });

  it("shows entry count for progress.md", () => {
    writeSkillFile("# Getting Started");
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(
      path.join(contextDir, "progress.md"),
      "## Entry 1\n## Entry 2\n## Entry 3\n",
    );

    const result = runHook({ session_id: "test-session" });
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain("3 entries");
  });

  it("omits persistence section when no files exist", () => {
    writeSkillFile("# Getting Started");
    const result = runHook({ session_id: "test-session" });
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).not.toContain(
      "Persistence Files Available",
    );
  });

  it("exits 0 with warning when skill file is missing", () => {
    fs.rmSync(path.join(skillDir, "SKILL.md"), { force: true });
    const result = runHook({ session_id: "test-session" });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Warning");
  });

  it("always exits 0", () => {
    writeSkillFile("# Getting Started");
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

    writeSkillFile("# Getting Started");
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
    writeSkillFile("# Getting Started");
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
    const output = JSON.parse(result.stdout);
    const ctx = output.hookSpecificOutput.additionalContext;
    expect(ctx).toContain("learnings-feature-spec.md (3 entries");
    expect(ctx).toContain("learnings-design.md (2 entries");
    expect(ctx).toContain("learnings-coding.md (1 entries");
  });

  it("shows both old and new learnings files during migration", () => {
    writeSkillFile("# Getting Started");
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, "learnings.md"), "old content");
    fs.writeFileSync(
      path.join(contextDir, "learnings-coding.md"),
      "# L\n## E1\n",
    );

    const result = runHook({ session_id: "test-session" });
    const output = JSON.parse(result.stdout);
    const ctx = output.hookSpecificOutput.additionalContext;
    expect(ctx).toContain("learnings.md (updated:");
    expect(ctx).toContain("learnings-coding.md (1 entries");
  });

  it("shows old learnings.md without entry count", () => {
    writeSkillFile("# Getting Started");
    const contextDir = path.join(tmpDir, ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, "learnings.md"), "# Learnings\n## E1\n## E2");

    const result = runHook({ session_id: "test-session" });
    const output = JSON.parse(result.stdout);
    const ctx = output.hookSpecificOutput.additionalContext;
    expect(ctx).toMatch(/learnings\.md \(updated:/);
    expect(ctx).not.toMatch(/learnings\.md \(\d+ entries/);
  });
});
