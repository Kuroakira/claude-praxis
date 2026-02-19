import { execSync } from "node:child_process";

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface ExecError {
  status: number;
  stdout: string;
  stderr: string;
}

function isExecError(e: unknown): e is ExecError {
  if (typeof e !== "object" || e === null) return false;
  if (!("status" in e)) return false;
  return typeof e.status === "number";
}

export function runScript(
  scriptPath: string,
  input: string,
  options: {
    cwd: string;
    env: Record<string, string | undefined>;
  },
): ExecResult {
  try {
    const stdout = execSync(`node "${scriptPath}"`, {
      input,
      encoding: "utf-8",
      cwd: options.cwd,
      env: options.env,
    });
    return { exitCode: 0, stdout, stderr: "" };
  } catch (e: unknown) {
    if (isExecError(e)) {
      return {
        exitCode: e.status,
        stdout: e.stdout ?? "",
        stderr: e.stderr ?? "",
      };
    }
    throw e;
  }
}
