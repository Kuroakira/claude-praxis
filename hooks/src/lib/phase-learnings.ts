export type LearningsLevel = "feature-spec" | "design" | "coding";

export const LEARNINGS_FILES: Record<LearningsLevel, string> = {
  "feature-spec": "learnings-feature-spec.md",
  design: "learnings-design.md",
  coding: "learnings-coding.md",
};

const ALL_FILES: LearningsLevel[] = ["feature-spec", "design", "coding"];

export const PHASE_LEARNINGS_MAP: Record<string, LearningsLevel[]> = {
  "feature-spec": ["feature-spec"],
  design: ["feature-spec", "design"],
  implement: ["design", "coding"],
  debug: ["coding"],
  review: ["design", "coding"],
  research: ALL_FILES,
  plan: ["design", "coding"],
  compound: ALL_FILES,
};

export function getLearningsForPhase(phase: string): string[] {
  const levels = PHASE_LEARNINGS_MAP[phase] ?? ALL_FILES;
  return levels.map((level) => LEARNINGS_FILES[level]);
}
