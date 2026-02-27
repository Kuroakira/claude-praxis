import * as path from "node:path";
import { readStdin, writeJson } from "./lib/io.js";
import { getMarkerDir, hasSkill, markerExists } from "./lib/markers.js";
import { getString, getBoolean } from "./lib/types.js";
import { getProgressSummary, readCompoundLastRun, } from "./lib/context-files.js";
function shouldSuggestCompound(contextDir) {
    const summary = getProgressSummary(path.join(contextDir, "progress.md"), 1);
    if (summary.entryCount === 0)
        return false;
    const compoundLastRun = readCompoundLastRun(contextDir);
    if (compoundLastRun)
        return false;
    return true;
}
try {
    const input = await readStdin();
    const sessionId = getString(input, "session_id");
    if (!sessionId) {
        process.exit(0);
    }
    if (getBoolean(input, "stop_hook_active")) {
        process.exit(0);
    }
    const markerDir = getMarkerDir();
    const contextDir = path.join(process.cwd(), ".claude", "context");
    const warnings = [];
    // Implement final-review gate (advisory)
    if (hasSkill(markerDir, sessionId, "implement")) {
        const finalReviewMarker = path.join(markerDir, `${sessionId}-implement-final-review`);
        if (!markerExists(finalReviewMarker)) {
            warnings.push("/implement workflow detected but Final Review has not been completed. Complete Phase 3 (Final Review with Parallel Review Team) before ending.");
        }
    }
    if (warnings.length > 0) {
        writeJson({
            hookSpecificOutput: {
                additionalContext: warnings.join("\n"),
            },
        });
        process.exit(0);
    }
    // Non-blocking advisories: UC + compound (combined when both apply)
    const workflowSkills = ["feature-spec", "design", "implement", "debug"];
    const workflowInvoked = workflowSkills.some((skill) => hasSkill(markerDir, sessionId, skill));
    const suggestUC = workflowInvoked &&
        !hasSkill(markerDir, sessionId, "understanding-check");
    const suggestCompound = shouldSuggestCompound(contextDir);
    const advisories = [];
    if (suggestUC) {
        advisories.push("/understanding-check is available to verify your understanding of the key decisions made during this session.");
    }
    if (suggestCompound) {
        advisories.push("progress.md has entries that have not been promoted to learnings. Consider running /claude-praxis:compound to capture what you learned before ending the session.");
    }
    if (advisories.length > 0) {
        writeJson({
            hookSpecificOutput: {
                additionalContext: advisories.join("\n\n"),
            },
        });
        process.exit(0);
    }
}
catch {
    process.exit(0);
}
