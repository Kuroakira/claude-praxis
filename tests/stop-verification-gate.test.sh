#!/usr/bin/env bash
# Tests for hooks/stop-verification-gate.sh (context-aware, marker-based)
# Run: bash tests/stop-verification-gate.test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK_SCRIPT="$SCRIPT_DIR/../hooks/stop-verification-gate.sh"
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

assert_not_contains() {
  local test_name="$1" unexpected="$2" actual="$3"
  if echo "$actual" | grep -q "$unexpected"; then
    echo "  FAIL: $test_name (expected NOT to contain '$unexpected', but found it)"
    FAIL=$((FAIL + 1))
  else
    echo "  PASS: $test_name"
    PASS=$((PASS + 1))
  fi
}

# Helpers
setup_session() {
  local session_id="$1"
  mkdir -p "$MARKER_DIR"
  rm -f "$MARKER_DIR/$session_id" 2>/dev/null
  rm -f "$MARKER_DIR/$session_id-code-session" 2>/dev/null
}

add_code_session_marker() {
  local session_id="$1"
  touch "$MARKER_DIR/$session_id-code-session"
}

add_skill_marker() {
  local session_id="$1" skill_name="$2"
  echo "$skill_name" >> "$MARKER_DIR/$session_id"
}

# Cleanup
cleanup() {
  rm -f "$MARKER_DIR/test-stop-"* 2>/dev/null
}
trap cleanup EXIT
cleanup

# --- Test 1: Allow stop when no code-session marker (brainstorm/research session) ---
echo "Test 1: Allow stop when no code-session marker (no code changes)"
setup_session "test-stop-1"

OUTPUT=$(echo '{"session_id":"test-stop-1","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_not_contains "no block for non-code session" '"block"' "$OUTPUT"

# --- Test 2: Block stop when code-session marker exists but verification not done ---
echo "Test 2: Block when code-session exists but verification-before-completion not invoked"
setup_session "test-stop-2"
add_code_session_marker "test-stop-2"

OUTPUT=$(echo '{"session_id":"test-stop-2","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_contains "outputs block decision" '"block"' "$OUTPUT"
assert_contains "block reason mentions verification" "verification" "$OUTPUT"

# --- Test 3: Allow stop when code-session marker exists AND verification skill invoked ---
echo "Test 3: Allow when code-session exists and verification-before-completion invoked"
setup_session "test-stop-3"
add_code_session_marker "test-stop-3"
add_skill_marker "test-stop-3" "claude-praxis:verification-before-completion"

OUTPUT=$(echo '{"session_id":"test-stop-3","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_not_contains "no block when verified" '"block"' "$OUTPUT"

# --- Test 4: Allow stop when stop_hook_active is true (loop prevention) ---
echo "Test 4: Allow when stop_hook_active is true (loop prevention)"
setup_session "test-stop-4"
add_code_session_marker "test-stop-4"

OUTPUT=$(echo '{"session_id":"test-stop-4","stop_hook_active":true}' | bash "$HOOK_SCRIPT")

assert_not_contains "no block during active stop hook" '"block"' "$OUTPUT"

# --- Test 5: Allow stop when session_id is empty (deny-by-default doesn't apply to Stop) ---
echo "Test 5: Allow when session_id is empty"
setup_session "test-stop-5"

OUTPUT=$(echo '{"session_id":"","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_not_contains "no block on missing session_id" '"block"' "$OUTPUT"

# --- Test 6: Verification with short skill name (no prefix) ---
echo "Test 6: Allow when verification invoked with short name"
setup_session "test-stop-6"
add_code_session_marker "test-stop-6"
add_skill_marker "test-stop-6" "verification-before-completion"

OUTPUT=$(echo '{"session_id":"test-stop-6","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_not_contains "short name accepted" '"block"' "$OUTPUT"

# --- Test 7: Exit code is always 0 ---
echo "Test 7: Exit code is always 0"

setup_session "test-stop-7a"
echo '{"session_id":"test-stop-7a","stop_hook_active":false}' | bash "$HOOK_SCRIPT" > /dev/null
assert_eq "exit code 0 on allow (no code session)" "0" "$?"

setup_session "test-stop-7b"
add_code_session_marker "test-stop-7b"
echo '{"session_id":"test-stop-7b","stop_hook_active":false}' | bash "$HOOK_SCRIPT" > /dev/null
assert_eq "exit code 0 on block" "0" "$?"

setup_session "test-stop-7c"
add_code_session_marker "test-stop-7c"
echo '{"session_id":"test-stop-7c","stop_hook_active":true}' | bash "$HOOK_SCRIPT" > /dev/null
assert_eq "exit code 0 on allow (loop prevention)" "0" "$?"

# --- Test 8: Block message includes guidance ---
echo "Test 8: Block message includes actionable guidance"
setup_session "test-stop-8"
add_code_session_marker "test-stop-8"

OUTPUT=$(echo '{"session_id":"test-stop-8","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_contains "mentions verification skill" "verification-before-completion" "$OUTPUT"

# --- Test 9: Unrelated skill does not satisfy verification gate ---
echo "Test 9: Unrelated skill does not satisfy verification gate"
setup_session "test-stop-9"
add_code_session_marker "test-stop-9"
add_skill_marker "test-stop-9" "claude-praxis:code-quality-rules"

OUTPUT=$(echo '{"session_id":"test-stop-9","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_contains "still blocked with wrong skill" '"block"' "$OUTPUT"

# --- Test 10: JSON parse failure allows stop (Stop hook is not deny-by-default) ---
echo "Test 10: JSON parse failure allows stop"

OUTPUT=$(echo "not valid json" | bash "$HOOK_SCRIPT" 2>/dev/null)

assert_not_contains "no block on parse failure" '"block"' "$OUTPUT"

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
