import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { runScript } from "../helpers/exec.js";

const SCRIPT_PATH = path.resolve("hooks/dist/context-pressure-check.js");

describe("context-pressure-check integration", () => {
  let tmpDir: string;
  let contextDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pressure-test-"));
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

  it("exits with code 0 when context-pressure.json does not exist", () => {
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("returns info advisory when usedPercentage >= 60 and lastNotifiedLevel is none", () => {
    fs.writeFileSync(
      path.join(contextDir, "context-pressure.json"),
      JSON.stringify({
        usedPercentage: 65,
        timestamp: "2026-02-20T12:00:00Z",
        lastNotifiedLevel: "none",
      }),
    );
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain("60%");
    expect(output.hookSpecificOutput.additionalContext).toContain(
      "/claude-praxis:compound",
    );
  });

  it("returns urgent advisory when usedPercentage >= 75 and lastNotifiedLevel is not urgent", () => {
    fs.writeFileSync(
      path.join(contextDir, "context-pressure.json"),
      JSON.stringify({
        usedPercentage: 78,
        timestamp: "2026-02-20T12:00:00Z",
        lastNotifiedLevel: "info",
      }),
    );
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain("75%");
    expect(output.hookSpecificOutput.additionalContext).toContain("urgent");
  });

  it("returns empty when usedPercentage < 60", () => {
    fs.writeFileSync(
      path.join(contextDir, "context-pressure.json"),
      JSON.stringify({
        usedPercentage: 45,
        timestamp: "2026-02-20T12:00:00Z",
        lastNotifiedLevel: "none",
      }),
    );
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("does not re-notify info level when already notified", () => {
    fs.writeFileSync(
      path.join(contextDir, "context-pressure.json"),
      JSON.stringify({
        usedPercentage: 65,
        timestamp: "2026-02-20T12:00:00Z",
        lastNotifiedLevel: "info",
      }),
    );
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("does not re-notify urgent level when already notified", () => {
    fs.writeFileSync(
      path.join(contextDir, "context-pressure.json"),
      JSON.stringify({
        usedPercentage: 80,
        timestamp: "2026-02-20T12:00:00Z",
        lastNotifiedLevel: "urgent",
      }),
    );
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("escalates lastNotifiedLevel to info after info notification", () => {
    fs.writeFileSync(
      path.join(contextDir, "context-pressure.json"),
      JSON.stringify({
        usedPercentage: 65,
        timestamp: "2026-02-20T12:00:00Z",
        lastNotifiedLevel: "none",
      }),
    );
    runHook({ session_id: "test" });
    const updated = JSON.parse(
      fs.readFileSync(path.join(contextDir, "context-pressure.json"), "utf-8"),
    );
    expect(updated.lastNotifiedLevel).toBe("info");
  });

  it("escalates lastNotifiedLevel to urgent after urgent notification", () => {
    fs.writeFileSync(
      path.join(contextDir, "context-pressure.json"),
      JSON.stringify({
        usedPercentage: 80,
        timestamp: "2026-02-20T12:00:00Z",
        lastNotifiedLevel: "info",
      }),
    );
    runHook({ session_id: "test" });
    const updated = JSON.parse(
      fs.readFileSync(path.join(contextDir, "context-pressure.json"), "utf-8"),
    );
    expect(updated.lastNotifiedLevel).toBe("urgent");
  });

  it("degrades gracefully when context-pressure.json is corrupt", () => {
    fs.writeFileSync(
      path.join(contextDir, "context-pressure.json"),
      "not json",
    );
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("always exits with code 0", () => {
    const result = runHook({ session_id: "test" });
    expect(result.exitCode).toBe(0);
  });
});
