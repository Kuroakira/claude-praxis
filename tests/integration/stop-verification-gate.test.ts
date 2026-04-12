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

  it("allows when code-session exists (verification via rules layer, not skill marker)", () => {
    fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: false,
    });
    expect(result.exitCode).toBe(0);
    // Verification is now enforced via rules/verification.md (@import),
    // not via skill marker check. No warning expected.
    expect(result.stdout.trim()).toBe("");
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

  it("allows with code-session and unrelated skill marker (no verification gate)", () => {
    fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "some-skill\n",
    );
    const result = runHook({
      session_id: "test-session",
      stop_hook_active: false,
    });
    expect(result.exitCode).toBe(0);
    // Verification is enforced via rules layer, not skill marker.
    expect(result.stdout.trim()).toBe("");
  });

  it("allows on JSON parse failure (not deny-by-default)", () => {
    const result = runScript(SCRIPT_PATH, "not json", {
      cwd: PROJECT_ROOT,
      env: { ...process.env, CLAUDE_PRAXIS_MARKER_DIR: markerDir },
    });
    expect(result.exitCode).toBe(0);
  });

  describe("implement skill — no gate triggered", () => {
    it("does not warn when implement skill marker is created", () => {
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "implement\n",
      );
      fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
      const result = runHook({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      // implement is no longer a workflow skill — no advisory should fire
      expect(result.stdout.trim()).toBe("");
    });

    it("does not warn when prefixed implement skill marker is created", () => {
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "claude-praxis:implement\n",
      );
      fs.writeFileSync(path.join(markerDir, "test-session-code-session"), "");
      const result = runHook({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("");
    });
  });

  describe("understanding-check advisory", () => {
    it("suggests /understanding-check when design workflow invoked", () => {
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "design\n",
      );
      const result = runHook({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput.additionalContext).toContain(
        "/understanding-check",
      );
    });

    it("suggests /understanding-check for feature-spec workflow", () => {
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "feature-spec\n",
      );
      const result = runHook({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput.additionalContext).toContain(
        "/understanding-check",
      );
    });

    it("suggests /understanding-check for investigate workflow", () => {
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "investigate\n",
      );
      const result = runHook({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput.additionalContext).toContain(
        "/understanding-check",
      );
    });

    it("does not suggest /understanding-check when already invoked", () => {
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "design\nunderstanding-check\n",
      );
      const result = runHook({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      // Should not contain understanding-check advisory
      if (result.stdout.trim()) {
        const output = JSON.parse(result.stdout);
        expect(
          output.hookSpecificOutput?.additionalContext ?? "",
        ).not.toContain("/understanding-check");
      }
    });

    it("does not suggest /understanding-check when no workflow invoked", () => {
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "some-other-skill\n",
      );
      const result = runHook({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      if (result.stdout.trim()) {
        const output = JSON.parse(result.stdout);
        expect(
          output.hookSpecificOutput?.additionalContext ?? "",
        ).not.toContain("/understanding-check");
      }
    });

    it("works with prefixed skill names", () => {
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "claude-praxis:feature-spec\n",
      );
      const result = runHook({
        session_id: "test-session",
        stop_hook_active: false,
      });
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput.additionalContext).toContain(
        "/understanding-check",
      );
    });

    it("does not suggest /compound even when progress.md has entries", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stop-no-compound-"));
      const ctxDir = path.join(tmpDir, ".claude", "context");
      fs.mkdirSync(ctxDir, { recursive: true });
      fs.writeFileSync(
        path.join(ctxDir, "progress.md"),
        "## Entry 1\nDetails",
      );
      fs.writeFileSync(
        path.join(markerDir, "test-session"),
        "design\n",
      );
      const result = runScript(SCRIPT_PATH, JSON.stringify({
        session_id: "test-session",
        stop_hook_active: false,
      }), {
        cwd: tmpDir,
        env: { ...process.env, CLAUDE_PRAXIS_MARKER_DIR: markerDir },
      });
      fs.rmSync(tmpDir, { recursive: true, force: true });
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput.additionalContext).toContain(
        "/understanding-check",
      );
      // compound suggestion should NOT be present
      expect(output.hookSpecificOutput.additionalContext).not.toContain(
        "/claude-praxis:compound",
      );
    });
  });
});
