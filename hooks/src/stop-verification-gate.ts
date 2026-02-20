import * as path from "node:path";
import { readStdin, writeJson } from "./lib/io.js";
import { getMarkerDir, hasSkill, markerExists } from "./lib/markers.js";
import { getString, getBoolean } from "./lib/types.js";
import {
  getProgressSummary,
  readCompoundLastRun,
} from "./lib/context-files.js";
import type { StopBlockOutput } from "./lib/types.js";

function shouldSuggestCompound(contextDir: string): boolean {
  const summary = getProgressSummary(path.join(contextDir, "progress.md"), 1);
  if (summary.entryCount === 0) return false;

  const compoundLastRun = readCompoundLastRun(contextDir);
  if (compoundLastRun) return false;

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
  const codeSessionMarker = path.join(markerDir, `${sessionId}-code-session`);
  const contextDir = path.join(process.cwd(), ".claude", "context");

  // Verification gate (blocking)
  if (markerExists(codeSessionMarker)) {
    if (!hasSkill(markerDir, sessionId, "verification-before-completion")) {
      const output: StopBlockOutput = {
        decision: "block",
        reason:
          "Code changes detected but verification-before-completion has not been invoked. Run typecheck, lint, and tests, then invoke the verification-before-completion skill before completing.",
      };
      writeJson(output);
      process.exit(0);
    }
  }

  // /compound advisory (non-blocking)
  if (shouldSuggestCompound(contextDir)) {
    writeJson({
      hookSpecificOutput: {
        additionalContext:
          "progress.md has entries that have not been promoted to learnings. Consider running /claude-praxis:compound to capture what you learned before ending the session.",
      },
    });
    process.exit(0);
  }
} catch {
  process.exit(0);
}
