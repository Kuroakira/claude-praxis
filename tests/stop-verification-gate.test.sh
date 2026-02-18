#!/usr/bin/env bash
# Tests for hooks/stop-verification-gate.sh
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

# Cleanup before and after tests
cleanup() {
  rm -f "$MARKER_DIR/test-stop-"* 2>/dev/null
}
trap cleanup EXIT
cleanup

# --- Test 1: First stop attempt is blocked ---
echo "Test 1: First stop attempt is blocked"

OUTPUT=$(echo '{"session_id":"test-stop-1","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_contains "outputs block decision" '"decision"' "$OUTPUT"
assert_contains "decision is block" '"block"' "$OUTPUT"
assert_contains "includes reason" '"reason"' "$OUTPUT"
assert_eq "counter file created" "true" "$([ -f "$MARKER_DIR/test-stop-1-stop-blocks" ] && echo true || echo false)"
assert_eq "counter is 1" "1" "$(cat "$MARKER_DIR/test-stop-1-stop-blocks")"

# --- Test 2: Second stop attempt is also blocked ---
echo "Test 2: Second stop attempt is also blocked"

OUTPUT=$(echo '{"session_id":"test-stop-1","stop_hook_active":true}' | bash "$HOOK_SCRIPT")

assert_contains "second attempt blocked" '"block"' "$OUTPUT"
assert_eq "counter is 2" "2" "$(cat "$MARKER_DIR/test-stop-1-stop-blocks")"

# --- Test 3: Third stop attempt is allowed (counter >= MAX_BLOCKS) ---
echo "Test 3: Third stop attempt is allowed"

OUTPUT=$(echo '{"session_id":"test-stop-1","stop_hook_active":true}' | bash "$HOOK_SCRIPT")

assert_not_contains "no block decision" '"block"' "$OUTPUT"

# --- Test 4: Missing session_id allows stop (permissive fallback) ---
echo "Test 4: Missing session_id allows stop"

OUTPUT=$(echo '{"session_id":"","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_not_contains "no block on missing session_id" '"block"' "$OUTPUT"

# --- Test 5: Fresh session starts at counter 0 ---
echo "Test 5: Fresh session starts at counter 0"

OUTPUT=$(echo '{"session_id":"test-stop-5","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_contains "fresh session is blocked" '"block"' "$OUTPUT"
assert_eq "counter starts at 1" "1" "$(cat "$MARKER_DIR/test-stop-5-stop-blocks")"

# --- Test 6: Exit code is always 0 ---
echo "Test 6: Exit code is always 0"

echo '{"session_id":"test-stop-6","stop_hook_active":false}' | bash "$HOOK_SCRIPT" > /dev/null
assert_eq "exit code 0 on block" "0" "$?"

echo '{"session_id":"test-stop-6","stop_hook_active":true}' | bash "$HOOK_SCRIPT" > /dev/null
assert_eq "exit code 0 on second block" "0" "$?"

echo '{"session_id":"test-stop-6","stop_hook_active":true}' | bash "$HOOK_SCRIPT" > /dev/null
assert_eq "exit code 0 on allow" "0" "$?"

# --- Test 7: Block reason mentions verification ---
echo "Test 7: Block reason mentions verification"

OUTPUT=$(echo '{"session_id":"test-stop-7","stop_hook_active":false}' | bash "$HOOK_SCRIPT")

assert_contains "first block mentions verification" "verification" "$OUTPUT"

OUTPUT=$(echo '{"session_id":"test-stop-7","stop_hook_active":true}' | bash "$HOOK_SCRIPT")

assert_contains "second block mentions verification" "verification" "$OUTPUT"

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
