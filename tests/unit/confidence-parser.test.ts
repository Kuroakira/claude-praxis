import { describe, it, expect } from "vitest";
import {
  parseConfirmed,
  formatConfirmed,
  createInitial,
  incrementConfirmed,
  mergeConfirmed,
  parseFileConfidence,
  type ConfidenceMetadata,
} from "../../hooks/src/lib/confidence-parser.js";

describe("confidence-parser", () => {
  describe("parseConfirmed", () => {
    it("parses a valid Confirmed field", () => {
      const result = parseConfirmed(
        "- **Confirmed**: 4回 | 2026-02-18 | implement, design, review",
      );
      expect(result).toEqual({
        count: 4,
        lastConfirmed: "2026-02-18",
        phases: ["implement", "design", "review"],
      });
    });

    it("parses a single-phase entry", () => {
      const result = parseConfirmed(
        "- **Confirmed**: 1回 | 2026-02-20 | compound",
      );
      expect(result).toEqual({
        count: 1,
        lastConfirmed: "2026-02-20",
        phases: ["compound"],
      });
    });

    it("returns null for a line without Confirmed field", () => {
      const result = parseConfirmed(
        "- **Learning**: Some learning content",
      );
      expect(result).toBeNull();
    });

    it("returns null for malformed Confirmed field (missing parts)", () => {
      const result = parseConfirmed("- **Confirmed**: 4回 | 2026-02-18");
      expect(result).toBeNull();
    });

    it("returns null for non-numeric count", () => {
      const result = parseConfirmed(
        "- **Confirmed**: abc回 | 2026-02-18 | implement",
      );
      expect(result).toBeNull();
    });

    it("trims whitespace in phases", () => {
      const result = parseConfirmed(
        "- **Confirmed**: 2回 | 2026-02-18 |  implement ,  design ",
      );
      expect(result).toEqual({
        count: 2,
        lastConfirmed: "2026-02-18",
        phases: ["implement", "design"],
      });
    });
  });

  describe("formatConfirmed", () => {
    it("formats metadata into Confirmed field string", () => {
      const meta: ConfidenceMetadata = {
        count: 4,
        lastConfirmed: "2026-02-18",
        phases: ["implement", "design", "review"],
      };
      expect(formatConfirmed(meta)).toBe(
        "- **Confirmed**: 4回 | 2026-02-18 | implement, design, review",
      );
    });

    it("formats single-phase metadata", () => {
      const meta: ConfidenceMetadata = {
        count: 1,
        lastConfirmed: "2026-02-20",
        phases: ["compound"],
      };
      expect(formatConfirmed(meta)).toBe(
        "- **Confirmed**: 1回 | 2026-02-20 | compound",
      );
    });
  });

  describe("createInitial", () => {
    it("creates initial metadata with count 1", () => {
      const result = createInitial("implement", "2026-02-20");
      expect(result).toEqual({
        count: 1,
        lastConfirmed: "2026-02-20",
        phases: ["implement"],
      });
    });
  });

  describe("incrementConfirmed", () => {
    it("increments count and updates date", () => {
      const existing: ConfidenceMetadata = {
        count: 2,
        lastConfirmed: "2026-02-15",
        phases: ["implement"],
      };
      const result = incrementConfirmed(existing, "design", "2026-02-20");
      expect(result).toEqual({
        count: 3,
        lastConfirmed: "2026-02-20",
        phases: ["implement", "design"],
      });
    });

    it("does not duplicate an existing phase", () => {
      const existing: ConfidenceMetadata = {
        count: 3,
        lastConfirmed: "2026-02-15",
        phases: ["implement", "design"],
      };
      const result = incrementConfirmed(existing, "implement", "2026-02-20");
      expect(result).toEqual({
        count: 4,
        lastConfirmed: "2026-02-20",
        phases: ["implement", "design"],
      });
    });
  });

  describe("mergeConfirmed", () => {
    it("returns empty metadata for empty array", () => {
      const result = mergeConfirmed([]);
      expect(result).toEqual({
        count: 0,
        lastConfirmed: "",
        phases: [],
      });
    });

    it("sums counts and unions phases for dedup merge", () => {
      const a: ConfidenceMetadata = {
        count: 3,
        lastConfirmed: "2026-02-10",
        phases: ["implement", "design"],
      };
      const b: ConfidenceMetadata = {
        count: 2,
        lastConfirmed: "2026-02-18",
        phases: ["design", "review"],
      };
      const result = mergeConfirmed([a, b]);
      expect(result).toEqual({
        count: 5,
        lastConfirmed: "2026-02-18",
        phases: ["implement", "design", "review"],
      });
    });

    it("handles single entry", () => {
      const a: ConfidenceMetadata = {
        count: 2,
        lastConfirmed: "2026-02-10",
        phases: ["implement"],
      };
      const result = mergeConfirmed([a]);
      expect(result).toEqual(a);
    });

    it("handles three entries", () => {
      const entries: ConfidenceMetadata[] = [
        { count: 1, lastConfirmed: "2026-01-01", phases: ["implement"] },
        { count: 2, lastConfirmed: "2026-02-15", phases: ["design"] },
        { count: 3, lastConfirmed: "2026-02-10", phases: ["review"] },
      ];
      const result = mergeConfirmed(entries);
      expect(result).toEqual({
        count: 6,
        lastConfirmed: "2026-02-15",
        phases: ["implement", "design", "review"],
      });
    });
  });

  describe("parseFileConfidence", () => {
    it("extracts confidence stats from file content with Confirmed fields", () => {
      const content = [
        "# Learnings",
        "## Entry 1",
        "- **Learning**: something",
        "- **Confirmed**: 4回 | 2026-02-18 | implement, design",
        "## Entry 2",
        "- **Learning**: another",
        "- **Confirmed**: 2回 | 2026-02-15 | review",
      ].join("\n");

      const result = parseFileConfidence(content);
      expect(result).toEqual({
        totalEntries: 2,
        confirmedEntries: 2,
        unverifiedCount: 0,
        avgConfirmed: 3.0,
      });
    });

    it("counts unverified entries (no Confirmed field)", () => {
      const content = [
        "# Learnings",
        "## Entry 1",
        "- **Learning**: has confidence",
        "- **Confirmed**: 2回 | 2026-02-18 | implement",
        "## Entry 2",
        "- **Learning**: no confidence",
        "- **Implication**: still relevant",
      ].join("\n");

      const result = parseFileConfidence(content);
      expect(result).toEqual({
        totalEntries: 2,
        confirmedEntries: 1,
        unverifiedCount: 1,
        avgConfirmed: 2.0,
      });
    });

    it("returns zero stats for empty file", () => {
      const result = parseFileConfidence("# Learnings\n");
      expect(result).toEqual({
        totalEntries: 0,
        confirmedEntries: 0,
        unverifiedCount: 0,
        avgConfirmed: 0,
      });
    });

    it("returns avgConfirmed 0 when all entries are unverified", () => {
      const content = [
        "# Learnings",
        "## Entry 1",
        "- **Learning**: no confidence",
        "## Entry 2",
        "- **Learning**: also no confidence",
      ].join("\n");

      const result = parseFileConfidence(content);
      expect(result).toEqual({
        totalEntries: 2,
        confirmedEntries: 0,
        unverifiedCount: 2,
        avgConfirmed: 0,
      });
    });

    it("handles malformed Confirmed field gracefully (treats as unverified)", () => {
      const content = [
        "# Learnings",
        "## Entry 1",
        "- **Learning**: has bad confidence",
        "- **Confirmed**: broken format",
        "## Entry 2",
        "- **Learning**: valid",
        "- **Confirmed**: 3回 | 2026-02-18 | design",
      ].join("\n");

      const result = parseFileConfidence(content);
      expect(result).toEqual({
        totalEntries: 2,
        confirmedEntries: 1,
        unverifiedCount: 1,
        avgConfirmed: 3.0,
      });
    });
  });
});
