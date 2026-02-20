import { readStdin, writeJson } from "./lib/io.js";
import { getString } from "./lib/types.js";

interface PhasePattern {
  phase: string;
  command: string;
  patterns: RegExp[];
}

const PHASE_PATTERNS: PhasePattern[] = [
  {
    phase: "debug",
    command: "/claude-praxis:debug",
    patterns: [
      /\bbug\b/i, /\berror\b/i, /\bcrash/i, /\bfail/i, /\bbroken\b/i,
      /バグ/, /エラー/, /動かな/, /壊れ/, /落ち/, /失敗/, /おかしい/,
      /不具合/, /原因/, /調査.*問題/, /なぜ.*動/,
    ],
  },
  {
    phase: "feature-spec",
    command: "/claude-praxis:feature-spec",
    patterns: [
      /\bfeature\s+spec/i, /\brequirement/i, /\bspec\b/i,
      /要件/, /仕様/, /何を作/, /機能.*定義/,
    ],
  },
  {
    phase: "design",
    command: "/claude-praxis:design",
    patterns: [
      /\bdesign\s+doc/i, /\barchitect/i, /\bdesign\b.*\b(system|api|schema)\b/i,
      /設計/, /アーキテクチャ/, /構成/,
    ],
  },
  {
    phase: "implement",
    command: "/claude-praxis:implement",
    patterns: [
      /\bimplement/i, /\bbuild\b/i, /\bcreate\b/i, /\badd\b.*\b(feature|function|component)\b/i,
      /実装/, /作って/, /追加/, /修正して/, /コード.*書/,
    ],
  },
  {
    phase: "research",
    command: "/claude-praxis:research",
    patterns: [
      /\bresearch/i, /\bcompare\b/i, /\binvestigat/i, /\bexplor/i,
      /調査/, /比較/, /調べ/, /探/, /リサーチ/,
    ],
  },
  {
    phase: "plan",
    command: "/claude-praxis:plan",
    patterns: [
      /\bplan\b/i, /\bbreak\s*down/i, /\bstrateg/i,
      /計画/, /分解/, /ステップ/, /段階/,
    ],
  },
  {
    phase: "review",
    command: "/claude-praxis:review",
    patterns: [
      /\breview\b/i, /\bcode\s*review/i, /\bfeedback\b/i,
      /レビュー/, /見て/, /確認して.*コード/,
    ],
  },
  {
    phase: "compound",
    command: "/claude-praxis:compound",
    patterns: [
      /\bcompound\b/i, /\blearning/i, /\bretrospect/i,
      /振り返/, /学び/, /知見/,
    ],
  },
];

const SLASH_COMMAND_RE =
  /^\s*\/(design|implement|debug|feature-spec|research|plan|review|compound)\b/i;

function detectPhase(message: string): string {
  // 1. Slash command detection (highest priority)
  const slashMatch = message.match(SLASH_COMMAND_RE);
  if (slashMatch) {
    const phase = slashMatch[1].toLowerCase();
    return `Phase detected: ${phase}. Suggested command: /claude-praxis:${phase}`;
  }

  // 2. Keyword pattern matching
  for (const { phase, command, patterns } of PHASE_PATTERNS) {
    if (patterns.some((re) => re.test(message))) {
      return `Phase detected: ${phase}. Suggested command: ${command}`;
    }
  }

  // 3. No match → empty (pass-through, never blocks)
  return "";
}

try {
  const input = await readStdin();
  const prompt = getString(input, "prompt");
  const result = detectPhase(prompt);

  writeJson({
    hookSpecificOutput: {
      additionalContext: result,
    },
  });
} catch {
  // Any failure → safe pass-through (never block user input)
  writeJson({
    hookSpecificOutput: {
      additionalContext: "",
    },
  });
}
