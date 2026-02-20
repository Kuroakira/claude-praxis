import * as path from "node:path";
import { readStdin, writeJson } from "./lib/io.js";
import { readContextPressure, writeContextPressure } from "./lib/context-files.js";
const THRESHOLD_INFO = 60;
const THRESHOLD_URGENT = 75;
try {
    await readStdin();
}
catch {
    // stdin may be empty or malformed — proceed anyway
}
const contextDir = path.join(process.cwd(), ".claude", "context");
const pressure = readContextPressure(contextDir);
if (!pressure) {
    process.exit(0);
}
const { usedPercentage, lastNotifiedLevel } = pressure;
if (usedPercentage >= THRESHOLD_URGENT && lastNotifiedLevel !== "urgent") {
    writeContextPressure(contextDir, { ...pressure, lastNotifiedLevel: "urgent" });
    writeJson({
        hookSpecificOutput: {
            additionalContext: `Context usage is above ${THRESHOLD_URGENT}% (${usedPercentage}%). Auto-compact is approaching — this is urgent. Run /claude-praxis:compound to preserve knowledge before compact occurs.`,
        },
    });
}
else if (usedPercentage >= THRESHOLD_INFO &&
    lastNotifiedLevel === "none") {
    writeContextPressure(contextDir, { ...pressure, lastNotifiedLevel: "info" });
    writeJson({
        hookSpecificOutput: {
            additionalContext: `Context usage is above ${THRESHOLD_INFO}% (${usedPercentage}%). Consider running /claude-praxis:compound at the next natural break point to preserve learnings.`,
        },
    });
}
