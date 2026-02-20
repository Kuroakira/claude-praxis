import { describe, it, expect } from "vitest";
import {
  LEARNINGS_FILES,
  PHASE_LEARNINGS_MAP,
  getLearningsForPhase,
} from "../../hooks/src/lib/phase-learnings.js";

describe("LEARNINGS_FILES", () => {
  it("contains exactly 3 file names", () => {
    const files = Object.values(LEARNINGS_FILES);
    expect(files).toHaveLength(3);
  });

  it("maps feature-spec, design, and coding levels", () => {
    expect(LEARNINGS_FILES["feature-spec"]).toBe(
      "learnings-feature-spec.md",
    );
    expect(LEARNINGS_FILES["design"]).toBe("learnings-design.md");
    expect(LEARNINGS_FILES["coding"]).toBe("learnings-coding.md");
  });
});

describe("PHASE_LEARNINGS_MAP", () => {
  it("covers all 8 phases", () => {
    const phases = [
      "feature-spec",
      "design",
      "implement",
      "debug",
      "review",
      "research",
      "plan",
      "compound",
    ];
    for (const phase of phases) {
      expect(PHASE_LEARNINGS_MAP).toHaveProperty(phase);
    }
  });
});

describe("getLearningsForPhase", () => {
  it("returns feature-spec file for feature-spec phase", () => {
    expect(getLearningsForPhase("feature-spec")).toEqual([
      "learnings-feature-spec.md",
    ]);
  });

  it("returns feature-spec + design files for design phase", () => {
    expect(getLearningsForPhase("design")).toEqual([
      "learnings-feature-spec.md",
      "learnings-design.md",
    ]);
  });

  it("returns design + coding files for implement phase", () => {
    expect(getLearningsForPhase("implement")).toEqual([
      "learnings-design.md",
      "learnings-coding.md",
    ]);
  });

  it("returns coding file for debug phase", () => {
    expect(getLearningsForPhase("debug")).toEqual(["learnings-coding.md"]);
  });

  it("returns design + coding files for review phase", () => {
    expect(getLearningsForPhase("review")).toEqual([
      "learnings-design.md",
      "learnings-coding.md",
    ]);
  });

  it("returns all 3 files for research phase", () => {
    expect(getLearningsForPhase("research")).toEqual([
      "learnings-feature-spec.md",
      "learnings-design.md",
      "learnings-coding.md",
    ]);
  });

  it("returns design + coding files for plan phase", () => {
    expect(getLearningsForPhase("plan")).toEqual([
      "learnings-design.md",
      "learnings-coding.md",
    ]);
  });

  it("returns all 3 files for compound phase", () => {
    expect(getLearningsForPhase("compound")).toEqual([
      "learnings-feature-spec.md",
      "learnings-design.md",
      "learnings-coding.md",
    ]);
  });

  it("returns all 3 files for unknown phase (safe fallback)", () => {
    expect(getLearningsForPhase("unknown-phase")).toEqual([
      "learnings-feature-spec.md",
      "learnings-design.md",
      "learnings-coding.md",
    ]);
  });
});
