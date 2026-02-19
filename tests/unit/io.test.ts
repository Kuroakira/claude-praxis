import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readStdin, writeJson, exitDeny, exitAllow } from "../../hooks/src/lib/io.js";

describe("readStdin", () => {
  let originalStdin: typeof process.stdin;

  beforeEach(() => {
    originalStdin = process.stdin;
  });

  afterEach(() => {
    Object.defineProperty(process, "stdin", { value: originalStdin });
  });

  it("parses valid JSON and returns typed result", async () => {
    const input = JSON.stringify({ session_id: "abc", tool_input: { skill: "test" } });
    const mockStdin = {
      setEncoding: vi.fn(),
      on: vi.fn((event: string, cb: (data?: string) => void) => {
        if (event === "data") cb(input);
        if (event === "end") cb();
        return mockStdin;
      }),
      resume: vi.fn(),
    };
    Object.defineProperty(process, "stdin", { value: mockStdin });

    const result = await readStdin();
    expect(result).toEqual({ session_id: "abc", tool_input: { skill: "test" } });
  });

  it("throws on invalid JSON", async () => {
    const mockStdin = {
      setEncoding: vi.fn(),
      on: vi.fn((event: string, cb: (data?: string) => void) => {
        if (event === "data") cb("not json");
        if (event === "end") cb();
        return mockStdin;
      }),
      resume: vi.fn(),
    };
    Object.defineProperty(process, "stdin", { value: mockStdin });

    await expect(readStdin()).rejects.toThrow();
  });
});

describe("writeJson", () => {
  it("outputs JSON to stdout", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    writeJson({ decision: "block", reason: "test" });
    expect(spy).toHaveBeenCalledWith(
      JSON.stringify({ decision: "block", reason: "test" }) + "\n"
    );
    spy.mockRestore();
  });
});

describe("exitDeny", () => {
  it("writes to stderr and calls process.exit(2)", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    expect(() => exitDeny("test reason")).toThrow("process.exit");
    expect(stderrSpy).toHaveBeenCalledWith("test reason\n");
    expect(exitSpy).toHaveBeenCalledWith(2);

    stderrSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe("exitAllow", () => {
  it("calls process.exit(0)", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    expect(() => exitAllow()).toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });
});
