import * as path from "node:path";
import { readStdin, writeJson } from "./lib/io.js";
import { getMarkerDir, hasSkill, markerExists } from "./lib/markers.js";
import { getString, getBoolean } from "./lib/types.js";
import type { StopBlockOutput } from "./lib/types.js";

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

  if (!markerExists(codeSessionMarker)) {
    process.exit(0);
  }

  if (hasSkill(markerDir, sessionId, "verification-before-completion")) {
    process.exit(0);
  }

  const output: StopBlockOutput = {
    decision: "block",
    reason:
      "Code changes detected but verification-before-completion has not been invoked. Run typecheck, lint, and tests, then invoke the verification-before-completion skill before completing.",
  };
  writeJson(output);
} catch {
  process.exit(0);
}
