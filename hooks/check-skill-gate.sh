#!/usr/bin/env bash
# PreToolUse hook: enforces skill gates based on file type.
# - Code files → code-quality-rules must be invoked
# - Document files → document-quality-rules must be invoked
# - Config/data files → no gate (allowed)
# Matcher in hooks.json: "Edit|Write|MultiEdit"
# Checks session marker files written by mark-skill-invoked.sh (PostToolUse hook).

INPUT=$(cat)

# Extract session_id and file_path from tool input
IFS=$'\t' read -r SESSION_ID FILE_PATH <<< "$(echo "$INPUT" | python3 -c '
import sys, json
data = json.loads(sys.stdin.read())
session_id = data.get("session_id", "")
tool_input = data.get("tool_input", {})
file_path = tool_input.get("file_path", "")
print(session_id + "\t" + file_path)
' 2>/dev/null)"

# If session_id is unavailable, allow edit (permissive fallback)
if [ -z "$SESSION_ID" ]; then
  echo "check-skill-gate: session_id not available, allowing edit" >&2
  exit 0
fi

# Determine file type from extension
FILE_EXT="${FILE_PATH##*.}"
FILE_EXT="$(echo "$FILE_EXT" | tr '[:upper:]' '[:lower:]')"

REQUIRED_SKILL=""

case "$FILE_EXT" in
  # Code files → require code-quality-rules
  ts|tsx|js|jsx|mjs|cjs|py|sh|bash|zsh|css|scss|less|html|vue|svelte|go|rs|java|kt|swift|c|cpp|h|hpp|rb|php|sql|r|lua|pl|ex|exs|erl|hs|ml|fs|cs|vb|dart|scala|groovy|clj|nim|zig|v|d)
    REQUIRED_SKILL="code-quality-rules"
    ;;
  # Document files → require document-quality-rules
  md|txt|rst|adoc|tex|org|wiki|asciidoc)
    REQUIRED_SKILL="document-quality-rules"
    ;;
  # Config/data files → no gate
  json|yaml|yml|toml|ini|env|xml|csv|tsv|lock|conf|cfg|properties|editorconfig|gitignore|gitattributes|dockerignore|npmrc|nvmrc)
    exit 0
    ;;
  # Unknown extensions → no gate (permissive default)
  *)
    exit 0
    ;;
esac

# Check if the required skill has been invoked via marker file
MARKER_FILE="/tmp/claude-praxis-markers/$SESSION_ID"

if [ -f "$MARKER_FILE" ] && grep -q "$REQUIRED_SKILL" "$MARKER_FILE"; then
  exit 0
fi

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "${REQUIRED_SKILL} skill has not been invoked in this session. Invoke it before editing ${FILE_EXT} files."
  }
}
EOF
