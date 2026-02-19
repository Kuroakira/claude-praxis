import * as path from "node:path";
import { readStdin, writeJson, exitDeny } from "./lib/io.js";
import { getMarkerDir, hasSkill, touchMarker } from "./lib/markers.js";
import { classifyFile } from "./lib/file-type.js";
import { getString, getRecord } from "./lib/types.js";
let input;
try {
    input = await readStdin();
}
catch {
    exitDeny("check-skill-gate: JSON parse failed. Input may be malformed. Disable the claude-praxis plugin temporarily if this persists.");
}
const sessionId = getString(input, "session_id");
if (!sessionId) {
    exitDeny("check-skill-gate: session_id extraction failed. Cannot verify skill gate. Disable the claude-praxis plugin temporarily if this persists.");
}
const toolInput = getRecord(input, "tool_input");
const filePath = getString(toolInput, "file_path");
const fileType = classifyFile(filePath);
if (fileType === "config" || fileType === "unknown") {
    process.exit(0);
}
const requiredSkill = fileType === "code" ? "code-quality-rules" : "document-quality-rules";
const isCodeFile = fileType === "code";
const markerDir = getMarkerDir();
if (hasSkill(markerDir, sessionId, requiredSkill)) {
    if (isCodeFile) {
        touchMarker(path.join(markerDir, `${sessionId}-code-session`));
    }
    process.exit(0);
}
const ext = filePath ? filePath.slice(filePath.lastIndexOf(".") + 1) : "";
const output = {
    hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `${requiredSkill} skill has not been invoked in this session. Invoke it before editing ${ext} files.`,
    },
};
writeJson(output);
