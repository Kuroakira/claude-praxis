import { describe, it, expect } from "vitest";
import { detectPhase } from "../../hooks/src/lib/phase-patterns.js";

describe("detectPhase", () => {
  describe("slash command detection (highest priority)", () => {
    it("detects /implement slash command", () => {
      expect(detectPhase("/implement")).toContain("Phase detected: implement");
    });

    it("detects /design slash command", () => {
      expect(detectPhase("/design")).toContain("Phase detected: design");
    });

    it("prioritizes slash command over keyword patterns", () => {
      const result = detectPhase("/implement this design doc");
      expect(result).toContain("Phase detected: implement");
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

    it("detects compound phase", () => {
      expect(detectPhase("Let's do a retrospective")).toContain("Phase detected: compound");
    });

    it("returns empty string for unmatched input", () => {
      expect(detectPhase("hello world")).toBe("");
    });
  });

  describe("DD4: compound pattern detection", () => {
    it("detects implement when 'Design Doc' + implementation intent (Japanese)", () => {
      const result = detectPhase("Design Docに従って実装プランを作成して");
      expect(result).toContain("Phase detected: implement");
    });

    it("detects implement when 'DesignDoc' (no space) + implementation intent (Japanese)", () => {
      const result = detectPhase("このDesignDocの実装プランをclaudedocs/implementationsに作成して");
      expect(result).toContain("Phase detected: implement");
    });

    it("detects implement when 'design doc' + 'implement' (English)", () => {
      const result = detectPhase("Follow the design doc and implement the plan");
      expect(result).toContain("Phase detected: implement");
    });

    it("detects implement when 'design doc' + 'implementation' keyword (English)", () => {
      const result = detectPhase("Based on the design doc, create an implementation plan");
      expect(result).toContain("Phase detected: implement");
    });

    it("detects design when creation intent is present (Japanese)", () => {
      const result = detectPhase("設計ドキュメントを作成して");
      expect(result).toContain("Phase detected: design");
    });

    it("detects design when 'create a design doc' (English)", () => {
      const result = detectPhase("Create a design doc for the auth system");
      expect(result).toContain("Phase detected: design");
    });

    it("detects implement for Japanese implementation request", () => {
      const result = detectPhase("実装して");
      expect(result).toContain("Phase detected: implement");
    });

    it("detects design for 'build a design system' (design + system, not implement)", () => {
      const result = detectPhase("Design a system API for authentication");
      expect(result).toContain("Phase detected: design");
    });
  });

  describe("DD4: known ambiguities (advisory-only, documented trade-offs)", () => {
    // When both compound overrides match, implement wins by array position.
    // This prioritizes the more common case ("Design Doc に従って実装プラン")
    // over the less common case ("Create a design doc for the implementation").
    // Acceptable because phase detection is advisory-only (not blocking).
    it("resolves to implement when design doc creation + implementation topic overlap", () => {
      const result = detectPhase("Create a design doc for the implementation");
      expect(result).toContain("Phase detected: implement");
    });

    // Design Doc line 142: "実装の設計 Design Doc を作成して" is ambiguous
    // Contains both "design doc + implement" and "design + create" signals
    it("resolves 'implement design doc creation' per override priority", () => {
      const result = detectPhase("実装の設計 Design Docを作成して");
      expect(result).toContain("Phase detected: implement");
    });
  });

  describe("DD5: advisory message includes description", () => {
    it("includes description for implement phase", () => {
      const result = detectPhase("実装して");
      expect(result).toContain(" — ");
      expect(result).toContain("TDD-driven development with graduated review");
    });

    it("includes description for design phase", () => {
      const result = detectPhase("設計ドキュメントを作成して");
      expect(result).toContain("Design Doc with research, per-axis evaluation, and review");
    });

    it("includes description for investigate phase", () => {
      const result = detectPhase("バグがあります");
      expect(result).toContain("systematic diagnosis with parallel investigation");
    });

    it("includes description in slash command output", () => {
      const result = detectPhase("/implement");
      expect(result).toContain("TDD-driven development with graduated review");
    });
  });
});
