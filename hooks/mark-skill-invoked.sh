#!/usr/bin/env bash
# PostToolUse hook: records Skill tool invocations to a session-scoped marker file.
# Matcher in hooks.json: "Skill"
# This enables format-independent PreToolUse skill gate checks.

INPUT=$(cat)

# Extract session_id and skill name from hook input
read -r SESSION_ID SKILL_NAME <<< "$(echo "$INPUT" | python3 -c '
import sys, json
data = json.loads(sys.stdin.read())
session_id = data.get("session_id", "")
skill = data.get("tool_input", {}).get("skill", "")
print(session_id, skill)
' 2>/dev/null)"

# Defensive: if session_id or skill name is empty, do nothing
if [ -z "$SESSION_ID" ] || [ -z "$SKILL_NAME" ]; then
  exit 0
fi

# Create marker directory if it doesn't exist
MARKER_DIR="/tmp/claude-praxis-markers"
mkdir -p "$MARKER_DIR" 2>/dev/null

# Append skill name to session marker file
echo "$SKILL_NAME" >> "$MARKER_DIR/$SESSION_ID"

exit 0
