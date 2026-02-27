import * as path from "node:path";
import { readStdin, writeJson } from "./lib/io.js";
import { getMarkerDir, cleanSessionMarkers } from "./lib/markers.js";
import { detectPersistenceFiles, readLastCompact } from "./lib/context-files.js";
import { loadPraxisConfig } from "./lib/praxis-config.js";
import { getString } from "./lib/types.js";

try {
  const input = await readStdin();
  const sessionId = getString(input, "session_id");

  if (sessionId) {
    cleanSessionMarkers(getMarkerDir(), sessionId);
  }

  const contextDir = path.join(process.cwd(), ".claude", "context");
  const config = loadPraxisConfig(process.cwd());
  const globalLearningsPath = config.globalLearningsPath;
  const persistenceFiles = detectPersistenceFiles(
    contextDir,
    globalLearningsPath,
  );

  const sections: string[] = [];

  if (persistenceFiles.length > 0) {
    const fileLines = persistenceFiles.map((f) => {
      const dateStr = f.mtime.toISOString().replace(/T/, " ").replace(/\..+/, "").slice(0, 16);
      if (f.entryCount !== undefined) {
        const parts = [`${f.entryCount} entries`];
        if (f.avgConfirmed !== undefined && f.avgConfirmed > 0) {
          parts.push(`avg confirmed: ${f.avgConfirmed.toFixed(1)}`);
        }
        if (f.unverifiedCount !== undefined && f.unverifiedCount > 0) {
          parts.push(`${f.unverifiedCount} unverified`);
        }
        parts.push(`updated: ${dateStr}`);
        return `- ${f.name} (${parts.join(", ")})`;
      }
      return `- ${f.name} (updated: ${dateStr})`;
    });

    sections.push(
      `## Persistence Files Available\nThe following context files exist. Read them if relevant to your current task:\n${fileLines.join("\n")}`,
    );
  }

  // Compact recovery guidance
  const lastCompact = readLastCompact(contextDir);
  if (lastCompact) {
    const { compoundRun, progressSummary } = lastCompact;
    const headingsList = progressSummary.recentHeadings.length > 0
      ? ` Recent work: ${progressSummary.recentHeadings.join(", ")}.`
      : "";

    if (compoundRun) {
      sections.push(
        `## Compact Recovery\nCompact occurred. Learnings preserved via /compound. Read persistence files to resume.`,
      );
    } else {
      sections.push(
        `## Compact Recovery\nCompact occurred. ${progressSummary.entryCount} entries in progress.md were not promoted to learnings.${headingsList} Run /claude-praxis:compound to review and preserve knowledge.`,
      );
    }
  }

  if (sections.length > 0) {
    writeJson({
      hookSpecificOutput: {
        additionalContext: sections.join("\n\n"),
      },
    });
  }
} catch {
  process.exit(0);
}
