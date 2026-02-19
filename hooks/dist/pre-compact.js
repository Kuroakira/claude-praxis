import * as path from "node:path";
import { readStdin, writeJson } from "./lib/io.js";
import { trimProgressFile, updateCompactTimestamp } from "./lib/context-files.js";
try {
    await readStdin();
}
catch {
    // stdin may be empty or malformed — proceed anyway
}
const contextDir = path.join(process.cwd(), ".claude", "context");
trimProgressFile(path.join(contextDir, "progress.md"), 10);
updateCompactTimestamp(path.join(contextDir, "task_plan.md"));
writeJson({ hookSpecificOutput: {} });
