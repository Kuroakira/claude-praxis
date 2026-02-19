export interface BaseHookInput {
    session_id: string;
    transcript_path: string;
    cwd: string;
    permission_mode: string;
}
export interface SessionStartInput extends BaseHookInput {
    hook_event_name: "SessionStart";
}
export interface PreToolUseInput extends BaseHookInput {
    hook_event_name: "PreToolUse";
    tool_name: string;
    tool_input: Record<string, unknown>;
}
export interface PostToolUseInput extends BaseHookInput {
    hook_event_name: "PostToolUse";
    tool_name: string;
    tool_input: Record<string, unknown>;
}
export interface StopInput extends BaseHookInput {
    hook_event_name: "Stop";
    stop_hook_active: boolean;
}
export interface TaskCompletedInput extends BaseHookInput {
    hook_event_name: "TaskCompleted";
    task_subject: string;
}
export interface PreCompactInput extends BaseHookInput {
    hook_event_name: "PreCompact";
}
export interface HookOutput {
    hookSpecificOutput?: Record<string, unknown>;
}
export interface PreToolUseDenyOutput {
    hookSpecificOutput: {
        hookEventName: "PreToolUse";
        permissionDecision: "deny";
        permissionDecisionReason: string;
    };
}
export interface StopBlockOutput {
    decision: "block";
    reason: string;
}
export declare function getString(obj: unknown, key: string): string;
export declare function getBoolean(obj: unknown, key: string): boolean;
export declare function getRecord(obj: unknown, key: string): Record<string, unknown>;
