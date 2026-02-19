export interface PersistenceFileInfo {
    name: string;
    mtime: Date;
    entryCount?: number;
}
export declare function detectPersistenceFiles(contextDir: string, globalLearningsPath?: string): PersistenceFileInfo[];
export declare function trimProgressFile(filePath: string, maxEntries: number): void;
export declare function updateCompactTimestamp(filePath: string): void;
