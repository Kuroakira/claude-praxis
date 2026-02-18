#!/usr/bin/env bash
# PreToolUse hook: enforces skill gates based on file type.
# - Code files → code-quality-rules must be invoked
# - Document files → document-quality-rules must be invoked
# - Config/data files → no gate (allowed)
# Matcher in hooks.json: "Edit|Write|MultiEdit"
# Requires: python3

INPUT=$(cat)

# Extract transcript path and file path from tool input
read -r TRANSCRIPT FILE_PATH <<< "$(echo "$INPUT" | python3 -c '
import sys, json
data = json.loads(sys.stdin.read())
transcript = data.get("transcript_path", "")
tool_input = data.get("tool_input", {})
file_path = tool_input.get("file_path", "")
print(transcript, file_path)
' 2>/dev/null)"

if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then
  echo "check-skill-gate: transcript not available, allowing edit" >&2
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

# Check if the required skill has been invoked in this session
if python3 -c '
import sys, json
skill_name = sys.argv[2]
for line in open(sys.argv[1]):
    try:
        obj = json.loads(line)
    except:
        continue
    content = obj.get("content", [])
    if isinstance(content, list):
        for item in content:
            if (isinstance(item, dict)
                and item.get("type") == "tool_use"
                and item.get("name") == "Skill"
                and skill_name in json.dumps(item.get("input", {}))):
                sys.exit(0)
sys.exit(1)
' "$TRANSCRIPT" "$REQUIRED_SKILL" 2>/dev/null; then
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
