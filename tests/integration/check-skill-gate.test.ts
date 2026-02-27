import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { runScript } from "../helpers/exec.js";

const SCRIPT_PATH = path.resolve("hooks/dist/check-skill-gate.js");
const PROJECT_ROOT = path.resolve(".");

describe("check-skill-gate integration", () => {
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

  it("warns when code-quality-rules NOT invoked (code file edit)", () => {
    const result = runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/file.ts" },
    });
    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "code-quality-rules",
    );
    expect(output.hookSpecificOutput.permissionDecision).toBeUndefined();
  });

  it("allows when code-quality-rules IS invoked", () => {
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "code-quality-rules\n",
    );
    const result = runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/file.ts" },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("blocks when session_id is empty (exit 2, deny-by-default)", () => {
    const result = runHook({
      session_id: "",
      tool_input: { file_path: "/path/to/file.ts" },
    });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("session_id");
  });

  it("unrelated skill does not satisfy code-quality-rules gate", () => {
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "some-other-skill\n",
    );
    const result = runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/file.ts" },
    });
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "code-quality-rules",
    );
  });

  it("warns about document-quality-rules gate for .md files", () => {
    const result = runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/README.md" },
    });
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "document-quality-rules",
    );
    expect(output.hookSpecificOutput.permissionDecision).toBeUndefined();
  });

  it("warns for .md when only code-quality-rules invoked", () => {
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "code-quality-rules\n",
    );
    const result = runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/README.md" },
    });
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "document-quality-rules",
    );
  });

  it("allows with prefixed skill name (substring match)", () => {
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "claude-praxis:code-quality-rules\n",
    );
    const result = runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/file.ts" },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("passes config files without any skill", () => {
    const result = runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/config.json" },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("allows both file types when both skills invoked", () => {
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "code-quality-rules\ndocument-quality-rules\n",
    );
    const codeResult = runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/file.ts" },
    });
    const docResult = runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/README.md" },
    });
    expect(codeResult.exitCode).toBe(0);
    expect(codeResult.stdout.trim()).toBe("");
    expect(docResult.exitCode).toBe(0);
    expect(docResult.stdout.trim()).toBe("");
  });

  it("blocks when JSON parse fails (exit 2, deny-by-default)", () => {
    const result = runScript(SCRIPT_PATH, "not json", {
      cwd: PROJECT_ROOT,
      env: { ...process.env, CLAUDE_PRAXIS_MARKER_DIR: markerDir },
    });
    expect(result.exitCode).toBe(2);
  });

  it("writes code-session marker on allowed code file edit", () => {
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "code-quality-rules\n",
    );
    runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/file.ts" },
    });
    expect(
      fs.existsSync(path.join(markerDir, "test-session-code-session")),
    ).toBe(true);
  });

  it("does NOT write code-session marker for document file edit", () => {
    fs.writeFileSync(
      path.join(markerDir, "test-session"),
      "document-quality-rules\n",
    );
    runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/README.md" },
    });
    expect(
      fs.existsSync(path.join(markerDir, "test-session-code-session")),
    ).toBe(false);
  });

  it("does NOT write code-session marker for config file edit", () => {
    runHook({
      session_id: "test-session",
      tool_input: { file_path: "/path/to/config.json" },
    });
    expect(
      fs.existsSync(path.join(markerDir, "test-session-code-session")),
    ).toBe(false);
  });

  it("allows when tool_input has no file_path (unknown ext → no gate)", () => {
    const result = runHook({
      session_id: "test-session",
      tool_input: {},
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });
});
