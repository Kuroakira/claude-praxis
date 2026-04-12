import * as fs from "node:fs";
import * as path from "node:path";
import { readStdin } from "./lib/io.js";
import { getMarkerDir, cleanSessionMarkers } from "./lib/markers.js";
import { detectPersistenceFiles, readLastCompact } from "./lib/context-files.js";
import { loadPraxisConfig } from "./lib/praxis-config.js";
import { getString } from "./lib/types.js";
try {
    const input = await readStdin();
    const sessionId = getString(input, "session_id");
    if (sessionId) {
        cleanSessionMarkers(getMarkerDir(), sessionId);
    }
    const contextDir = path.join(process.cwd(), ".claude", "context");
    fs.mkdirSync(contextDir, { recursive: true });
    const config = loadPraxisConfig(process.cwd());
    const globalLearningsPath = config.globalLearningsPath;
    const persistenceFiles = detectPersistenceFiles(contextDir, globalLearningsPath);
    const sections = [];
    if (persistenceFiles.length > 0) {
        const fileLines = persistenceFiles.map((f) => {
            const displayName = f.name === "global-learnings.md"
                ? f.name
                : `.claude/context/${f.name}`;
            const dateStr = f.mtime.toISOString().replace(/T/, " ").replace(/\..+/, "").slice(0, 16);
            if (f.entryCount !== undefined) {
                const parts = [`${f.entryCount} entries`];
                if (f.avgConfirmed !== undefined && f.avgConfirmed > 0) {
                    parts.push(`avg confirmed: ${f.avgConfirmed.toFixed(1)}`);
                }
                if (f.unverifiedCount !== undefined && f.unverifiedCount > 0) {
                    parts.push(`${f.unverifiedCount} unverified`);
                }
                parts.push(`updated: ${dateStr}`);
                return `- ${displayName} (${parts.join(", ")})`;
            }
            return `- ${displayName} (updated: ${dateStr})`;
        });
        sections.push(`## Persistence Files Available\nThe following context files exist. Read them if relevant to your current task:\n${fileLines.join("\n")}`);
    }
    // Compact recovery guidance
    const lastCompact = readLastCompact(contextDir);
    if (lastCompact) {
        sections.push(`## Compact Recovery\nCompact occurred. Read persistence files to resume.`);
    }
    if (sections.length > 0) {
        // SessionStart has no hookSpecificOutput schema — output as plain text
        // (plain text stdout is injected into additionalContext by Claude Code)
        process.stdout.write(sections.join("\n\n") + "\n");
    }
}
catch {
    process.exit(0);
}
