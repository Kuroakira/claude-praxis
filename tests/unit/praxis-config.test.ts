import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { loadPraxisConfig } from "../../hooks/src/lib/praxis-config.js";

describe("loadPraxisConfig", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "praxis-config-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeConfig(content: string): void {
    const configDir = path.join(tmpDir, ".claude");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "praxis.json"), content);
  }

  it("returns defaults when config file does not exist", () => {
    const config = loadPraxisConfig(tmpDir);
    const expectedDefault = path.join(
      os.homedir(),
      ".claude",
      "learnings",
      "global-learnings.md",
    );
    expect(config.globalLearningsPath).toBe(expectedDefault);
  });

  it("returns specified globalLearningsPath", () => {
    writeConfig(JSON.stringify({ globalLearningsPath: "/custom/path/gl.md" }));
    const config = loadPraxisConfig(tmpDir);
    expect(config.globalLearningsPath).toBe("/custom/path/gl.md");
  });

  it("returns default when globalLearningsPath is not specified", () => {
    writeConfig(JSON.stringify({}));
    const config = loadPraxisConfig(tmpDir);
    const expectedDefault = path.join(
      os.homedir(),
      ".claude",
      "learnings",
      "global-learnings.md",
    );
    expect(config.globalLearningsPath).toBe(expectedDefault);
  });

  it("resolves relative path from cwd", () => {
    writeConfig(
      JSON.stringify({ globalLearningsPath: "relative/path/gl.md" }),
    );
    const config = loadPraxisConfig(tmpDir);
    expect(config.globalLearningsPath).toBe(
      path.join(tmpDir, "relative/path/gl.md"),
    );
  });

  it("expands ~ prefix to home directory", () => {
    writeConfig(
      JSON.stringify({ globalLearningsPath: "~/custom/learnings.md" }),
    );
    const config = loadPraxisConfig(tmpDir);
    expect(config.globalLearningsPath).toBe(
      path.join(os.homedir(), "custom/learnings.md"),
    );
  });

  it("returns defaults on malformed JSON without throwing", () => {
    writeConfig("not valid json {{{");
    const config = loadPraxisConfig(tmpDir);
    const expectedDefault = path.join(
      os.homedir(),
      ".claude",
      "learnings",
      "global-learnings.md",
    );
    expect(config.globalLearningsPath).toBe(expectedDefault);
  });

  it("returns defaults when globalLearningsPath is not a string", () => {
    writeConfig(JSON.stringify({ globalLearningsPath: 42 }));
    const config = loadPraxisConfig(tmpDir);
    const expectedDefault = path.join(
      os.homedir(),
      ".claude",
      "learnings",
      "global-learnings.md",
    );
    expect(config.globalLearningsPath).toBe(expectedDefault);
  });
});
