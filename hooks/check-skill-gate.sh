#!/usr/bin/env bash
# PreToolUse hook: enforces skill gates based on file type (deny-by-default).
# - Code files → code-quality-rules must be invoked
# - Document files → document-quality-rules must be invoked
# - Config/data files → no gate (allowed)
# Matcher in hooks.json: "Edit|Write|MultiEdit"
# Checks session marker files written by mark-skill-invoked.sh (PostToolUse hook).
#
# Deny-by-default: JSON parse failure or missing session_id → exit 2 (block).
# Side effect: writes code-session marker when a code file edit is allowed.

MARKER_DIR="/tmp/claude-praxis-markers"

INPUT=$(cat)

# Extract session_id and file_path from tool input (newline-separated to avoid IFS issues)
PARSED="$(echo "$INPUT" | python3 -c '
import sys, json
data = json.loads(sys.stdin.read())
print(data.get("session_id", ""))
print(data.get("tool_input", {}).get("file_path", ""))
' 2>&1)"
PARSE_EXIT=$?

# Deny-by-default: if JSON parse failed, block with descriptive error
if [ "$PARSE_EXIT" -ne 0 ]; then
  echo "check-skill-gate: JSON parse failed. Input may be malformed. Disable the claude-praxis plugin temporarily if this persists." >&2
  exit 2
fi

SESSION_ID="$(echo "$PARSED" | sed -n '1p')"
FILE_PATH="$(echo "$PARSED" | sed -n '2p')"

# Deny-by-default: if session_id is empty, block
if [ -z "$SESSION_ID" ]; then
  echo "check-skill-gate: session_id extraction failed. Cannot verify skill gate. Disable the claude-praxis plugin temporarily if this persists." >&2
  exit 2
fi

# Determine file type from extension
FILE_EXT="${FILE_PATH##*.}"
FILE_EXT="$(echo "$FILE_EXT" | tr '[:upper:]' '[:lower:]')"

REQUIRED_SKILL=""
IS_CODE_FILE=false

case "$FILE_EXT" in
  # Code files → require code-quality-rules
  ts|tsx|js|jsx|mjs|cjs|py|sh|bash|zsh|css|scss|less|html|vue|svelte|go|rs|java|kt|swift|c|cpp|h|hpp|rb|php|sql|r|lua|pl|ex|exs|erl|hs|ml|fs|cs|vb|dart|scala|groovy|clj|nim|zig|v|d)
    REQUIRED_SKILL="code-quality-rules"
    IS_CODE_FILE=true
    ;;
  # Document files → require document-quality-rules
  md|txt|rst|adoc|tex|org|wiki|asciidoc)
    REQUIRED_SKILL="document-quality-rules"
    ;;
  # Config/data files → no gate
  json|yaml|yml|toml|ini|env|xml|csv|tsv|lock|conf|cfg|properties|editorconfig|gitignore|gitattributes|dockerignore|npmrc|nvmrc)
    exit 0
    ;;
  # Unknown extensions → no gate
  *)
    exit 0
    ;;
esac

# Check if the required skill has been invoked via marker file
MARKER_FILE="$MARKER_DIR/$SESSION_ID"

if [ -f "$MARKER_FILE" ] && grep -q "$REQUIRED_SKILL" "$MARKER_FILE"; then
  # Write code-session marker when a code file edit is allowed
  if [ "$IS_CODE_FILE" = true ]; then
    mkdir -p "$MARKER_DIR" 2>/dev/null
    touch "$MARKER_DIR/$SESSION_ID-code-session"
  fi
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
