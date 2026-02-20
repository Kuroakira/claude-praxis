import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { runScript } from "../helpers/exec.js";

const SCRIPT_PATH = path.resolve("hooks/dist/stop-verification-gate.js");
const PROJECT_ROOT = path.resolve(".");

describe("stop-verification-gate integration", () => {
  let markerDir: string;

  beforeEach(() => {
    markerDir = fs.mkdtempSync(path.join(os.tmpdir(), "markers-test-"));
  });

  afterEach(() => {
    fs.rmSync(markerDir, { recursive: true, force: true });
  });

  function runHook(input: Record<string, unknown>) {
    return runScript(SCRIPT_PATH, JSON.stringify(input), {
      cwd: PROJECT_ROOT,
      env: { ...process.env, CLAUDE_PRAXIS_MARKER_DIR: markerDir },
    });
  }

  it("allows when no code-session marker (non-code session)", () => {
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: false,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("blocks when code-session exists but verification not done", () => {
    fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: false,
    });
    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.decision).toBe("block");
    expect(output.reason).toContain("verification-before-completion");
  });

  it("allows when code-session exists AND verification skill invoked", () => {
    fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "verification-before-completion\n",
    );
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: false,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("allows when stop_hook_active is true (loop prevention)", () => {
    fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: true,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("allows when session_id is empty", () => {
    const result = runHook({
      session_id: "",
      stop_hook_active: false,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("accepts verification with prefixed skill name", () => {
    fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "claude-praxis:verification-before-completion\n",
    );
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: false,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("always exits 0", () => {
    fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: false,
    });
    expect(result.exitCode).toBe(0);
  });

  it("block message includes actionable guidance", () => {
    fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: false,
    });
    const output = JSON.parse(result.stdout);
    expect(output.reason).toContain("typecheck");
    expect(output.reason).toContain("lint");
    expect(output.reason).toContain("test");
  });

  it("unrelated skill does not satisfy verification gate", () => {
    fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "code-quality-rules\n",
    );
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: false,
    });
    const output = JSON.parse(result.stdout);
    expect(output.decision).toBe("block");
  });

  it("allows on JSON parse failure (not deny-by-default)", () => {
    const result = runScript(SCRIPT_PATH, "not json", {
      cwd: PROJECT_ROOT,
      env: { ...process.env, CLAUDE_PRAXIS_MARKER_DIR: markerDir },
    });
    expect(result.exitCode).toBe(0);
  });

  describe("/compound advisory", () => {
    let tmpDir: string;
    let contextDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stop-compound-"));
      contextDir = path.join(tmpDir, ".claude", "context");
      fs.mkdirSync(contextDir, { recursive: true });
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function runHookWithCwd(input: Record<string, unknown>) {
      return runScript(SCRIPT_PATH, JSON.stringify(input), {
        cwd: tmpDir,
        env: { ...process.env, CLAUDE_PRAXIS_MARKER_DIR: markerDir },
      });
    }

    it("suggests /compound when progress.md has entries and compound not run (non-code session)", () => {
      fs.writeFileSync(
        path.join(contextDir, "progress.md"),
        "## Entry 1\nDetails\n## Entry 2\nMore",
      );
      const result = runHookWithCwd({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput.additionalContext).toContain(
        "/claude-praxis:compound",
      );
    });

    it("suggests /compound when verification passes and progress has entries", () => {
      fs.writeFileSync(
        path.join(contextDir, "progress.md"),
        "## Entry 1\nDetails",
      );
      fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "verification-before-completion\n",
      );
      const result = runHookWithCwd({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput.additionalContext).toContain(
        "/claude-praxis:compound",
      );
    });

    it("does not suggest /compound when progress.md is empty", () => {
      fs.writeFileSync(path.join(contextDir, "progress.md"), "# Progress\n");
      const result = runHookWithCwd({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("");
    });

    it("does not suggest /compound when progress.md does not exist", () => {
      const result = runHookWithCwd({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("");
    });

    it("does not suggest /compound when compound was already run", () => {
      fs.writeFileSync(
        path.join(contextDir, "progress.md"),
        "## Entry 1\nDetails",
      );
      fs.writeFileSync(
        path.join(contextDir, "compound-last-run.json"),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          promotedCount: 1,
        }),
      );
      const result = runHookWithCwd({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("");
    });

    it("still blocks for verification even when /compound advisory would apply", () => {
      fs.writeFileSync(
        path.join(contextDir, "progress.md"),
        "## Entry 1\nDetails",
      );
      fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
      const result = runHookWithCwd({
        session_id: "test-session",
        stop_hook_active: false,
      });
      const output = JSON.parse(result.stdout);
      expect(output.decision).toBe("block");
      expect(output.reason).toContain("verification-before-completion");
    });

    it("does not suggest /compound when stop_hook_active is true", () => {
      fs.writeFileSync(
        path.join(contextDir, "progress.md"),
        "## Entry 1\nDetails",
      );
      const result = runHookWithCwd({
        session_id: "test-session",
        stop_hook_active: true,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("");
    });
  });
});
