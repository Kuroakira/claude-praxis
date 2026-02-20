export interface ConfidenceMetadata {
    count: number;
    lastConfirmed: string;
    phases: string[];
}
export interface FileConfidenceStats {
    totalEntries: number;
    confirmedEntries: number;
    unverifiedCount: number;
    avgConfirmed: number;
}
export declare function parseConfirmed(line: string): ConfidenceMetadata | null;
export declare function formatConfirmed(meta: ConfidenceMetadata): string;
export declare function createInitial(phase: string, date: string): ConfidenceMetadata;
export declare function incrementConfirmed(existing: ConfidenceMetadata, phase: string, date: string): ConfidenceMetadata;
export declare function mergeConfirmed(entries: ConfidenceMetadata[]): ConfidenceMetadata;
export declare function parseFileConfidence(content: string): FileConfidenceStats;
