export type LearningsLevel = "feature-spec" | "design" | "coding";
export declare const LEARNINGS_FILES: Record<LearningsLevel, string>;
export declare const PHASE_LEARNINGS_MAP: Record<string, LearningsLevel[]>;
export declare function getLearningsForPhase(phase: string): string[];
