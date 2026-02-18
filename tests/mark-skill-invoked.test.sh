#!/usr/bin/env bash
# Tests for hooks/mark-skill-invoked.sh
# Run: bash tests/mark-skill-invoked.test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK_SCRIPT="$SCRIPT_DIR/../hooks/mark-skill-invoked.sh"
MARKER_DIR="/tmp/claude-praxis-markers"

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

# Cleanup before and after tests
cleanup() {
  rm -f "$MARKER_DIR/test-mark-"* 2>/dev/null
}
trap cleanup EXIT
cleanup

# --- Test 1: Skill invocation creates marker file ---
echo "Test 1: Skill invocation creates marker file"

echo '{"session_id":"test-mark-1","tool_name":"Skill","tool_input":{"skill":"claude-praxis:code-quality-rules"}}' | bash "$HOOK_SCRIPT"

assert_eq "marker file exists" "true" "$([ -f "$MARKER_DIR/test-mark-1" ] && echo true || echo false)"
assert_contains "marker contains skill name" "claude-praxis:code-quality-rules" "$(cat "$MARKER_DIR/test-mark-1")"

# --- Test 2: Multiple skills append correctly ---
echo "Test 2: Multiple skills append correctly"

echo '{"session_id":"test-mark-1","tool_name":"Skill","tool_input":{"skill":"claude-praxis:document-quality-rules"}}' | bash "$HOOK_SCRIPT"

LINE_COUNT=$(wc -l < "$MARKER_DIR/test-mark-1" | tr -d ' ')
assert_eq "marker has 2 lines" "2" "$LINE_COUNT"
assert_contains "marker contains second skill" "document-quality-rules" "$(cat "$MARKER_DIR/test-mark-1")"

# --- Test 3: Empty session_id does not create marker ---
echo "Test 3: Empty session_id does not create marker"

echo '{"session_id":"","tool_name":"Skill","tool_input":{"skill":"claude-praxis:code-quality-rules"}}' | bash "$HOOK_SCRIPT"

assert_eq "no marker for empty session_id" "false" "$([ -f "$MARKER_DIR/" ] && echo true || echo false)"

# --- Test 4: Empty skill name does not append ---
echo "Test 4: Empty skill name does not create marker"

echo '{"session_id":"test-mark-4","tool_name":"Skill","tool_input":{"skill":""}}' | bash "$HOOK_SCRIPT"

assert_eq "no marker for empty skill" "false" "$([ -f "$MARKER_DIR/test-mark-4" ] && echo true || echo false)"

# --- Test 5: Missing skill field does not create marker ---
echo "Test 5: Missing skill field does not create marker"

echo '{"session_id":"test-mark-5","tool_name":"Skill","tool_input":{}}' | bash "$HOOK_SCRIPT"

assert_eq "no marker for missing skill field" "false" "$([ -f "$MARKER_DIR/test-mark-5" ] && echo true || echo false)"

# --- Test 6: Exit code is always 0 ---
echo "Test 6: Exit code is always 0"

echo '{"session_id":"test-mark-6","tool_name":"Skill","tool_input":{"skill":"code-quality-rules"}}' | bash "$HOOK_SCRIPT"
assert_eq "exit code is 0 on success" "0" "$?"

echo '{"session_id":"","tool_name":"Skill","tool_input":{"skill":""}}' | bash "$HOOK_SCRIPT"
assert_eq "exit code is 0 on empty input" "0" "$?"

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
