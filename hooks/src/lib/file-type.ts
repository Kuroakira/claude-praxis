export type FileType = "code" | "document" | "config" | "unknown";

const extensionMap = new Map<string, FileType>();

const codeExtensions = [
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "sh", "bash", "zsh",
  "css", "scss", "less", "html", "vue", "svelte", "go", "rs", "java",
  "kt", "swift", "c", "cpp", "h", "hpp", "rb", "php", "sql", "r",
  "lua", "pl", "ex", "exs", "erl", "hs", "ml", "fs", "cs", "vb",
  "dart", "scala", "groovy", "clj", "nim", "zig", "v", "d",
];

const documentExtensions = [
  "md", "txt", "rst", "adoc", "tex", "org", "wiki", "asciidoc",
];

const configExtensions = [
  "json", "yaml", "yml", "toml", "ini", "env", "xml", "csv", "tsv",
  "lock", "conf", "cfg", "properties", "editorconfig", "gitignore",
  "gitattributes", "dockerignore", "npmrc", "nvmrc",
];

for (const ext of codeExtensions) extensionMap.set(ext, "code");
for (const ext of documentExtensions) extensionMap.set(ext, "document");
for (const ext of configExtensions) extensionMap.set(ext, "config");

export function classifyFile(filePath: string): FileType {
  if (!filePath) return "unknown";
  const lastDot = filePath.lastIndexOf(".");
  if (lastDot === -1) return "unknown";
  const ext = filePath.slice(lastDot + 1).toLowerCase();
  if (!ext) return "unknown";
  return extensionMap.get(ext) ?? "unknown";
}
