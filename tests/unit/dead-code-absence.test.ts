import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const HOOKS_SRC = path.resolve("hooks/src");
const HOOKS_JSON = path.resolve("hooks/hooks.json");
const TYPES_FILE = path.resolve("hooks/src/lib/types.ts");

describe("dead code absence", () => {
  it("hooks.json does not reference check-skill-gate", () => {
    const content = fs.readFileSync(HOOKS_JSON, "utf-8");
    expect(content).not.toContain("check-skill-gate");
  });

  it("no source file imports from check-skill-gate", () => {
    const files = fs
      .readdirSync(HOOKS_SRC, { recursive: true })
      .map((f) => path.join(HOOKS_SRC, String(f)))
      .filter((f) => f.endsWith(".ts") && !f.includes("check-skill-gate"));

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} imports check-skill-gate`).not.toMatch(
        /check-skill-gate/,
      );
    }
  });

  it("check-skill-gate source file does not exist", () => {
    expect(
      fs.existsSync(path.join(HOOKS_SRC, "check-skill-gate.ts")),
    ).toBe(false);
  });

  it("check-skill-gate compiled files do not exist", () => {
    const distDir = path.resolve("hooks/dist");
    expect(
      fs.existsSync(path.join(distDir, "check-skill-gate.js")),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(distDir, "check-skill-gate.d.ts")),
    ).toBe(false);
  });

  it("TaskCompletedInput is not defined in types.ts", () => {
    const content = fs.readFileSync(TYPES_FILE, "utf-8");
    expect(content).not.toContain("TaskCompletedInput");
  });

  it("no source file references TaskCompletedInput", () => {
    const files = fs
      .readdirSync(HOOKS_SRC, { recursive: true })
      .map((f) => path.join(HOOKS_SRC, String(f)))
      .filter((f) => f.endsWith(".ts"));

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} references TaskCompletedInput`).not.toMatch(
        /TaskCompletedInput/,
      );
    }
  });
});
