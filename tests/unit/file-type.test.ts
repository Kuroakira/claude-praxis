import { describe, it, expect } from "vitest";
import { classifyFile, FileType } from "../../hooks/src/lib/file-type.js";

describe("classifyFile", () => {
  describe("code files", () => {
    const codeExtensions = [
      "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "sh", "bash", "zsh",
      "css", "scss", "less", "html", "vue", "svelte", "go", "rs", "java",
      "kt", "swift", "c", "cpp", "h", "hpp", "rb", "php", "sql", "r",
      "lua", "pl", "ex", "exs", "erl", "hs", "ml", "fs", "cs", "vb",
      "dart", "scala", "groovy", "clj", "nim", "zig", "v", "d",
    ];

    for (const ext of codeExtensions) {
      it(`classifies .${ext} as code`, () => {
        expect(classifyFile(`file.${ext}`)).toBe("code" satisfies FileType);
      });
    }
  });

  describe("document files", () => {
    const docExtensions = [
      "md", "txt", "rst", "adoc", "tex", "org", "wiki", "asciidoc",
    ];

    for (const ext of docExtensions) {
      it(`classifies .${ext} as document`, () => {
        expect(classifyFile(`file.${ext}`)).toBe("document" satisfies FileType);
      });
    }
  });

  describe("config files", () => {
    const configExtensions = [
      "json", "yaml", "yml", "toml", "ini", "env", "xml", "csv", "tsv",
      "lock", "conf", "cfg", "properties", "editorconfig", "gitignore",
      "gitattributes", "dockerignore", "npmrc", "nvmrc",
    ];

    for (const ext of configExtensions) {
      it(`classifies .${ext} as config`, () => {
        expect(classifyFile(`file.${ext}`)).toBe("config" satisfies FileType);
      });
    }
  });

  describe("unknown files", () => {
    it("classifies unknown extension as unknown", () => {
      expect(classifyFile("file.unknown")).toBe("unknown");
    });

    it("classifies empty string as unknown", () => {
      expect(classifyFile("")).toBe("unknown");
    });

    it("classifies no-extension file as unknown", () => {
      expect(classifyFile("no-extension")).toBe("unknown");
    });
  });

  describe("case insensitivity", () => {
    it("classifies FILE.TS as code", () => {
      expect(classifyFile("FILE.TS")).toBe("code");
    });

    it("classifies README.MD as document", () => {
      expect(classifyFile("README.MD")).toBe("document");
    });

    it("classifies config.JSON as config", () => {
      expect(classifyFile("config.JSON")).toBe("config");
    });
  });

  describe("full paths", () => {
    it("classifies /path/to/file.ts as code", () => {
      expect(classifyFile("/path/to/file.ts")).toBe("code");
    });

    it("classifies relative path src/config.yaml as config", () => {
      expect(classifyFile("src/config.yaml")).toBe("config");
    });
  });
});
