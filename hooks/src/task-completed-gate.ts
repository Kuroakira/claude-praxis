import * as crypto from "node:crypto";
import * as path from "node:path";
import { readStdin } from "./lib/io.js";
import { getMarkerDir, markerExists, touchMarker } from "./lib/markers.js";
import { getString } from "./lib/types.js";

try {
  const input = await readStdin();
  const sessionId = getString(input, "session_id");
  const taskSubject = getString(input, "task_subject");

  if (!sessionId || !taskSubject) {
    process.exit(0);
  }

  const markerDir = getMarkerDir();
  const taskHash = crypto
    .createHash("md5")
    .update(taskSubject)
    .digest("hex")
    .slice(0, 12);
  const markerPath = path.join(markerDir, `${sessionId}-task-${taskHash}`);

  if (markerExists(markerPath)) {
    process.exit(0);
  }

  touchMarker(markerPath);
  process.stderr.write(
    `Task completion blocked for: ${taskSubject}. Run verification (typecheck, lint, test) and include output before marking this task complete.\n`,
  );
  process.exit(2);
} catch {
  process.exit(0);
}
