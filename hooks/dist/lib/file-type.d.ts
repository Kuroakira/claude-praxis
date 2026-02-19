export type FileType = "code" | "document" | "config" | "unknown";
export declare function classifyFile(filePath: string): FileType;
