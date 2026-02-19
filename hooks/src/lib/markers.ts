import * as fs from "node:fs";
import * as path from "node:path";

const DEFAULT_MARKER_DIR = "/tmp/claude-praxis-markers";

export function getMarkerDir(): string {
  return process.env.CLAUDE_PRAXIS_MARKER_DIR ?? DEFAULT_MARKER_DIR;
}

export function appendSkillMarker(
  markerDir: string,
  sessionId: string,
  skillName: string,
): void {
  fs.mkdirSync(markerDir, { recursive: true });
  fs.appendFileSync(path.join(markerDir, sessionId), skillName + "\n");
}

export function hasSkill(
  markerDir: string,
  sessionId: string,
  skillName: string,
): boolean {
  const markerPath = path.join(markerDir, sessionId);
  if (!fs.existsSync(markerPath)) return false;
  const content = fs.readFileSync(markerPath, "utf-8");
  return content.includes(skillName);
}

export function markerExists(markerPath: string): boolean {
  return fs.existsSync(markerPath);
}

export function touchMarker(markerPath: string): void {
  fs.mkdirSync(path.dirname(markerPath), { recursive: true });
  fs.writeFileSync(markerPath, "");
}

export function cleanSessionMarkers(
  markerDir: string,
  sessionId: string,
): void {
  if (!fs.existsSync(markerDir)) return;
  const files = fs.readdirSync(markerDir);
  for (const file of files) {
    if (file === sessionId || file.startsWith(sessionId + "-")) {
      fs.unlinkSync(path.join(markerDir, file));
    }
  }
}
