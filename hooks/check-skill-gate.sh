#!/usr/bin/env bash
# PreToolUse hook: blocks Edit/Write when code-quality-rules skill has not been invoked.
# Matcher in hooks.json: "Edit|Write|MultiEdit" ensures this only fires for file edits.
# Requires: python3

INPUT=$(cat)

TRANSCRIPT=$(echo "$INPUT" | python3 -c '
import sys, json
data = json.loads(sys.stdin.read())
print(data.get("transcript_path", ""))
' 2>/dev/null)

if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then
  echo "check-skill-gate: transcript not available, allowing edit" >&2
  exit 0
fi

# Parse JSONL structurally to find actual Skill tool invocations.
# Avoids false positives from text mentions of code-quality-rules.
if python3 -c '
import sys, json
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
                and "code-quality-rules" in json.dumps(item.get("input", {}))):
                sys.exit(0)
sys.exit(1)
' "$TRANSCRIPT" 2>/dev/null; then
  exit 0
fi

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "code-quality-rules skill has not been invoked in this session. Invoke it before editing code files."
  }
}
EOF
