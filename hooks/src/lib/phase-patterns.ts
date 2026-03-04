export interface PhasePattern {
  phase: string;
  command: string;
  description: string;
  patterns: RegExp[];
}

// DD4: Compound overrides — checked before individual patterns.
// Each entry resolves an ambiguity where multiple phases could match.
interface CompoundOverride {
  condition: (msg: string) => boolean;
  phase: string;
}

// Order matters: when both overrides match, the first wins.
// Override[0] (implement) is ordered first because "Design Doc に従って実装プラン"
// (referencing a Design Doc to create an implementation plan) is more common than
// "Create a design doc for the implementation" (creating a Design Doc about implementation).
// This is an intentional trade-off — regex cannot disambiguate semantic intent when
// both "design doc" and implementation keywords appear. Advisory-only, so misclassification
// has limited impact.
const COMPOUND_OVERRIDES: CompoundOverride[] = [
  {
    // "design doc" / "DesignDoc" + implementation intent → implement (not design)
    condition: (msg) =>
      /\bdesign\s*doc\b/i.test(msg) &&
      (/\bimplement/i.test(msg) || /実装/.test(msg) || /プラン/.test(msg)),
    phase: "implement",
  },
  {
    // "design/設計" + creation intent → design (prevents implement's /create/ from stealing)
    condition: (msg) =>
      (/\bdesign\b/i.test(msg) || /設計/.test(msg)) &&
      (/\bcreate\b/i.test(msg) || /作成/.test(msg)),
    phase: "design",
  },
];

export const PHASE_PATTERNS: PhasePattern[] = [
  {
    phase: "debug",
    command: "/claude-praxis:debug",
    description: "systematic diagnosis with parallel investigation",
    patterns: [
      /\bbug\b/i, /\berror\b/i, /\bcrash/i, /\bfail/i, /\bbroken\b/i,
      /バグ/, /エラー/, /動かな/, /壊れ/, /落ち/, /失敗/, /おかしい/,
      /不具合/, /原因/, /調査.*問題/, /なぜ.*動/,
    ],
  },
  {
    phase: "feature-spec",
    command: "/claude-praxis:feature-spec",
    description: "AI-driven interview to capture requirements",
    patterns: [
      /\bfeature\s+spec/i, /\brequirement/i, /\bspec\b/i,
      /要件/, /仕様/, /何を作/, /機能.*定義/,
    ],
  },
  // DD4: implement BEFORE design to reduce false design matches
  {
    phase: "implement",
    command: "/claude-praxis:implement",
    description: "Phase 1 creates the implementation plan; then TDD-driven development with graduated review",
    patterns: [
      /\bimplement/i, /\bbuild\b/i, /\bcreate\b/i, /\badd\b.*\b(feature|function|component)\b/i,
      /実装/, /作って/, /追加/, /修正して/, /コード.*書/,
    ],
  },
  {
    phase: "design",
    command: "/claude-praxis:design",
    description: "Design Doc with research, per-axis evaluation, and review",
    patterns: [
      /\bdesign\s+doc/i, /\barchitect/i, /\bdesign\b.*\b(system|api|schema)\b/i,
      /設計/, /アーキテクチャ/, /構成/,
    ],
  },
  {
    phase: "research",
    command: "/claude-praxis:research",
    description: "explore options and compare approaches",
    patterns: [
      /\bresearch/i, /\bcompare\b/i, /\binvestigat/i, /\bexplor/i,
      /調査/, /比較/, /調べ/, /探/, /リサーチ/,
    ],
  },
  {
    phase: "plan",
    command: "/claude-praxis:plan",
    description: "break down into TDD-driven implementation steps",
    patterns: [
      /\bplan\b/i, /\bbreak\s*down/i, /\bstrateg/i,
      /計画/, /分解/, /ステップ/, /段階/,
    ],
  },
  {
    phase: "review",
    command: "/claude-praxis:review",
    description: "multi-dimensional code review",
    patterns: [
      /\breview\b/i, /\bcode\s*review/i, /\bfeedback\b/i,
      /レビュー/, /見て/, /確認して.*コード/,
    ],
  },
  {
    phase: "compound",
    command: "/claude-praxis:compound",
    description: "extract and accumulate learnings",
    patterns: [
      /\bcompound\b/i, /\blearning/i, /\bretrospect/i,
      /振り返/, /学び/, /知見/,
    ],
  },
];

const SLASH_COMMAND_RE =
  /^\s*\/(design|implement|debug|feature-spec|research|plan|review|compound)\b/i;

function formatOutput(phase: string, command: string, description: string): string {
  return description
    ? `Phase detected: ${phase}. Suggested command: ${command} — ${description}`
    : `Phase detected: ${phase}. Suggested command: ${command}`;
}

export function detectPhase(message: string): string {
  // 1. Slash command detection (highest priority)
  const slashMatch = message.match(SLASH_COMMAND_RE);
  if (slashMatch) {
    const phase = slashMatch[1].toLowerCase();
    const entry = PHASE_PATTERNS.find((p) => p.phase === phase);
    const command = entry?.command ?? `/claude-praxis:${phase}`;
    const description = entry?.description ?? "";
    return formatOutput(phase, command, description);
  }

  // 2. Compound pattern detection (resolves ambiguity before individual patterns)
  for (const override of COMPOUND_OVERRIDES) {
    if (override.condition(message)) {
      const entry = PHASE_PATTERNS.find((p) => p.phase === override.phase);
      if (entry) {
        return formatOutput(entry.phase, entry.command, entry.description);
      }
    }
  }

  // 3. Keyword pattern matching (first-match-wins in array order)
  for (const { phase, command, description, patterns } of PHASE_PATTERNS) {
    if (patterns.some((re) => re.test(message))) {
      return formatOutput(phase, command, description);
    }
  }

  // 4. No match → empty (pass-through, never blocks)
  return "";
}
