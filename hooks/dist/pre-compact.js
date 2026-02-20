import * as path from "node:path";
import { readStdin, writeJson } from "./lib/io.js";
import { trimProgressFile, updateCompactTimestamp, readCompoundLastRun, writeLastCompact, getProgressSummary, } from "./lib/context-files.js";
import { parseFileConfidence } from "./lib/confidence-parser.js";
import * as fs from "node:fs";
try {
    await readStdin();
}
catch {
    // stdin may be empty or malformed — proceed anyway
}
const contextDir = path.join(process.cwd(), ".claude", "context");
// Capture progress summary BEFORE trimming (so we get full state)
const progressSummary = getProgressSummary(path.join(contextDir, "progress.md"), 3);
// Existing behavior: trim and timestamp
trimProgressFile(path.join(contextDir, "progress.md"), 10);
updateCompactTimestamp(path.join(contextDir, "task_plan.md"));
// Determine if /compound was run since last compact
const compoundLastRun = readCompoundLastRun(contextDir);
let compoundRun = false;
if (compoundLastRun) {
    const lastCompactPath = path.join(contextDir, "last-compact.json");
    if (fs.existsSync(lastCompactPath)) {
        const stat = fs.statSync(lastCompactPath);
        compoundRun = new Date(compoundLastRun.timestamp) > stat.mtime;
    }
    else {
        compoundRun = true;
    }
}
// Aggregate confidence summary across all learnings files
const learningsFiles = [
    "learnings-feature-spec.md",
    "learnings-design.md",
    "learnings-coding.md",
];
let totalEntries = 0;
let totalConfirmed = 0;
let totalUnverified = 0;
for (const name of learningsFiles) {
    const filePath = path.join(contextDir, name);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const stats = parseFileConfidence(content);
        totalEntries += stats.totalEntries;
        totalConfirmed += stats.confirmedEntries > 0
            ? stats.avgConfirmed * stats.confirmedEntries
            : 0;
        totalUnverified += stats.unverifiedCount;
    }
}
const confirmedEntries = totalEntries - totalUnverified;
const avgConfirmed = confirmedEntries > 0 ? totalConfirmed / confirmedEntries : 0;
// Write last-compact.json
writeLastCompact(contextDir, {
    timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    compoundRun,
    progressSummary,
    confidenceSummary: {
        totalEntries,
        avgConfirmed,
        unverifiedCount: totalUnverified,
    },
});
writeJson({ hookSpecificOutput: {} });
