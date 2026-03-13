import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SDD_SKILL = path.resolve(
  "skills/subagent-driven-development/SKILL.md",
);

describe("context priming content in SDD SKILL.md", () => {
  const content = fs.readFileSync(SDD_SKILL, "utf-8");

  const templateMatch = content.match(
    /## Implementer Prompt Template[\s\S]*?```\n([\s\S]*?)```/,
  );

  function getControllerSection(): string {
    const match = content.match(
      /## Controller Responsibilities[\s\S]*?(?=\n## )/,
    );
    if (!match) throw new Error("Controller Responsibilities section not found");
    return match[0];
  }

  function getReviewSection(): string {
    const match = content.match(/## Review Dispatch[\s\S]*?(?=\n## )/);
    if (!match) throw new Error("Review Dispatch section not found");
    return match[0];
  }

  it("Implementer Prompt Template contains a code block", () => {
    expect(templateMatch).not.toBeNull();
  });

  it("Shared Context section exists in Implementer Prompt Template", () => {
    if (!templateMatch) throw new Error("Template block not found");
    expect(templateMatch[1]).toContain("## Shared Context");
  });

  it("Shared Context appears between ## Task and ## Context in template", () => {
    if (!templateMatch) throw new Error("Template block not found");
    const block = templateMatch[1];
    const taskIndex = block.indexOf("## Task");
    const sharedIndex = block.indexOf("## Shared Context");
    const contextIndex = block.indexOf("## Context");
    expect(taskIndex).toBeGreaterThanOrEqual(0);
    expect(sharedIndex).toBeGreaterThan(taskIndex);
    expect(sharedIndex).toBeLessThan(contextIndex);
  });

  it("Controller Responsibilities includes shared file identification via set intersection", () => {
    const section = getControllerSection();
    expect(section).toContain("set intersection");
    expect(section).toContain("shared files");
  });

  it("token budget section exists with a numeric limit", () => {
    expect(content).toMatch(/## .*[Tt]oken [Bb]udget/);
    expect(content).toContain("30,000 tokens");
  });

  it("sharing-frequency priority for budget overflow", () => {
    expect(content).toContain("referenced by more tasks");
  });

  it("fallback to path reference when budget exceeded", () => {
    expect(content).toMatch(/fall\s*back.*path ref/i);
  });

  it("Review Dispatch section does NOT contain Shared Context or Context Priming", () => {
    const section = getReviewSection();
    expect(section).not.toContain("Shared Context");
    expect(section).not.toContain("Context Priming");
  });

  it("Context section instructs to list only task-specific files", () => {
    if (!templateMatch) throw new Error("Template block not found");
    expect(templateMatch[1]).toMatch(/task.specific/i);
  });
});
