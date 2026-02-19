export function readStdin(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk: string) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    process.stdin.resume();
  });
}

export function writeJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data) + "\n");
}

export function exitDeny(reason: string): never {
  process.stderr.write(reason + "\n");
  process.exit(2);
}

export function exitAllow(): void {
  process.exit(0);
}
