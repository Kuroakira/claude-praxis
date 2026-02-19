import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { runScript } from "../helpers/exec.js";

const SCRIPT_PATH = path.resolve("hooks/dist/mark-skill-invoked.js");
const PROJECT_ROOT = path.resolve(".");

describe("mark-skill-invoked integration", () => {
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

  it("creates marker file on skill invocation", () => {
    const result = runHook({
      session_id: "test-session",
      tool_input: { skill: "code-quality-rules" },
    });
    expect(result.exitCode).toBe(0);
    const markerContent = fs.readFileSync(
      path.join(markerDir, "test-session"),
      "utf-8",
    );
    expect(markerContent).toContain("code-quality-rules");
  });

  it("appends multiple skills correctly", () => {
    runHook({
      session_id: "test-session",
      tool_input: { skill: "code-quality-rules" },
    });
    runHook({
      session_id: "test-session",
      tool_input: { skill: "verification-before-completion" },
    });
    const content = fs.readFileSync(
      path.join(markerDir, "test-session"),
      "utf-8",
    );
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("code-quality-rules");
    expect(lines[1]).toBe("verification-before-completion");
  });

  it("does not create marker when session_id is empty", () => {
    const result = runHook({
      session_id: "",
      tool_input: { skill: "code-quality-rules" },
    });
    expect(result.exitCode).toBe(0);
    expect(fs.readdirSync(markerDir)).toHaveLength(0);
  });

  it("does not create marker when skill name is empty", () => {
    const result = runHook({
      session_id: "test-session",
      tool_input: { skill: "" },
    });
    expect(result.exitCode).toBe(0);
    expect(fs.existsSync(path.join(markerDir, "test-session"))).toBe(false);
  });

  it("does not create marker when skill field is missing", () => {
    const result = runHook({
      session_id: "test-session",
      tool_input: {},
    });
    expect(result.exitCode).toBe(0);
    expect(fs.existsSync(path.join(markerDir, "test-session"))).toBe(false);
  });

  it("always exits 0", () => {
    const result = runHook({
      session_id: "test-session",
      tool_input: { skill: "test-skill" },
    });
    expect(result.exitCode).toBe(0);
  });

  it("exits 0 on malformed JSON", () => {
    const result = runScript(SCRIPT_PATH, "not json", {
      cwd: PROJECT_ROOT,
      env: { ...process.env, CLAUDE_PRAXIS_MARKER_DIR: markerDir },
    });
    expect(result.exitCode).toBe(0);
  });
});
