#!/usr/bin/env bash
# Tests for UserPromptSubmit Phase Detection hook configuration
# Run: bash tests/phase-detection.test.sh
#
# Since the Phase Detection hook is type: "prompt" (LLM-based),
# we cannot unit test the classification itself. These tests verify:
# 1. hooks.json is valid JSON
# 2. UserPromptSubmit section exists
# 3. The hook is configured as type: "prompt"
# 4. The prompt field is non-empty

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOKS_JSON="$SCRIPT_DIR/../hooks/hooks.json"

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

# --- Test 1: hooks.json is valid JSON ---
echo "Test 1: hooks.json is valid JSON"

python3 -c "import json; json.load(open('$HOOKS_JSON'))" 2>/dev/null
assert_eq "valid JSON" "0" "$?"

# --- Test 2: UserPromptSubmit section exists ---
echo "Test 2: UserPromptSubmit section exists"

HAS_SECTION=$(python3 -c "
import json
data = json.load(open('$HOOKS_JSON'))
print('true' if 'UserPromptSubmit' in data.get('hooks', {}) else 'false')
" 2>/dev/null)

assert_eq "UserPromptSubmit exists" "true" "$HAS_SECTION"

# --- Test 3: Hook type is "prompt" ---
echo "Test 3: Hook type is prompt"

HOOK_TYPE=$(python3 -c "
import json
data = json.load(open('$HOOKS_JSON'))
hooks = data.get('hooks', {}).get('UserPromptSubmit', [])
if hooks and hooks[0].get('hooks'):
    print(hooks[0]['hooks'][0].get('type', ''))
else:
    print('')
" 2>/dev/null)

assert_eq "type is prompt" "prompt" "$HOOK_TYPE"

# --- Test 4: Prompt field is non-empty ---
echo "Test 4: Prompt field is non-empty"

PROMPT_LENGTH=$(python3 -c "
import json
data = json.load(open('$HOOKS_JSON'))
hooks = data.get('hooks', {}).get('UserPromptSubmit', [])
if hooks and hooks[0].get('hooks'):
    prompt = hooks[0]['hooks'][0].get('prompt', '')
    print(len(prompt))
else:
    print(0)
" 2>/dev/null)

assert_eq "prompt is non-empty" "true" "$([ "$PROMPT_LENGTH" -gt 0 ] && echo true || echo false)"

# --- Test 5: Prompt mentions phase detection keywords ---
echo "Test 5: Prompt contains phase classification guidance"

PROMPT_CONTENT=$(python3 -c "
import json
data = json.load(open('$HOOKS_JSON'))
hooks = data.get('hooks', {}).get('UserPromptSubmit', [])
if hooks and hooks[0].get('hooks'):
    print(hooks[0]['hooks'][0].get('prompt', ''))
" 2>/dev/null)

assert_contains "mentions implement" "implement" "$PROMPT_CONTENT"
assert_contains "mentions design" "design" "$PROMPT_CONTENT"
assert_contains "mentions debug" "debug" "$PROMPT_CONTENT"
assert_contains "mentions research" "research" "$PROMPT_CONTENT"
assert_contains "mentions feature-spec" "feature-spec" "$PROMPT_CONTENT"

# --- Test 5b: Prompt includes multilingual classification instruction ---
echo "Test 5b: Prompt supports non-English input"

assert_contains "mentions language-agnostic classification" "language" "$PROMPT_CONTENT"

# --- Test 6: All existing hook sections are preserved ---
echo "Test 6: Existing hook sections preserved"

EXISTING_HOOKS=$(python3 -c "
import json
data = json.load(open('$HOOKS_JSON'))
hooks = data.get('hooks', {})
sections = sorted(hooks.keys())
print(' '.join(sections))
" 2>/dev/null)

assert_contains "SessionStart preserved" "SessionStart" "$EXISTING_HOOKS"
assert_contains "PreCompact preserved" "PreCompact" "$EXISTING_HOOKS"
assert_contains "PreToolUse preserved" "PreToolUse" "$EXISTING_HOOKS"
assert_contains "PostToolUse preserved" "PostToolUse" "$EXISTING_HOOKS"
assert_contains "Stop preserved" "Stop" "$EXISTING_HOOKS"
assert_contains "TaskCompleted preserved" "TaskCompleted" "$EXISTING_HOOKS"

# --- Summary ---
echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
