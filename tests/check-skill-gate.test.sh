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

# --- Test 3: Allow when session_id is empty (permissive fallback) ---
echo "Test 3: Allow when session_id is empty"
setup_markers

OUTPUT=$(make_hook_input "/tmp/test/file.ts" "" | bash "$HOOK_SCRIPT" 2>/dev/null)
EXIT_CODE=$?

assert_eq "exit code is 0" "0" "$EXIT_CODE"
assert_eq "output is empty (allow)" "" "$OUTPUT"

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

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
