import { readStdin } from "./lib/io.js";
import { appendSkillMarker, getMarkerDir } from "./lib/markers.js";
import { getString, getRecord } from "./lib/types.js";
try {
    const input = await readStdin();
    const sessionId = getString(input, "session_id");
    const toolInput = getRecord(input, "tool_input");
    const skillName = getString(toolInput, "skill");
    if (!sessionId || !skillName) {
        process.exit(0);
    }
    appendSkillMarker(getMarkerDir(), sessionId, skillName);
    process.exit(0);
}
catch {
    process.exit(0);
}
