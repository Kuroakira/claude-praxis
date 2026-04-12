import { describe, it, expect } from "vitest";
import { detectPhase } from "../../hooks/src/lib/phase-patterns.js";

describe("detectPhase", () => {
  describe("slash command detection (highest priority)", () => {
    it("detects /design slash command", () => {
      expect(detectPhase("/design")).toContain("Phase detected: design");
    });

    it("prioritizes slash command over keyword patterns", () => {
      const result = detectPhase("/design this plan");
      expect(result).toContain("Phase detected: design");
    });
  });

  describe("existing keyword detection (regression)", () => {
    it("detects investigate phase from English keyword", () => {
      expect(detectPhase("I found a bug in the code")).toContain("Phase detected: investigate");
    });

    it("detects investigate phase from Japanese keyword", () => {
      expect(detectPhase("バグがあります")).toContain("Phase detected: investigate");
    });

    it("detects feature-spec phase", () => {
      expect(detectPhase("Let's define the requirements")).toContain("Phase detected: feature-spec");
    });

    it("detects research phase", () => {
      expect(detectPhase("I want to research this topic")).toContain("Phase detected: research");
    });

    it("detects plan phase", () => {
      expect(detectPhase("Let's plan the next steps")).toContain("Phase detected: plan");
    });

    it("detects review phase", () => {
      expect(detectPhase("Please review this code")).toContain("Phase detected: review");
    });

    it("returns empty string for unmatched input", () => {
      expect(detectPhase("hello world")).toBe("");
    });
  });

  describe("DD4: compound pattern detection", () => {
    it("detects plan when 'Design Doc' + implementation intent (Japanese)", () => {
      const result = detectPhase("Design Docに従って実装プランを作成して");
      expect(result).toContain("Phase detected: plan");
    });

    it("detects plan when 'design doc' + 'implement' (English)", () => {
      const result = detectPhase("Follow the design doc and implement the plan");
      expect(result).toContain("Phase detected: plan");
    });

    it("detects plan for Japanese implementation request", () => {
      const result = detectPhase("実装して");
      expect(result).toContain("Phase detected: plan");
    });

    it("detects design when creation intent is present (Japanese)", () => {
      const result = detectPhase("設計ドキュメントを作成して");
      expect(result).toContain("Phase detected: design");
    });

    it("detects design when 'create a design doc' (English)", () => {
      const result = detectPhase("Create a design doc for the auth system");
      expect(result).toContain("Phase detected: design");
    });

    it("detects design for 'build a design system' (design + system, not plan)", () => {
      const result = detectPhase("Design a system API for authentication");
      expect(result).toContain("Phase detected: design");
    });
  });

  describe("DD4: known ambiguities (advisory-only, documented trade-offs)", () => {
    // "design doc" + implementation intent (実装) → plan wins over design override
    // "実装の設計 Design Doc を作成して" contains both signals; plan override is first.
    // Advisory-only so misclassification has limited impact.
    it("resolves 'implement design doc creation' to plan (plan override takes priority)", () => {
      const result = detectPhase("実装の設計 Design Docを作成して");
      expect(result).toContain("Phase detected: plan");
    });
  });

  describe("DD5: advisory message includes description", () => {
    it("includes description for plan phase (from implementation keyword)", () => {
      const result = detectPhase("実装して");
      expect(result).toContain(" — ");
      expect(result).toContain("thorough implementation plan");
    });

    it("includes description for design phase", () => {
      const result = detectPhase("設計ドキュメントを作成して");
      expect(result).toContain("Design Doc with research, per-axis evaluation, and review");
    });

    it("includes description for investigate phase", () => {
      const result = detectPhase("バグがあります");
      expect(result).toContain("systematic diagnosis with parallel investigation");
    });

    it("includes description for eval phase", () => {
      const result = detectPhase("evaluate the last command");
      expect(result).toContain("evaluate and improve framework skills");
    });
  });

  describe("design-review pivot: implement/compound removed, eval added", () => {
    it("no longer detects /implement slash command", () => {
      const result = detectPhase("/implement");
      expect(result).not.toContain("Phase detected: implement");
    });

    it("no longer detects /compound slash command", () => {
      const result = detectPhase("/compound");
      expect(result).not.toContain("Phase detected: compound");
    });

    it("detects eval phase from English keyword", () => {
      const result = detectPhase("Let's evaluate the last command");
      expect(result).toContain("Phase detected: eval");
      expect(result).toContain("/claude-praxis:eval");
    });

    it("detects eval phase from Japanese keyword", () => {
      const result = detectPhase("スキルを改善して");
      expect(result).toContain("Phase detected: eval");
    });

    it("detects /eval slash command", () => {
      const result = detectPhase("/eval");
      expect(result).toContain("Phase detected: eval");
    });

    it("implementation keywords now route to plan phase", () => {
      const result = detectPhase("build a new authentication feature");
      expect(result).toContain("Phase detected: plan");
    });

    it("routes Japanese implementation request to plan", () => {
      const result = detectPhase("実装して");
      expect(result).toContain("Phase detected: plan");
    });
  });
});
