export function readStdin() {
    return new Promise((resolve, reject) => {
        let data = "";
        process.stdin.setEncoding("utf-8");
        process.stdin.on("data", (chunk) => {
            data += chunk;
        });
        process.stdin.on("end", () => {
            try {
                resolve(JSON.parse(data));
            }
            catch (e) {
                reject(e);
            }
        });
        process.stdin.resume();
    });
}
export function writeJson(data) {
    process.stdout.write(JSON.stringify(data) + "\n");
}
export function exitDeny(reason) {
    process.stderr.write(reason + "\n");
    process.exit(2);
}
export function exitAllow() {
    process.exit(0);
}
