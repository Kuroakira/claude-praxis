#!/usr/bin/env bash
# Tests for hooks/task-completed-gate.sh
# Run: bash tests/task-completed-gate.test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK_SCRIPT="$SCRIPT_DIR/../hooks/task-completed-gate.sh"
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

assert_exit_code() {
  local test_name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  PASS: $test_name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $test_name (expected exit=$expected, actual exit=$actual)"
    FAIL=$((FAIL + 1))
  fi
}

assert_stderr_contains() {
  local test_name="$1" expected="$2" stderr_file="$3"
  if grep -q "$expected" "$stderr_file"; then
    echo "  PASS: $test_name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $test_name (stderr expected to contain '$expected', got='$(cat "$stderr_file")')"
    FAIL=$((FAIL + 1))
  fi
}

# Cleanup before and after tests
cleanup() {
  rm -f "$MARKER_DIR/test-tc-"* 2>/dev/null
  rm -f /tmp/task-completed-test-stderr-* 2>/dev/null
}
trap cleanup EXIT
cleanup

STDERR_FILE="/tmp/task-completed-test-stderr-$$"

# --- Test 1: First completion attempt is blocked ---
echo "Test 1: First completion attempt is blocked"

EXIT_CODE=0
echo '{"session_id":"test-tc-1","task_subject":"Implement authentication"}' | bash "$HOOK_SCRIPT" 2>"$STDERR_FILE" || EXIT_CODE=$?

assert_exit_code "exit code is 2 (block)" "2" "$EXIT_CODE"
assert_stderr_contains "stderr mentions verification" "verification" "$STDERR_FILE"

# --- Test 2: Second attempt for same task is allowed ---
echo "Test 2: Second attempt for same task is allowed"

EXIT_CODE=0
echo '{"session_id":"test-tc-1","task_subject":"Implement authentication"}' | bash "$HOOK_SCRIPT" 2>"$STDERR_FILE" || EXIT_CODE=$?

assert_exit_code "exit code is 0 (allow)" "0" "$EXIT_CODE"

# --- Test 3: Different task in same session is blocked independently ---
echo "Test 3: Different task in same session is blocked independently"

EXIT_CODE=0
echo '{"session_id":"test-tc-1","task_subject":"Fix user login bug"}' | bash "$HOOK_SCRIPT" 2>"$STDERR_FILE" || EXIT_CODE=$?

assert_exit_code "different task is blocked" "2" "$EXIT_CODE"

# --- Test 4: Same task name in different session is blocked ---
echo "Test 4: Same task name in different session is blocked"

EXIT_CODE=0
echo '{"session_id":"test-tc-4","task_subject":"Implement authentication"}' | bash "$HOOK_SCRIPT" 2>"$STDERR_FILE" || EXIT_CODE=$?

assert_exit_code "same task different session is blocked" "2" "$EXIT_CODE"

# --- Test 5: Missing session_id allows completion (permissive fallback) ---
echo "Test 5: Missing session_id allows completion"

EXIT_CODE=0
echo '{"session_id":"","task_subject":"Some task"}' | bash "$HOOK_SCRIPT" 2>"$STDERR_FILE" || EXIT_CODE=$?

assert_exit_code "empty session_id allows" "0" "$EXIT_CODE"

# --- Test 6: Missing task_subject allows completion (permissive fallback) ---
echo "Test 6: Missing task_subject allows completion"

EXIT_CODE=0
echo '{"session_id":"test-tc-6","task_subject":""}' | bash "$HOOK_SCRIPT" 2>"$STDERR_FILE" || EXIT_CODE=$?

assert_exit_code "empty task_subject allows" "0" "$EXIT_CODE"

# --- Test 7: Marker file is created on first block ---
echo "Test 7: Marker file is created on first block"

EXIT_CODE=0
echo '{"session_id":"test-tc-7","task_subject":"Add feature X"}' | bash "$HOOK_SCRIPT" 2>/dev/null || EXIT_CODE=$?

# Compute expected hash (must match script's hashing logic)
EXPECTED_HASH=$(printf '%s' "Add feature X" | md5 -q 2>/dev/null || printf '%s' "Add feature X" | md5sum | cut -d' ' -f1)
EXPECTED_HASH="${EXPECTED_HASH:0:12}"

assert_eq "marker file exists" "true" "$([ -f "$MARKER_DIR/test-tc-7-task-$EXPECTED_HASH" ] && echo true || echo false)"

# --- Test 8: Stderr includes task name ---
echo "Test 8: Stderr includes task name"

EXIT_CODE=0
echo '{"session_id":"test-tc-8","task_subject":"Build the dashboard"}' | bash "$HOOK_SCRIPT" 2>"$STDERR_FILE" || EXIT_CODE=$?

assert_stderr_contains "stderr includes task subject" "Build the dashboard" "$STDERR_FILE"

# --- Test 9: Malformed JSON allows completion (permissive fallback) ---
echo "Test 9: Malformed JSON allows completion"

EXIT_CODE=0
echo 'not valid json' | bash "$HOOK_SCRIPT" 2>"$STDERR_FILE" || EXIT_CODE=$?

assert_exit_code "malformed JSON allows" "0" "$EXIT_CODE"

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
