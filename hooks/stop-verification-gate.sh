#!/usr/bin/env bash
# Stop hook: context-aware verification gate.
# - No code-session marker → allow (brainstorm/research session, no verification needed)
# - stop_hook_active=true → allow (loop prevention)
# - verification-before-completion skill invoked → allow (verified)
# - Otherwise → block with guidance
#
# Depends on: check-skill-gate.sh writing code-session marker on code file edits.
# Counter-based approach is removed; replaced by marker-based context awareness.

MARKER_DIR="/tmp/claude-praxis-markers"

INPUT=$(cat)

# Extract session_id and stop_hook_active from hook input
PARSED="$(echo "$INPUT" | python3 -c '
import sys, json
data = json.loads(sys.stdin.read())
print(data.get("session_id", ""))
print(str(data.get("stop_hook_active", False)).lower())
' 2>/dev/null)"

SESSION_ID="$(echo "$PARSED" | sed -n '1p')"
STOP_HOOK_ACTIVE="$(echo "$PARSED" | sed -n '2p')"

# If session_id is unavailable, allow stop
if [ -z "$SESSION_ID" ]; then
  exit 0
fi

# Loop prevention: if already in a stop hook cycle, allow
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# No code-session marker → no code changes in this session → no verification needed
if [ ! -f "$MARKER_DIR/$SESSION_ID-code-session" ]; then
  exit 0
fi

# Code changes exist — check if verification-before-completion was invoked
SKILL_MARKER="$MARKER_DIR/$SESSION_ID"
if [ -f "$SKILL_MARKER" ] && grep -q "verification-before-completion" "$SKILL_MARKER"; then
  exit 0
fi

# Block: code changes exist but verification not done
cat <<EOF
{
  "decision": "block",
  "reason": "Code changes detected but verification-before-completion has not been invoked. Run typecheck, lint, and tests, then invoke the verification-before-completion skill before completing."
}
EOF
