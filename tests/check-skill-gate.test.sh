#!/usr/bin/env bash
# Tests for hooks/check-skill-gate.sh
# Run: bash tests/check-skill-gate.test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK_SCRIPT="$SCRIPT_DIR/../hooks/check-skill-gate.sh"
TMPDIR_TEST=$(mktemp -d)
trap 'rm -rf "$TMPDIR_TEST"' EXIT

PASS=0
FAIL=0

assert_eq() {
  local test_name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  PASS: $test_name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $test_name (expected='$expected', actual='$actual')"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local test_name="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  PASS: $test_name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $test_name (expected to contain '$expected', got='$actual')"
    FAIL=$((FAIL + 1))
  fi
}

make_hook_input() {
  local transcript_path="$1"
  cat <<EOF
{
  "session_id": "test-session",
  "transcript_path": "$transcript_path",
  "cwd": "/tmp/test",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/tmp/test/file.ts",
    "old_string": "old",
    "new_string": "new"
  }
}
EOF
}

# --- Test 1: Deny when code-quality-rules NOT invoked ---
echo "Test 1: Deny when code-quality-rules not invoked"

cat > "$TMPDIR_TEST/transcript_no_skill.jsonl" <<'JSONL'
{"type":"system","content":"You are Claude Code..."}
{"type":"human","content":[{"type":"text","text":"Implement the feature"}]}
{"type":"assistant","content":[{"type":"text","text":"I'll start implementing."}]}
{"type":"assistant","content":[{"type":"tool_use","id":"toolu_1","name":"Read","input":{"file_path":"/tmp/test/file.ts"}}]}
JSONL

OUTPUT=$(make_hook_input "$TMPDIR_TEST/transcript_no_skill.jsonl" | bash "$HOOK_SCRIPT" 2>/dev/null || true)
EXIT_CODE=${PIPESTATUS[1]:-0}

assert_eq "exit code is 0" "0" "$EXIT_CODE"
assert_contains "output contains deny" '"deny"' "$OUTPUT"
assert_contains "output mentions code-quality-rules" 'code-quality-rules' "$OUTPUT"

# --- Test 2: Allow when code-quality-rules IS invoked ---
echo "Test 2: Allow when code-quality-rules is invoked"

cat > "$TMPDIR_TEST/transcript_with_skill.jsonl" <<'JSONL'
{"type":"system","content":"You are Claude Code..."}
{"type":"human","content":[{"type":"text","text":"Implement the feature"}]}
{"type":"assistant","content":[{"type":"tool_use","id":"toolu_1","name":"Skill","input":{"skill":"claude-praxis:code-quality-rules"}}]}
{"type":"tool_result","tool_use_id":"toolu_1","content":"Skill loaded successfully"}
{"type":"assistant","content":[{"type":"text","text":"Quality rules loaded. Writing tests first."}]}
JSONL

OUTPUT=$(make_hook_input "$TMPDIR_TEST/transcript_with_skill.jsonl" | bash "$HOOK_SCRIPT" 2>/dev/null)
EXIT_CODE=$?

assert_eq "exit code is 0" "0" "$EXIT_CODE"
assert_eq "output is empty (allow)" "" "$OUTPUT"

# --- Test 3: Allow when transcript_path is missing ---
echo "Test 3: Allow when transcript_path is missing or invalid"

OUTPUT=$(cat <<'EOF' | bash "$HOOK_SCRIPT" 2>/dev/null
{
  "session_id": "test-session",
  "transcript_path": "/nonexistent/path/transcript.jsonl",
  "hook_event_name": "PreToolUse",
  "tool_name": "Edit"
}
EOF
)
EXIT_CODE=$?

assert_eq "exit code is 0" "0" "$EXIT_CODE"
assert_eq "output is empty (allow)" "" "$OUTPUT"

# --- Test 4: No false positive from getting-started injection ---
echo "Test 4: No false positive from getting-started content in transcript"

cat > "$TMPDIR_TEST/transcript_false_positive.jsonl" <<'JSONL'
{"type":"system","content":"You are Claude Code..."}
{"type":"hook_result","hookSpecificOutput":{"additionalContext":"## Available Skills\n| Trigger | Skill |\n| ANY task that writes code | code-quality-rules | Gate |\nMUST invoke code-quality-rules skill"}}
{"type":"human","content":[{"type":"text","text":"Edit the file"}]}
{"type":"assistant","content":[{"type":"text","text":"Let me edit that file."}]}
JSONL

OUTPUT=$(make_hook_input "$TMPDIR_TEST/transcript_false_positive.jsonl" | bash "$HOOK_SCRIPT" 2>/dev/null || true)

assert_contains "output contains deny (no actual Skill invocation)" '"deny"' "$OUTPUT"

# --- Test 5: No false positive from text mentioning Skill tool and code-quality-rules ---
echo "Test 5: No false positive from assistant text mentioning both Skill and code-quality-rules"

cat > "$TMPDIR_TEST/transcript_text_mention.jsonl" <<'JSONL'
{"type":"system","content":"You are Claude Code..."}
{"type":"assistant","content":[{"type":"text","text":"I should invoke the Skill tool for code-quality-rules before editing."},{"type":"tool_use","id":"toolu_1","name":"Read","input":{"file_path":"/tmp/file.ts"}}]}
JSONL

OUTPUT=$(make_hook_input "$TMPDIR_TEST/transcript_text_mention.jsonl" | bash "$HOOK_SCRIPT" 2>/dev/null || true)

assert_contains "output contains deny (text mention is not invocation)" '"deny"' "$OUTPUT"

# --- Test 6: Skill invoked with short name (without prefix) ---
echo "Test 6: Allow when skill invoked with short name"

cat > "$TMPDIR_TEST/transcript_short_name.jsonl" <<'JSONL'
{"type":"system","content":"You are Claude Code..."}
{"type":"assistant","content":[{"type":"tool_use","id":"toolu_1","name":"Skill","input":{"skill":"code-quality-rules"}}]}
{"type":"tool_result","tool_use_id":"toolu_1","content":"Skill loaded"}
JSONL

OUTPUT=$(make_hook_input "$TMPDIR_TEST/transcript_short_name.jsonl" | bash "$HOOK_SCRIPT" 2>/dev/null)
EXIT_CODE=$?

assert_eq "exit code is 0" "0" "$EXIT_CODE"
assert_eq "output is empty (allow)" "" "$OUTPUT"

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
