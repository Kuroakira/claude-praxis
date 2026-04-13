import { readStdin, writeJson } from "./lib/io.js";
import { getMarkerDir, hasSkill } from "./lib/markers.js";
import { getString, getBoolean } from "./lib/types.js";
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
    // Non-blocking advisories: UC
    const workflowSkills = ["feature-spec", "design", "investigate"];
    const workflowInvoked = workflowSkills.some((skill) => hasSkill(markerDir, sessionId, skill));
    const suggestUC = workflowInvoked &&
        !hasSkill(markerDir, sessionId, "understanding-check");
    const advisories = [];
    if (suggestUC) {
        advisories.push("/understanding-check is available to verify your understanding of the key decisions made during this session.");
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
