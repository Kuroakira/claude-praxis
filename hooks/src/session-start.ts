import * as fs from "node:fs";
import * as path from "node:path";
import { readStdin, writeJson } from "./lib/io.js";
import { getMarkerDir, cleanSessionMarkers } from "./lib/markers.js";
import { detectPersistenceFiles } from "./lib/context-files.js";
import { loadPraxisConfig } from "./lib/praxis-config.js";
import { getString } from "./lib/types.js";

try {
  const input = await readStdin();
  const sessionId = getString(input, "session_id");

  if (sessionId) {
    cleanSessionMarkers(getMarkerDir(), sessionId);
  }

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const skillFile = path.join(
    pluginRoot,
    "skills",
    "getting-started",
    "SKILL.md",
  );

  if (!fs.existsSync(skillFile)) {
    process.stderr.write(`Warning: getting-started skill not found at ${skillFile}\n`);
    process.exit(0);
  }

  let skillContent = fs.readFileSync(skillFile, "utf-8");

  // Strip frontmatter (--- delimited block at top)
  skillContent = skillContent.replace(/^---\n[\s\S]*?\n---\n/, "");

  // Detect persistence files
  const contextDir = path.join(process.cwd(), ".claude", "context");
  const config = loadPraxisConfig(process.cwd());
  const globalLearningsPath = config.globalLearningsPath;
  const persistenceFiles = detectPersistenceFiles(
    contextDir,
    globalLearningsPath,
  );

  if (persistenceFiles.length > 0) {
    const fileLines = persistenceFiles.map((f) => {
      const dateStr = f.mtime.toISOString().replace(/T/, " ").replace(/\..+/, "").slice(0, 16);
      if (f.entryCount !== undefined) {
        return `- ${f.name} (${f.entryCount} entries, updated: ${dateStr})`;
      }
      return `- ${f.name} (updated: ${dateStr})`;
    });

    skillContent += `\n\n## Persistence Files Available\nThe following context files exist. Read them if relevant to your current task:\n${fileLines.join("\n")}`;
  }

  writeJson({
    hookSpecificOutput: {
      additionalContext: skillContent,
    },
  });
} catch {
  process.exit(0);
}
