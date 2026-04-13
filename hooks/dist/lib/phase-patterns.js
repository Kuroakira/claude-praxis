const COMPOUND_OVERRIDES = [
    {
        // "design doc" + implementation intent → plan (not design)
        // "Design Doc に従って実装プランを作成して" means follow the doc and make a plan
        condition: (msg) => /\bdesign\s*doc\b/i.test(msg) &&
            (/\bimplement/i.test(msg) || /実装/.test(msg) || /プラン/.test(msg)),
        phase: "plan",
    },
    {
        // "design/設計" + creation intent → design (prevents plan's /create/ from stealing)
        condition: (msg) => (/\bdesign\b/i.test(msg) || /設計/.test(msg)) &&
            (/\bcreate\b/i.test(msg) || /作成/.test(msg)),
        phase: "design",
    },
];
export const PHASE_PATTERNS = [
    {
        phase: "investigate",
        command: "/claude-praxis:investigate",
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
        description: "thorough implementation plan with Axes Table and architecture analysis",
        patterns: [
            /\bplan\b/i, /\bbreak\s*down/i, /\bstrateg/i,
            /\bimplement/i, /\bbuild\b/i, /\bcreate\b/i, /\badd\b.*\b(feature|function|component)\b/i,
            /計画/, /分解/, /ステップ/, /段階/,
            /実装/, /作って/, /追加/,
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
        phase: "eval",
        command: "/claude-praxis:eval",
        description: "evaluate and improve framework skills from recent execution",
        patterns: [
            /\beval\b/i, /\bevaluat/i, /\bimprove\s+(skill|command|rule)/i,
            /改善/, /スキル.*改善/, /振り返.*改善/,
        ],
    },
];
const SLASH_COMMAND_RE = /^\s*\/(design|investigate|feature-spec|research|plan|review|eval)\b/i;
function formatOutput(phase, command, description) {
    return description
        ? `Phase detected: ${phase}. Suggested command: ${command} — ${description}`
        : `Phase detected: ${phase}. Suggested command: ${command}`;
}
export function detectPhase(message) {
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
