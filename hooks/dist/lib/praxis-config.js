import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";
import { getString } from "./types.js";
const DEFAULT_GLOBAL_LEARNINGS_PATH = path.join(homedir(), ".claude", "learnings", "global-learnings.md");
function resolveConfigPath(cwd, rawPath) {
    if (rawPath.startsWith("~/")) {
        return path.join(homedir(), rawPath.slice(2));
    }
    if (path.isAbsolute(rawPath)) {
        return rawPath;
    }
    return path.join(cwd, rawPath);
}
export function loadPraxisConfig(cwd) {
    const configPath = path.join(cwd, ".claude", "praxis.json");
    try {
        const raw = fs.readFileSync(configPath, "utf-8");
        const parsed = JSON.parse(raw);
        const globalPath = getString(parsed, "globalLearningsPath");
        if (globalPath.length > 0) {
            return { globalLearningsPath: resolveConfigPath(cwd, globalPath) };
        }
        return { globalLearningsPath: DEFAULT_GLOBAL_LEARNINGS_PATH };
    }
    catch {
        return { globalLearningsPath: DEFAULT_GLOBAL_LEARNINGS_PATH };
    }
}
