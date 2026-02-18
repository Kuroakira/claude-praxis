#!/usr/bin/env bash
# TaskCompleted hook: blocks task completion once per task to force a verification cycle.
# Uses a per-task marker to ensure each task is verified before completion.
#
# Flow:
#   1st attempt: no marker → create marker, exit 2 (block, stderr = feedback)
#   2nd attempt: marker exists → exit 0 (allow)
#
# Exit codes (TaskCompleted hook convention):
#   0 = allow task completion
#   2 = block task completion (stderr fed back to model)
#
# Marker path: /tmp/claude-praxis-markers/$SESSION_ID-task-<hash of task_subject>
# Cleaned on session start by session-start.sh.

MARKER_DIR="/tmp/claude-praxis-markers"

INPUT=$(cat)

# Extract session_id and task_subject from hook input (separate lines to handle spaces/empty values)
PARSED="$(echo "$INPUT" | python3 -c '
import sys, json
try:
    data = json.loads(sys.stdin.read())
    print(data.get("session_id", ""))
    print(data.get("task_subject", ""))
except Exception:
    print("")
    print("")
' 2>/dev/null)"

SESSION_ID="$(echo "$PARSED" | sed -n '1p')"
TASK_SUBJECT="$(echo "$PARSED" | sed -n '2p')"

# Permissive fallback: if session_id or task_subject is unavailable, allow
if [ -z "$SESSION_ID" ] || [ -z "$TASK_SUBJECT" ]; then
  exit 0
fi

# Hash task_subject to create a unique marker per task (first 12 chars of md5)
TASK_HASH=$(printf '%s' "$TASK_SUBJECT" | md5 -q 2>/dev/null || printf '%s' "$TASK_SUBJECT" | md5sum | cut -d' ' -f1)
TASK_HASH="${TASK_HASH:0:12}"

MARKER_FILE="$MARKER_DIR/$SESSION_ID-task-$TASK_HASH"

# If marker exists, this is a retry after verification — allow
if [ -f "$MARKER_FILE" ]; then
  exit 0
fi

# First attempt: create marker and block
mkdir -p "$MARKER_DIR" 2>/dev/null
touch "$MARKER_FILE"

echo "Task completion blocked for: $TASK_SUBJECT. Run verification (typecheck, lint, test) and include output before marking this task complete." >&2
exit 2
