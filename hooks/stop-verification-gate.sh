#!/usr/bin/env bash
# Stop hook: blocks Claude from stopping without running verification.
# Uses a counter-based approach to prevent infinite loops.
# - 1st stop: block with "run verification" message
# - 2nd stop: block with "still no evidence" message
# - 3rd+ stop: allow (safety valve)
# Counter is stored in /tmp/claude-praxis-markers/$SESSION_ID-stop-blocks
# and cleaned on session start by session-start.sh.

MAX_BLOCKS=2
MARKER_DIR="/tmp/claude-praxis-markers"

INPUT=$(cat)

# Extract session_id from hook input
SESSION_ID="$(echo "$INPUT" | python3 -c '
import sys, json
data = json.loads(sys.stdin.read())
print(data.get("session_id", ""))
' 2>/dev/null)"

# If session_id is unavailable, allow stop (permissive fallback)
if [ -z "$SESSION_ID" ]; then
  exit 0
fi

COUNTER_FILE="$MARKER_DIR/$SESSION_ID-stop-blocks"

# Read current counter (0 if file doesn't exist)
if [ -f "$COUNTER_FILE" ]; then
  COUNTER=$(cat "$COUNTER_FILE")
else
  COUNTER=0
fi

# If counter >= MAX_BLOCKS, allow stop (safety valve)
if [ "$COUNTER" -ge "$MAX_BLOCKS" ]; then
  exit 0
fi

# Increment counter
COUNTER=$((COUNTER + 1))
mkdir -p "$MARKER_DIR" 2>/dev/null
echo "$COUNTER" > "$COUNTER_FILE"

# Block with appropriate message
if [ "$COUNTER" -eq 1 ]; then
  REASON="verification-before-completion has not been satisfied. Run typecheck, lint, and tests, then present evidence before completing."
else
  REASON="Still no verification evidence. Run the checks (typecheck, lint, test) and include their output in your response before completing."
fi

cat <<EOF
{
  "decision": "block",
  "reason": "$REASON"
}
EOF
