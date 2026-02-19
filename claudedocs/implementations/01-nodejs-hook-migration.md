# Implementation Plan: Node.js Hook Migration

Design Doc: `claudedocs/design-docs/01-nodejs-hook-migration.md`

## Prerequisites

- Node.js (Claude Code depends on it, so already present)
- No existing package.json, tsconfig.json, or vitest.config in the project

## Overview

6 Bash hooks → TypeScript source (`hooks/src/`) + built JS (`hooks/dist/`), tested with vitest. Each step is TDD: write failing tests first, then implement.

**Shared constants across all hooks:**
- `MARKER_DIR = "/tmp/claude-praxis-markers"`
- `CONTEXT_DIR = ".claude/context"`

---

## Step 1: Project Infrastructure + Type Definitions

**Goal:** Set up TypeScript, vitest, build pipeline, and hook I/O type definitions. After this step, `npm run typecheck`, `npm run test`, and `npm run build` all work (with zero tests).

### Files to Create

1. **`package.json`** (project root)
   ```json
   {
     "private": true,
     "type": "module",
     "scripts": {
       "build": "tsc",
       "typecheck": "tsc --noEmit",
       "lint": "eslint hooks/src/ tests/",
       "test": "vitest run",
       "test:watch": "vitest"
     },
     "devDependencies": {
       "typescript": "^5.x",
       "vitest": "^3.x",
       "@typescript-eslint/parser": "^8.x",
       "@typescript-eslint/eslint-plugin": "^8.x",
       "eslint": "^9.x"
     }
   }
   ```

2. **`tsconfig.json`** (project root)
   - `strict: true`
   - `target: "ES2022"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`
   - `outDir: "hooks/dist"`, `rootDir: "hooks/src"`
   - Output `.mjs` files (set in package.json `"type": "module"` or use tsconfig option)
   - `include: ["hooks/src/**/*.ts"]`

3. **`vitest.config.ts`** (project root)
   - Test files in `tests/unit/**/*.test.ts` and `tests/integration/**/*.test.ts`

4. **`hooks/src/lib/types.ts`** — Hook input/output type definitions
   - Based on Claude Code hook spec (14 events)
   - Types needed for our 6 hooks:

   ```
   BaseHookInput { session_id, transcript_path, cwd, permission_mode }
   SessionStartInput extends BaseHookInput { hook_event_name: "SessionStart" }
   PreToolUseInput extends BaseHookInput { hook_event_name: "PreToolUse", tool_name, tool_input }
   PostToolUseInput extends BaseHookInput { hook_event_name: "PostToolUse", tool_name, tool_input }
   StopInput extends BaseHookInput { hook_event_name: "Stop", stop_hook_active }
   TaskCompletedInput extends BaseHookInput { hook_event_name: "TaskCompleted", task_subject }
   PreCompactInput extends BaseHookInput { hook_event_name: "PreCompact" }

   HookOutput { hookSpecificOutput? }
   PreToolUseOutput { hookSpecificOutput: { hookEventName, permissionDecision, permissionDecisionReason } }
   StopOutput { decision: "block", reason: string }
   ```

5. **`eslint.config.mjs`** (project root) — ESLint flat config for TypeScript

### Verification
```bash
npm install
npm run typecheck  # should pass (types only, no logic)
npm run test       # should pass (0 tests)
npm run build      # should produce hooks/dist/lib/types.mjs
```

### Estimated Lines: ~120

---

## Step 2: Core Libraries + Unit Tests

**Goal:** Build the shared libraries that all hooks use. TDD: tests first.

### Files to Create (in order)

**Tests first (RED):**

1. **`tests/unit/io.test.ts`**
   - `readStdin<T>()` — parses valid JSON, returns typed result
   - `readStdin<T>()` — throws on invalid JSON
   - `writeJson()` — outputs JSON to stdout
   - `exitDeny()` — writes to stderr and calls process.exit(2)
   - Note: stdin tests require piping to the function; use a helper or mock stdin

2. **`tests/unit/markers.test.ts`**
   - `markerExists(sessionId)` — returns false when no marker
   - `appendSkillMarker(sessionId, skillName)` — creates file, appends skill
   - `appendSkillMarker()` — appends multiple skills on separate lines
   - `hasSkill(sessionId, skillName)` — returns true when skill in marker (substring match)
   - `hasSkill()` — returns false for missing skill
   - `touchMarker(path)` — creates empty marker file
   - `markerExists(path)` — returns true after touch
   - `cleanSessionMarkers(sessionId)` — removes all session-related markers
   - Use real temp dir for tests (no mocks)

3. **`tests/unit/file-type.test.ts`**
   - `classifyFile("file.ts")` → `"code"`
   - `classifyFile("file.tsx")` → `"code"`
   - `classifyFile("file.py")` → `"code"`
   - `classifyFile("file.sh")` → `"code"`
   - `classifyFile("README.md")` → `"document"`
   - `classifyFile("file.txt")` → `"document"`
   - `classifyFile("config.json")` → `"config"`
   - `classifyFile("file.yaml")` → `"config"`
   - `classifyFile(".gitignore")` → `"config"`
   - `classifyFile("file.unknown")` → `"unknown"`
   - `classifyFile("")` → `"unknown"`
   - `classifyFile("no-extension")` → `"unknown"`
   - Case insensitive: `classifyFile("FILE.TS")` → `"code"`
   - Full extension list from check-skill-gate.sh:
     - code: ts, tsx, js, jsx, mjs, cjs, py, sh, bash, zsh, css, scss, less, html, vue, svelte, go, rs, java, kt, swift, c, cpp, h, hpp, rb, php, sql, r, lua, pl, ex, exs, erl, hs, ml, fs, cs, vb, dart, scala, groovy, clj, nim, zig, v, d
     - document: md, txt, rst, adoc, tex, org, wiki, asciidoc
     - config: json, yaml, yml, toml, ini, env, xml, csv, tsv, lock, conf, cfg, properties, editorconfig, gitignore, gitattributes, dockerignore, npmrc, nvmrc

**Implementation (GREEN):**

4. **`hooks/src/lib/io.ts`**
   - `readStdin<T>(): Promise<T>` — buffer stdin, JSON.parse, return typed
   - `writeJson(data: unknown): void` — JSON.stringify to stdout
   - `exitDeny(reason: string): never` — stderr + process.exit(2)
   - `exitAllow(): void` — process.exit(0)

5. **`hooks/src/lib/markers.ts`**
   - `MARKER_DIR` constant
   - `appendSkillMarker(sessionId, skillName)` — mkdir -p + append line
   - `hasSkill(sessionId, skillName)` — read file, check substring
   - `markerExists(markerPath)` — fs.existsSync
   - `touchMarker(markerPath)` — mkdir -p + writeFile empty
   - `cleanSessionMarkers(sessionId)` — rm matching files

6. **`hooks/src/lib/file-type.ts`**
   - `FileType = "code" | "document" | "config" | "unknown"`
   - `classifyFile(filePath: string): FileType` — extension map lookup
   - Data-driven: `Map<string, FileType>` populated from extension lists

### Verification
```bash
npm run typecheck
npm run lint
npm run test  # all unit tests pass
npm run build
```

### Estimated Lines: ~350

---

## Step 3: mark-skill-invoked + task-completed-gate Migration

**Goal:** Migrate the two simplest hooks. After this step, these hooks run as Node.js via hooks.json.

### Current Behavior Reference

**mark-skill-invoked.sh** (30 lines):
- Reads stdin → extracts session_id and skill name via python3
- If either is empty → exit 0 (do nothing)
- Appends skill name to `$MARKER_DIR/$SESSION_ID`
- Always exit 0

**task-completed-gate.sh** (57 lines):
- Reads stdin → extracts session_id and task_subject via python3
- If either is empty → exit 0 (permissive fallback)
- Hashes task_subject (first 12 chars of md5)
- Checks marker `$MARKER_DIR/$SESSION_ID-task-$HASH`
- If marker exists → exit 0 (allow, this is a retry)
- If no marker → create marker, stderr message, exit 2 (block)

### Files to Create (in order)

**Tests first (RED):**

1. **`tests/integration/mark-skill-invoked.test.ts`** — 7 test cases:
   - Skill invocation creates marker file
   - Multiple skills append correctly (2 lines in marker)
   - Empty session_id does not create marker
   - Empty skill name does not create marker
   - Missing skill field does not create marker
   - Exit code is always 0
   - Malformed JSON → exit 0 (no error)

2. **`tests/integration/task-completed-gate.test.ts`** — 9 test cases:
   - First completion attempt → exit 2 (block), stderr mentions "verification"
   - Second attempt same task → exit 0 (allow)
   - Different task same session → exit 2 (blocked independently)
   - Same task different session → exit 2 (blocked)
   - Empty session_id → exit 0 (permissive)
   - Empty task_subject → exit 0 (permissive)
   - Marker file created on first block (verify hash path)
   - Stderr includes task subject name
   - Malformed JSON → exit 0 (permissive)

   Integration test pattern: `execSync('node hooks/dist/mark-skill-invoked.mjs', { input: jsonString })`, check exit code, stdout, stderr.

**Implementation (GREEN):**

3. **`hooks/src/mark-skill-invoked.ts`** — Entry point
   - readStdin → extract session_id, tool_input.skill
   - If empty → exit 0
   - appendSkillMarker(sessionId, skillName) → exit 0

4. **`hooks/src/task-completed-gate.ts`** — Entry point
   - readStdin → extract session_id, task_subject
   - If empty → exit 0 (permissive)
   - Hash task_subject: `crypto.createHash('md5').update(taskSubject).digest('hex').slice(0, 12)`
   - Check marker → if exists, exit 0
   - Create marker → stderr message → exit 2

**Config update:**

5. **`hooks/hooks.json`** — Update 2 entries:
   - PostToolUse (Skill): `"command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/dist/mark-skill-invoked.mjs\""`
   - TaskCompleted: `"command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/dist/task-completed-gate.mjs\""`

**Delete:**
- `hooks/mark-skill-invoked.sh`
- `hooks/task-completed-gate.sh`
- `tests/mark-skill-invoked.test.sh`
- `tests/task-completed-gate.test.sh`

### Critical Behavior to Preserve
- mark-skill-invoked: always exit 0, even on errors
- task-completed-gate: permissive fallback (exit 0) on missing fields/parse errors
- task-completed-gate: md5 hash must produce same output as Bash version for same input
- task-completed-gate: stderr message format: "Task completion blocked for: {subject}. Run verification..."

### Verification
```bash
npm run typecheck
npm run lint
npm run test       # unit + integration tests pass
npm run build      # dist/ updated
```

### Estimated Lines: ~300

---

## Step 4: stop-verification-gate + check-skill-gate Migration

**Goal:** Migrate the two gate hooks. check-skill-gate is the most complex hook (deny-by-default + side effects).

### Current Behavior Reference

**stop-verification-gate.sh** (54 lines):
- Reads stdin → extracts session_id, stop_hook_active via python3
- If session_id empty → exit 0 (allow)
- If stop_hook_active === true → exit 0 (loop prevention)
- If no code-session marker → exit 0 (non-code session)
- If verification-before-completion in skill marker → exit 0 (verified)
- Otherwise → stdout JSON `{ "decision": "block", "reason": "..." }`
- Always exit 0 (Stop hook uses stdout JSON for blocking, not exit code)

**check-skill-gate.sh** (88 lines):
- **Deny-by-default**: JSON parse failure → exit 2; empty session_id → exit 2
- Reads stdin → extracts session_id, tool_input.file_path via python3
- Classifies file extension → code/document/config/unknown
- Config/unknown → exit 0 (no gate)
- Code → requires "code-quality-rules" in marker
- Document → requires "document-quality-rules" in marker
- If skill present in marker → exit 0
  - **Side effect**: if code file, touch `$SESSION_ID-code-session` marker
- If skill missing → stdout JSON with `permissionDecision: "deny"`

### Files to Create (in order)

**Tests first (RED):**

1. **`tests/integration/stop-verification-gate.test.ts`** — 10 test cases:
   - Allow when no code-session marker (non-code session)
   - Block when code-session exists but verification not done
   - Allow when code-session exists AND verification skill invoked
   - Allow when stop_hook_active is true (loop prevention)
   - Allow when session_id is empty
   - Verification with short skill name (no prefix) accepted
   - Exit code is always 0
   - Block message includes actionable guidance
   - Unrelated skill does not satisfy verification gate
   - JSON parse failure → allow (Stop hook is not deny-by-default)

2. **`tests/integration/check-skill-gate.test.ts`** — 14 test cases:
   - Deny when code-quality-rules NOT invoked (code file edit)
   - Allow when code-quality-rules IS invoked
   - Block when session_id is empty (exit 2, deny-by-default)
   - Unrelated skill does not satisfy code-quality-rules gate
   - document-quality-rules gate for .md files
   - Deny .md when only code-quality-rules invoked
   - Allow with short name (no prefix)
   - Config files pass without any skill
   - Both skills invoked → both file types allowed
   - Block when JSON parse fails (exit 2, deny-by-default)
   - code-session marker written on allowed code file edit
   - code-session marker NOT written for document file edit
   - code-session marker NOT written for config file edit
   - Block when tool_input has no file_path → empty ext → unknown → exit 0

**Implementation (GREEN):**

3. **`hooks/src/stop-verification-gate.ts`** — Entry point
   - readStdin → extract session_id, stop_hook_active
   - Chain of checks: empty → allow, loop prevention → allow, no code-session → allow, verified → allow
   - Else → writeJson block decision

4. **`hooks/src/check-skill-gate.ts`** — Entry point
   - readStdin with try/catch → catch = exit 2 (deny-by-default)
   - Extract session_id (empty → exit 2), file_path
   - classifyFile → determine required skill
   - Config/unknown → exit 0
   - Check marker → if present, exit 0 (+ code-session side effect for code files)
   - Else → writeJson with permissionDecision deny

**Config update:**

5. **`hooks/hooks.json`** — Update 2 entries:
   - Stop: `"command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/dist/stop-verification-gate.mjs\""`
   - PreToolUse: `"command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/dist/check-skill-gate.mjs\""`

**Delete:**
- `hooks/stop-verification-gate.sh`
- `hooks/check-skill-gate.sh`
- `tests/stop-verification-gate.test.sh`
- `tests/check-skill-gate.test.sh`

### Critical Behavior to Preserve
- check-skill-gate: **deny-by-default** — JSON parse failure = exit 2, empty session_id = exit 2
- check-skill-gate: code-session marker side effect when code file edit is allowed
- check-skill-gate: deny JSON structure exactly: `{ "hookSpecificOutput": { "hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "..." } }`
- stop-verification-gate: uses stdout JSON for blocking, NOT exit code (always exit 0)
- stop-verification-gate: stop JSON structure: `{ "decision": "block", "reason": "..." }`
- Both: substring match for skill names (supports both "code-quality-rules" and "claude-praxis:code-quality-rules")

### Verification
```bash
npm run typecheck
npm run lint
npm run test       # all tests pass
npm run build
```

### Estimated Lines: ~400

---

## Step 5: context-files Library + pre-compact Migration

**Goal:** Build the context-files library (needed by session-start) and migrate pre-compact.

### Current Behavior Reference

**pre-compact.sh** (52 lines):
- Trims `.claude/context/progress.md` to last 10 entries (entries start with `## `)
- Updates "Last compacted:" timestamp in `.claude/context/task_plan.md`
  - If line exists → replace
  - If not → insert after first line (title)
- Outputs `{ "hookSpecificOutput": {} }`

### Files to Create (in order)

**Tests first (RED):**

1. **`tests/unit/context-files.test.ts`**
   - `detectPersistenceFiles(contextDir)` — returns list of found files with metadata
   - Detects task_plan.md, progress.md, learnings.md
   - Returns mtime for each file
   - Returns entry count for progress.md (count `## ` headers)
   - Returns empty list when directory doesn't exist
   - Detects global-learnings.md from home directory

2. **`tests/integration/pre-compact.test.ts`**
   - progress.md with 15 entries → trimmed to 10
   - progress.md with 5 entries → unchanged
   - progress.md doesn't exist → no error
   - task_plan.md with existing "Last compacted:" → updated
   - task_plan.md without "Last compacted:" → inserted after first line
   - task_plan.md doesn't exist → no error
   - Output JSON structure: `{ "hookSpecificOutput": {} }`
   - Exit code is 0

   Integration tests use a temp directory as cwd.

**Implementation (GREEN):**

3. **`hooks/src/lib/context-files.ts`**
   - `detectPersistenceFiles(contextDir, globalLearningsPath)` — check existence, get mtime, count entries
   - `trimProgressFile(filePath, maxEntries)` — keep last N `## ` entries
   - `updateCompactTimestamp(filePath)` — update or insert "Last compacted:" line

4. **`hooks/src/pre-compact.ts`** — Entry point
   - trimProgressFile(progress, 10)
   - updateCompactTimestamp(taskPlan)
   - writeJson `{ hookSpecificOutput: {} }`

**Config update:**

5. **`hooks/hooks.json`** — Update PreCompact entry

**Delete:**
- `hooks/pre-compact.sh`

### Critical Behavior to Preserve
- progress.md trimming: entries start with `## `, keep top 10 (most recent)
- task_plan.md: ISO 8601 UTC timestamp format `YYYY-MM-DDTHH:MM:SSZ`
- task_plan.md: "Last compacted:" line replacement (existing) or insertion after line 1 (new)
- Output exactly `{ "hookSpecificOutput": {} }`

### Verification
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### Estimated Lines: ~300

---

## Step 6: session-start Migration + Final Cleanup

**Goal:** Migrate the largest hook, finalize hooks.json, build and commit dist/.

### Current Behavior Reference

**session-start.sh** (75 lines):
- Extracts session_id via python3
- Cleans markers: `$SESSION_ID`, `$SESSION_ID-stop-blocks`, `$SESSION_ID-code-session`, `$SESSION_ID-task-*`
- Reads `skills/getting-started/SKILL.md`, strips frontmatter (`---` delimiters)
- Detects persistence files in `.claude/context/` and `$HOME/.claude/learnings/global-learnings.md`
  - For each: file name, mod time (`stat -f '%Sm'` macOS / `stat -c '%y'` Linux)
  - For progress.md: also counts `## ` entries
- Appends "Persistence Files Available" section to skill content
- Escapes content for JSON via python3
- Outputs `{ "hookSpecificOutput": { "additionalContext": <escaped content> } }`

### Files to Create (in order)

**Tests first (RED):**

1. **`tests/integration/session-start.test.ts`**
   - Outputs JSON with additionalContext containing skill content
   - Skill content has frontmatter stripped
   - Session markers cleaned on start
   - Persistence files section appended when files exist
   - progress.md shows entry count
   - No persistence section when no files exist
   - Missing skill file → warning to stderr, exit 0
   - Exit code is always 0
   - Marker cleanup covers: session marker, stop-blocks, code-session, task-* patterns

   Integration tests need temp dir with mock skill file and context files.

**Implementation (GREEN):**

2. **`hooks/src/session-start.ts`** — Entry point
   - readStdin → extract session_id
   - cleanSessionMarkers(sessionId) using markers.ts
   - Read skill file, strip frontmatter (regex: `/^---\n[\s\S]*?\n---\n/`)
   - detectPersistenceFiles() using context-files.ts
   - Append persistence info section to skill content
   - JSON escape via JSON.stringify (replaces python3 json.dumps)
   - writeJson with additionalContext

**Config update:**

3. **`hooks/hooks.json`** — Final update: all 6 entries use `node "${CLAUDE_PLUGIN_ROOT}/hooks/dist/..."`, UserPromptSubmit stays unchanged (it's `type: "prompt"`, not `type: "command"`)

**Delete:**
- `hooks/session-start.sh`

**Final steps:**
- `npm run build` → verify all `.mjs` files in `hooks/dist/`
- Verify `hooks/dist/` structure matches Design Doc
- `tests/phase-detection.test.sh` stays (it tests UserPromptSubmit which is NOT being migrated)

### Critical Behavior to Preserve
- Frontmatter stripping: remove `---...---` block from top of SKILL.md
- Marker cleanup: must clean ALL marker types (skill, stop-blocks, code-session, task-*)
- Persistence file detection: must detect from `.claude/context/` (relative) and `$HOME/.claude/learnings/` (absolute)
- stat replacement: `fs.statSync().mtime` (cross-platform, no more macOS/Linux branching)
- JSON escape: `JSON.stringify()` replaces python3 `json.dumps()`
- Output format: `{ "hookSpecificOutput": { "additionalContext": "..." } }`

### Verification
```bash
npm run typecheck
npm run lint
npm run test       # ALL unit + integration tests pass
npm run build      # dist/ fully populated
```

### Estimated Lines: ~350

---

## Final Verification Checklist

After all 6 steps:

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test` — all tests pass (unit + integration)
- [ ] `npm run build` — dist/ populated with all .mjs files
- [ ] All 6 hooks in hooks.json point to `hooks/dist/*.mjs`
- [ ] No Bash hook files remain (except hooks.json)
- [ ] No python3 dependency in any hook
- [ ] `tests/phase-detection.test.sh` still present (not migrated, UserPromptSubmit)
- [ ] deny-by-default preserved in check-skill-gate
- [ ] code-session marker side effect preserved
- [ ] md5 hash compatibility (task-completed-gate produces same hashes)
- [ ] Cross-platform: no stat/md5 branching
- [ ] dist/ files committed to repo

## Migration Order Summary

| Step | Scope | Key Risk | Est. Lines |
|------|-------|----------|------------|
| 1 | Infrastructure + types | package.json/plugin.json interference | ~120 |
| 2 | Core libraries (io, markers, file-type) | stdin mocking in tests | ~350 |
| 3 | mark-skill-invoked + task-completed-gate | md5 hash compatibility | ~300 |
| 4 | stop-verification-gate + check-skill-gate | deny-by-default + side effects | ~400 |
| 5 | context-files + pre-compact | file trimming edge cases | ~300 |
| 6 | session-start + final cleanup | frontmatter parsing, persistence detection | ~350 |
| **Total** | | | **~1820** |
