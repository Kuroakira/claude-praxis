#!/usr/bin/env bash
# Session start hook: injects the getting-started skill at every session start,
# cleans skill invocation markers, and notifies about context persistence files
# (existence only, NOT content).
# Triggered on: startup, resume, clear, compact

# Read hook input (stdin) to extract session_id for marker cleanup
HOOK_INPUT=$(cat)
SESSION_ID="$(echo "$HOOK_INPUT" | python3 -c '
import sys, json
data = json.loads(sys.stdin.read())
print(data.get("session_id", ""))
' 2>/dev/null)"

# Clean marker files for this session (ensures clean slate on new/resumed session)
if [ -n "$SESSION_ID" ]; then
  rm -f "/tmp/claude-praxis-markers/$SESSION_ID" 2>/dev/null
  rm -f "/tmp/claude-praxis-markers/$SESSION_ID-stop-blocks" 2>/dev/null
  rm -f "/tmp/claude-praxis-markers/$SESSION_ID-code-session" 2>/dev/null
  rm -f "/tmp/claude-praxis-markers/$SESSION_ID-task-"* 2>/dev/null
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_FILE="$SCRIPT_DIR/../skills/getting-started/SKILL.md"

if [ ! -f "$SKILL_FILE" ]; then
  echo "Warning: getting-started skill not found at $SKILL_FILE" >&2
  exit 0
fi

# Read skill content, strip frontmatter
SKILL_CONTENT=$(sed '/^---$/,/^---$/d' "$SKILL_FILE")

# --- Context persistence file notifications ---
CONTEXT_DIR=".claude/context"
GLOBAL_LEARNINGS="$HOME/.claude/learnings/global-learnings.md"
PERSISTENCE_INFO=""

if [ -d "$CONTEXT_DIR" ]; then
  for file in task_plan.md progress.md learnings.md; do
    filepath="$CONTEXT_DIR/$file"
    if [ -f "$filepath" ]; then
      mod_time=$(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$filepath" 2>/dev/null || stat -c '%y' "$filepath" 2>/dev/null | cut -d. -f1)
      if [ "$file" = "progress.md" ]; then
        entry_count=$(grep -c '^## ' "$filepath" 2>/dev/null || echo 0)
        PERSISTENCE_INFO="${PERSISTENCE_INFO}\n- ${file} (${entry_count} entries, updated: ${mod_time})"
      else
        PERSISTENCE_INFO="${PERSISTENCE_INFO}\n- ${file} (updated: ${mod_time})"
      fi
    fi
  done
fi

if [ -f "$GLOBAL_LEARNINGS" ]; then
  mod_time=$(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$GLOBAL_LEARNINGS" 2>/dev/null || stat -c '%y' "$GLOBAL_LEARNINGS" 2>/dev/null | cut -d. -f1)
  PERSISTENCE_INFO="${PERSISTENCE_INFO}\n- global-learnings.md (updated: ${mod_time})"
fi

# Append persistence notification to skill content if files exist
if [ -n "$PERSISTENCE_INFO" ]; then
  PERSISTENCE_SECTION="\n\n## Persistence Files Available\nThe following context files exist. Read them if relevant to your current task:${PERSISTENCE_INFO}"
  SKILL_CONTENT="${SKILL_CONTENT}${PERSISTENCE_SECTION}"
fi

# Escape for JSON
ESCAPED_CONTENT=$(echo "$SKILL_CONTENT" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')

cat <<EOF
{
  "hookSpecificOutput": {
    "additionalContext": $ESCAPED_CONTENT
  }
}
EOF
