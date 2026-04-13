export const LEARNINGS_FILES = {
    "feature-spec": "learnings-feature-spec.md",
    design: "learnings-design.md",
    coding: "learnings-coding.md",
};
const ALL_FILES = ["feature-spec", "design", "coding"];
export const PHASE_LEARNINGS_MAP = {
    "feature-spec": ["feature-spec"],
    design: ["feature-spec", "design"],
    investigate: ["coding"],
    review: ["design", "coding"],
    research: ALL_FILES,
    plan: ["design", "coding"],
    eval: ALL_FILES,
};
export function getLearningsForPhase(phase) {
    const levels = PHASE_LEARNINGS_MAP[phase] ?? ALL_FILES;
    return levels.map((level) => LEARNINGS_FILES[level]);
}
