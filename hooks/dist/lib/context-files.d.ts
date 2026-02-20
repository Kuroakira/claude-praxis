export interface PersistenceFileInfo {
    name: string;
    mtime: Date;
    entryCount?: number;
    avgConfirmed?: number;
    unverifiedCount?: number;
}
export interface CompoundLastRun {
    timestamp: string;
    promotedCount: number;
}
export interface ProgressSummary {
    entryCount: number;
    recentHeadings: string[];
}
export interface ConfidenceSummary {
    totalEntries: number;
    avgConfirmed: number;
    unverifiedCount: number;
}
export interface LastCompact {
    timestamp: string;
    compoundRun: boolean;
    progressSummary: ProgressSummary;
    confidenceSummary: ConfidenceSummary;
}
export interface ContextPressure {
    usedPercentage: number;
    timestamp: string;
    lastNotifiedLevel: "none" | "info" | "urgent";
}
export declare function detectPersistenceFiles(contextDir: string, globalLearningsPath?: string): PersistenceFileInfo[];
export declare function trimProgressFile(filePath: string, maxEntries: number): void;
export declare function updateCompactTimestamp(filePath: string): void;
export declare function readCompoundLastRun(contextDir: string): CompoundLastRun | null;
export declare function writeCompoundLastRun(contextDir: string, data: CompoundLastRun): void;
export declare function readLastCompact(contextDir: string): LastCompact | null;
export declare function writeLastCompact(contextDir: string, data: LastCompact): void;
export declare function readContextPressure(contextDir: string): ContextPressure | null;
export declare function writeContextPressure(contextDir: string, data: ContextPressure): void;
export declare function getProgressSummary(filePath: string, maxHeadings: number): ProgressSummary;
