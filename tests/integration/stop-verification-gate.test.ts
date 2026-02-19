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
});
