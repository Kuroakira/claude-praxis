import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  appendSkillMarker,
  hasSkill,
  markerExists,
  touchMarker,
  cleanSessionMarkers,
} from "../../hooks/src/lib/markers.js";

describe("markers", () => {
  let testMarkerDir: string;

  beforeEach(() => {
    testMarkerDir = fs.mkdtempSync(path.join(os.tmpdir(), "markers-test-"));
  });

  afterEach(() => {
    fs.rmSync(testMarkerDir, { recursive: true, force: true });
  });

  describe("markerExists", () => {
    it("returns false when no marker exists", () => {
      expect(markerExists(path.join(testMarkerDir, "nonexistent"))).toBe(false);
    });

    it("returns true after touch", () => {
      const markerPath = path.join(testMarkerDir, "test-marker");
      touchMarker(markerPath);
      expect(markerExists(markerPath)).toBe(true);
    });
  });

  describe("touchMarker", () => {
    it("creates empty marker file", () => {
      const markerPath = path.join(testMarkerDir, "test-marker");
      touchMarker(markerPath);
      expect(fs.existsSync(markerPath)).toBe(true);
      expect(fs.readFileSync(markerPath, "utf-8")).toBe("");
    });

    it("creates parent directories", () => {
      const markerPath = path.join(testMarkerDir, "sub", "dir", "marker");
      touchMarker(markerPath);
      expect(fs.existsSync(markerPath)).toBe(true);
    });
  });

  describe("appendSkillMarker", () => {
    it("creates file and appends skill", () => {
      appendSkillMarker(testMarkerDir, "session1", "code-quality-rules");
      const content = fs.readFileSync(
        path.join(testMarkerDir, "session1"),
        "utf-8"
      );
      expect(content).toBe("code-quality-rules\n");
    });

    it("appends multiple skills on separate lines", () => {
      appendSkillMarker(testMarkerDir, "session1", "code-quality-rules");
      appendSkillMarker(testMarkerDir, "session1", "verification-before-completion");
      const content = fs.readFileSync(
        path.join(testMarkerDir, "session1"),
        "utf-8"
      );
      expect(content).toBe(
        "code-quality-rules\nverification-before-completion\n"
      );
    });
  });

  describe("hasSkill", () => {
    it("returns true when skill is in marker", () => {
      appendSkillMarker(testMarkerDir, "session1", "code-quality-rules");
      expect(hasSkill(testMarkerDir, "session1", "code-quality-rules")).toBe(true);
    });

    it("returns false for missing skill", () => {
      appendSkillMarker(testMarkerDir, "session1", "code-quality-rules");
      expect(hasSkill(testMarkerDir, "session1", "verification-before-completion")).toBe(
        false
      );
    });

    it("returns false when no marker file exists", () => {
      expect(hasSkill(testMarkerDir, "nonexistent", "code-quality-rules")).toBe(false);
    });

    it("matches substring (supports prefixed skill names)", () => {
      appendSkillMarker(testMarkerDir, "session1", "claude-praxis:code-quality-rules");
      expect(hasSkill(testMarkerDir, "session1", "code-quality-rules")).toBe(true);
    });
  });

  describe("cleanSessionMarkers", () => {
    it("removes all session-related markers", () => {
      const sessionId = "test-session";
      // Create various marker types
      appendSkillMarker(testMarkerDir, sessionId, "skill1");
      touchMarker(path.join(testMarkerDir, `${sessionId}-code-session`));
      touchMarker(path.join(testMarkerDir, `${sessionId}-stop-blocks`));
      touchMarker(path.join(testMarkerDir, `${sessionId}-task-abc123`));
      touchMarker(path.join(testMarkerDir, `${sessionId}-task-def456`));

      cleanSessionMarkers(testMarkerDir, sessionId);

      expect(fs.existsSync(path.join(testMarkerDir, sessionId))).toBe(false);
      expect(
        fs.existsSync(path.join(testMarkerDir, `${sessionId}-code-session`))
      ).toBe(false);
      expect(
        fs.existsSync(path.join(testMarkerDir, `${sessionId}-stop-blocks`))
      ).toBe(false);
      expect(
        fs.existsSync(path.join(testMarkerDir, `${sessionId}-task-abc123`))
      ).toBe(false);
      expect(
        fs.existsSync(path.join(testMarkerDir, `${sessionId}-task-def456`))
      ).toBe(false);
    });

    it("does not remove other session markers", () => {
      appendSkillMarker(testMarkerDir, "other-session", "skill1");
      cleanSessionMarkers(testMarkerDir, "target-session");
      expect(
        fs.existsSync(path.join(testMarkerDir, "other-session"))
      ).toBe(true);
    });
  });
});
