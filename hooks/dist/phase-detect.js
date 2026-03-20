import { readStdin, writeJson } from "./lib/io.js";
import { getString } from "./lib/types.js";
import { detectPhase } from "./lib/phase-patterns.js";
try {
    const input = await readStdin();
    const prompt = getString(input, "prompt");
    const result = detectPhase(prompt);
    writeJson({
        hookSpecificOutput: {
            hookEventName: "UserPromptSubmit",
            additionalContext: result,
        },
    });
}
catch {
    // Any failure → safe pass-through (never block user input)
    writeJson({
        hookSpecificOutput: {
            hookEventName: "UserPromptSubmit",
            additionalContext: "",
        },
    });
}
