import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import { runScript } from "../helpers/exec.js";

const SCRIPT_PATH = path.resolve("hooks/dist/task-completed-gate.js");
const PROJECT_ROOT = path.resolve(".");

describe("task-completed-gate integration", () => {
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

  function hashTaskSubject(subject: string): string {
    return crypto.createHash("md5").update(subject).digest("hex").slice(0, 12);
  }

  it("blocks first completion attempt (exit 2)", () => {
    const result = runHook({
      session_id: "test-session",
      task_subject: "Run tests",
    });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("verification");
  });

  it("allows second attempt for same task (exit 0)", () => {
    runHook({ session_id: "test-session", task_subject: "Run tests" });
    const result = runHook({
      session_id: "test-session",
      task_subject: "Run tests",
    });
    expect(result.exitCode).toBe(0);
  });

  it("blocks different task in same session independently", () => {
    runHook({ session_id: "test-session", task_subject: "Task A" });
    const result = runHook({
      session_id: "test-session",
      task_subject: "Task B",
    });
    expect(result.exitCode).toBe(2);
  });

  it("blocks same task in different session", () => {
    runHook({ session_id: "session-1", task_subject: "Run tests" });
    runHook({ session_id: "session-1", task_subject: "Run tests" });
    const result = runHook({
      session_id: "session-2",
      task_subject: "Run tests",
    });
    expect(result.exitCode).toBe(2);
  });

  it("allows when session_id is empty (permissive fallback)", () => {
    const result = runHook({
      session_id: "",
      task_subject: "Run tests",
    });
    expect(result.exitCode).toBe(0);
  });

  it("allows when task_subject is empty (permissive fallback)", () => {
    const result = runHook({
      session_id: "test-session",
      task_subject: "",
    });
    expect(result.exitCode).toBe(0);
  });

  it("creates marker file with correct hash path on first block", () => {
    const taskSubject = "Run tests";
    runHook({ session_id: "test-session", task_subject: taskSubject });
    const hash = hashTaskSubject(taskSubject);
    const markerPath = path.join(markerDir, `test-session-task-${hash}`);
    expect(fs.existsSync(markerPath)).toBe(true);
  });

  it("stderr includes task subject name", () => {
    const result = runHook({
      session_id: "test-session",
      task_subject: "Build the project",
    });
    expect(result.stderr).toContain("Build the project");
  });

  it("allows on malformed JSON (permissive fallback)", () => {
    const result = runScript(SCRIPT_PATH, "not json", {
      cwd: PROJECT_ROOT,
      env: { ...process.env, CLAUDE_PRAXIS_MARKER_DIR: markerDir },
    });
    expect(result.exitCode).toBe(0);
  });
});
