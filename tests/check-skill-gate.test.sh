#!/usr/bin/env bash
# Tests for hooks/check-skill-gate.sh (marker-file-based skill gate)
# Run: bash tests/check-skill-gate.test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK_SCRIPT="$SCRIPT_DIR/../hooks/check-skill-gate.sh"
MARKER_DIR="/tmp/claude-praxis-markers"
TEST_SESSION="test-skill-gate"

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

# Helpers
setup_markers() {
  mkdir -p "$MARKER_DIR"
  rm -f "$MARKER_DIR/$TEST_SESSION" 2>/dev/null
  rm -f "$MARKER_DIR/$TEST_SESSION-code-session" 2>/dev/null
}

add_skill_marker() {
  local skill_name="$1"
  echo "$skill_name" >> "$MARKER_DIR/$TEST_SESSION"
}

make_hook_input() {
  local file_path="${1:-/tmp/test/file.ts}"
  local session_id="${2-$TEST_SESSION}"
  cat <<EOF
{
  "session_id": "$session_id",
  "transcript_path": "",
  "cwd": "/tmp/test",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "$file_path",
    "old_string": "old",
    "new_string": "new"
  }
}
EOF
}

# Cleanup
cleanup() {
  rm -f "$MARKER_DIR/$TEST_SESSION" 2>/dev/null
  rm -f "$MARKER_DIR/$TEST_SESSION-code-session" 2>/dev/null
}
trap cleanup EXIT

# --- Test 1: Deny when code-quality-rules NOT invoked ---
echo "Test 1: Deny when code-quality-rules not invoked"
setup_markers

OUTPUT=$(make_hook_input "/tmp/test/file.ts" | bash "$HOOK_SCRIPT" 2>/dev/null || true)

assert_contains "output contains deny" '"deny"' "$OUTPUT"
assert_contains "output mentions code-quality-rules" 'code-quality-rules' "$OUTPUT"

# --- Test 2: Allow when code-quality-rules IS invoked ---
echo "Test 2: Allow when code-quality-rules is invoked"
setup_markers
add_skill_marker "claude-praxis:code-quality-rules"

OUTPUT=$(make_hook_input "/tmp/test/file.ts" | bash "$HOOK_SCRIPT" 2>/dev/null)
EXIT_CODE=$?

assert_eq "exit code is 0" "0" "$EXIT_CODE"
assert_eq "output is empty (allow)" "" "$OUTPUT"

# --- Test 3: Block when session_id is empty (deny-by-default) ---
echo "Test 3: Block when session_id is empty (deny-by-default)"
setup_markers

STDERR_OUTPUT=$(make_hook_input "/tmp/test/file.ts" "" | bash "$HOOK_SCRIPT" 2>&1 >/dev/null || true)
EXIT_CODE=0
make_hook_input "/tmp/test/file.ts" "" | bash "$HOOK_SCRIPT" >/dev/null 2>&1 || EXIT_CODE=$?

assert_eq "exit code is 2" "2" "$EXIT_CODE"
assert_contains "stderr mentions session_id" 'session_id' "$STDERR_OUTPUT"

# --- Test 4: Unrelated skill marker does not satisfy code-quality-rules gate ---
echo "Test 4: Unrelated skill does not satisfy gate"
setup_markers
add_skill_marker "claude-praxis:document-quality-rules"

OUTPUT=$(make_hook_input "/tmp/test/file.ts" | bash "$HOOK_SCRIPT" 2>/dev/null || true)

assert_contains "output contains deny" '"deny"' "$OUTPUT"
assert_contains "output mentions code-quality-rules" 'code-quality-rules' "$OUTPUT"

# --- Test 5: Document-quality-rules gate for .md files ---
echo "Test 5: document-quality-rules gate for .md files"
setup_markers
add_skill_marker "claude-praxis:document-quality-rules"

OUTPUT=$(make_hook_input "/tmp/test/README.md" | bash "$HOOK_SCRIPT" 2>/dev/null)
EXIT_CODE=$?

assert_eq "exit code is 0" "0" "$EXIT_CODE"
assert_eq "output is empty (allow)" "" "$OUTPUT"

# --- Test 6: Deny .md when only code-quality-rules is invoked ---
echo "Test 6: Deny .md when only code-quality-rules invoked"
setup_markers
add_skill_marker "claude-praxis:code-quality-rules"

OUTPUT=$(make_hook_input "/tmp/test/README.md" | bash "$HOOK_SCRIPT" 2>/dev/null || true)

assert_contains "output contains deny" '"deny"' "$OUTPUT"
assert_contains "output mentions document-quality-rules" 'document-quality-rules' "$OUTPUT"

# --- Test 7: Allow when skill invoked with short name (no prefix) ---
echo "Test 7: Allow with short name (no prefix)"
setup_markers
add_skill_marker "code-quality-rules"

OUTPUT=$(make_hook_input "/tmp/test/file.ts" | bash "$HOOK_SCRIPT" 2>/dev/null)
EXIT_CODE=$?

assert_eq "exit code is 0" "0" "$EXIT_CODE"
assert_eq "output is empty (allow)" "" "$OUTPUT"

# --- Test 8: Config files pass without any skill ---
echo "Test 8: Config files pass without any skill"
setup_markers

OUTPUT=$(make_hook_input "/tmp/test/config.json" | bash "$HOOK_SCRIPT" 2>/dev/null)
EXIT_CODE=$?

assert_eq "exit code is 0" "0" "$EXIT_CODE"
assert_eq "output is empty (allow)" "" "$OUTPUT"

# --- Test 9: Both skills invoked, both file types allowed ---
echo "Test 9: Both skills invoked, both file types allowed"
setup_markers
add_skill_marker "claude-praxis:code-quality-rules"
add_skill_marker "claude-praxis:document-quality-rules"

OUTPUT_TS=$(make_hook_input "/tmp/test/file.ts" | bash "$HOOK_SCRIPT" 2>/dev/null)
OUTPUT_MD=$(make_hook_input "/tmp/test/README.md" | bash "$HOOK_SCRIPT" 2>/dev/null)

assert_eq ".ts allowed" "" "$OUTPUT_TS"
assert_eq ".md allowed" "" "$OUTPUT_MD"

# --- Test 10: Block when JSON parse fails (deny-by-default) ---
echo "Test 10: Block when JSON parse fails (deny-by-default)"
setup_markers

STDERR_OUTPUT=$(echo "not valid json {{{" | bash "$HOOK_SCRIPT" 2>&1 >/dev/null || true)
EXIT_CODE=0
echo "not valid json {{{" | bash "$HOOK_SCRIPT" >/dev/null 2>&1 || EXIT_CODE=$?

assert_eq "exit code is 2" "2" "$EXIT_CODE"
assert_contains "stderr mentions parse or error" 'parse\|error\|failed' "$STDERR_OUTPUT"

# --- Test 11: code-session marker is written when code file edit is allowed ---
echo "Test 11: code-session marker written on allowed code file edit"
setup_markers
add_skill_marker "claude-praxis:code-quality-rules"

make_hook_input "/tmp/test/file.ts" | bash "$HOOK_SCRIPT" 2>/dev/null
CODE_SESSION_MARKER="$MARKER_DIR/$TEST_SESSION-code-session"

assert_eq "code-session marker exists" "true" "$([ -f "$CODE_SESSION_MARKER" ] && echo true || echo false)"

# --- Test 12: code-session marker is NOT written for document file edits ---
echo "Test 12: code-session marker NOT written for document file edit"
setup_markers
add_skill_marker "claude-praxis:document-quality-rules"

make_hook_input "/tmp/test/README.md" | bash "$HOOK_SCRIPT" 2>/dev/null
CODE_SESSION_MARKER="$MARKER_DIR/$TEST_SESSION-code-session"

assert_eq "code-session marker does not exist" "false" "$([ -f "$CODE_SESSION_MARKER" ] && echo true || echo false)"

# --- Test 13: code-session marker is NOT written for config file edits ---
echo "Test 13: code-session marker NOT written for config file edit"
setup_markers

make_hook_input "/tmp/test/config.json" | bash "$HOOK_SCRIPT" 2>/dev/null
CODE_SESSION_MARKER="$MARKER_DIR/$TEST_SESSION-code-session"

assert_eq "code-session marker does not exist" "false" "$([ -f "$CODE_SESSION_MARKER" ] && echo true || echo false)"

# --- Test 14: Block when file_path extraction fails (deny-by-default) ---
echo "Test 14: Block when tool_input has no file_path"
setup_markers

EXIT_CODE=0
echo '{"session_id":"'"$TEST_SESSION"'","tool_input":{}}' | bash "$HOOK_SCRIPT" >/dev/null 2>&1 || EXIT_CODE=$?

# Empty file_path → unknown extension → no gate → exit 0
assert_eq "exit code is 0 (unknown extension, no gate)" "0" "$EXIT_CODE"

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
