#!/usr/bin/env bash
# Session start hook: injects the getting-started skill at every session start.
# Triggered on: startup, resume, clear, compact

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_FILE="$SCRIPT_DIR/../skills/getting-started/SKILL.md"

if [ ! -f "$SKILL_FILE" ]; then
  echo "Warning: getting-started skill not found at $SKILL_FILE" >&2
  exit 0
fi

# Read skill content, strip frontmatter
SKILL_CONTENT=$(sed '/^---$/,/^---$/d' "$SKILL_FILE")

# Escape for JSON
ESCAPED_CONTENT=$(echo "$SKILL_CONTENT" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')

cat <<EOF
{
  "hookSpecificOutput": {
    "additionalContext": $ESCAPED_CONTENT
  }
}
EOF
