export interface PhasePattern {
    phase: string;
    command: string;
    description: string;
    patterns: RegExp[];
}
export declare const PHASE_PATTERNS: PhasePattern[];
export declare function detectPhase(message: string): string;
