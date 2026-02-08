#!/usr/bin/env bash
# PreCompact hook: mechanical cleanup of Flow files before compact.
# Triggered on: auto-compact (75-95% context) and manual compact.
#
# What this does:
#   1. Trim progress.md to last 10 entries
#   2. Update timestamp in task_plan.md
#   3. Remove completed task details from task_plan.md
#
# What this does NOT do:
#   - LLM-judged promotion (Flow → Stock). That is /compound's job.

CONTEXT_DIR=".claude/context"

# --- progress.md: keep last 10 entries ---
PROGRESS_FILE="$CONTEXT_DIR/progress.md"
if [ -f "$PROGRESS_FILE" ]; then
  # Each entry starts with "## ". Keep the 10 most recent (top of file).
  entry_count=$(grep -c '^## ' "$PROGRESS_FILE" 2>/dev/null || echo 0)
  if [ "$entry_count" -gt 10 ]; then
    # Find the line number of the 11th "## " header and truncate there
    cut_line=$(grep -n '^## ' "$PROGRESS_FILE" | sed -n '11p' | cut -d: -f1)
    if [ -n "$cut_line" ]; then
      head -n $((cut_line - 1)) "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp"
      mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
    fi
  fi
fi

# --- task_plan.md: update timestamp ---
TASK_PLAN="$CONTEXT_DIR/task_plan.md"
if [ -f "$TASK_PLAN" ]; then
  timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  # If a "Last compacted:" line exists, update it; otherwise prepend it
  if grep -q '^Last compacted:' "$TASK_PLAN"; then
    sed -i.bak "s/^Last compacted:.*$/Last compacted: $timestamp/" "$TASK_PLAN"
    rm -f "${TASK_PLAN}.bak"
  else
    # Insert after the first line (title)
    sed -i.bak "1a\\
Last compacted: $timestamp" "$TASK_PLAN"
    rm -f "${TASK_PLAN}.bak"
  fi
fi

# Output JSON for hook system (no additionalContext — we don't inject content)
cat <<'EOF'
{
  "hookSpecificOutput": {}
}
EOF
