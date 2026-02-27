# Layer Architecture Redesign

## Overview

claude-praxisの4つの構成レイヤー（Rule, Skill, Command, Hook）の責務を再定義し、重複を排除する。同じ情報が3箇所以上に存在し、レイヤー間の境界が曖昧になっていることが、挙動の不安定さの主因と考えられる。ECCの「レイヤー分離原則」を参考にしつつ、Praxisの哲学（WHYを言語化する、エンジニアが成長する）は維持する。

## 結論: 再設計後の全体像

### 6レイヤーの役割と読み込みタイミング

ECCの6種類（agents, skills, commands, rules, hooks, mcp-configs）を参考に、Praxisでは以下の6レイヤーを定義する。mcp-configsはPraxis固有の設定を持たないため、代わりにCLAUDE.mdをレイヤーとして明示する。

```
セッション開始時に自動読み込み（常時コンテキスト）
┌─────────────────────────────────────────────────┐
│ CLAUDE.md                                       │
│   プロジェクト情報、ワークフロー概要、           │
│   Skill/Agent一覧（名前と用途の1行説明のみ）     │
│                                                 │
│   @rules/code-quality.md      ← 常時適用の制約  │
│   @rules/document-quality.md                    │
│   @rules/design-doc-format.md                   │
│   @rules/verification.md                        │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Hook（自動チェック機構・警報装置）                │
│   session-start.ts  → セッション状態の事実通知   │
│   phase-detect.ts   → フェーズ自動検知          │
│   その他            → マーカー管理、warn通知     │
└─────────────────────────────────────────────────┘

コマンド実行 / Task dispatch時にオンデマンド読み込み
┌─────────────────────────────────────────────────┐
│ Command（薄いオーケストレーター）                 │
│   /implement → Phase順序 + PAUSE点              │
│   /design    → Phase順序 + PAUSE点              │
│   /feature-spec, /debug, /research, /plan...    │
│                                                 │
│   手順はSkillに委譲:                             │
│     "invoke check-past-learnings (role: ...)"   │
│     "invoke tdd-cycle"                          │
│   実行はAgentに委譲:                             │
│     "dispatch scout agent"                      │
│     "dispatch 4 reviewer agents in parallel"    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Skill（業務マニュアル — HOW）                    │
│   check-past-learnings   → 学習の想起手順        │
│   parallel-review-team   → レビューチーム手順    │
│   tdd-cycle              → RED-GREEN-REFACTOR   │
│   rule-evolution         → ルール自己進化手順    │
│   context-persistence    → 永続化手順           │
│   systematic-debugging   → 調査手順             │
│   subagent-driven-dev    → サブエージェント実行  │
│   agent-team-execution   → 並列チーム実行       │
│   ...                                           │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Agent（専門部署 — WHO）                          │
│   implementer → コード実装（Write/Edit可、TDD）  │
│   reviewer    → コードレビュー（読み取り専用）    │
│   researcher  → 調査（haiku、Web検索可）         │
│   scout       → コードベース探索（haiku、読み専） │
│                                                 │
│   tools, model, maxTurnsで能力を制約             │
│   Ruleは親コンテキスト経由で自動適用             │
└─────────────────────────────────────────────────┘
```

### 各レイヤーが答える問い

| レイヤー | 問い | 例 |
|---------|------|-----|
| **CLAUDE.md** | このプロジェクトは何か、どう使うか | ワークフロー概要、ファイル構造、哲学 |
| **Rule** | 何を常に守るか | TDD必須、`as`禁止、完了時は検証証拠必須 |
| **Command** | どの順番で、誰が、どこで人間が判断するか | Phase 0→1→PAUSE→2→3、skill invoke先 + agent dispatch先 |
| **Skill** | 具体的にどうやるか（HOW） | REDで失敗テスト→GREENで最小コード→REFACTOR |
| **Agent** | 誰がやるか（WHO） | implementer=書く人、reviewer=読む人、researcher=調べる人 |
| **Hook** | 何を自動で検知・通知するか | フェーズ検知、コンテキスト圧力、完了確認 |

### 境界ルール: 1つの事実は1箇所だけ

| 情報 | 唯一の置き場 | 他レイヤーでの扱い |
|------|------------|------------------|
| TDD必須という制約 | rules/code-quality.md | commandは「invoke tdd-cycle」とだけ書く |
| RED-GREEN-REFACTORの手順 | skills/tdd-cycle/ | ruleは手順を書かない |
| Phase Detection表 | hooks/phase-detect.ts | CLAUDE.mdやskillに複製しない |
| レビューチームの構成と手順 | skills/parallel-review-team/ | commandは「invoke parallel-review-team (type: X)」とだけ書く |
| 学習ファイルの想起手順 | skills/check-past-learnings/ | commandは「invoke check-past-learnings (role: X)」とだけ書く |
| 完了時の検証ルール | rules/verification.md | hookはルール内容を再記述せずwarnだけ出す |
| implementerの能力定義 | agents/implementer.md | commandは「dispatch implementer」とだけ書く。skillやruleをagentに埋め込まない |

### 廃止されるもの

| 廃止対象 | 理由 | 移動先 |
|---------|------|--------|
| skills/getting-started/ | 5責務のgod-object | 各レイヤーに分散（詳細は本文参照） |
| skills/code-quality-rules/ | ルールとスキルの混在 | rules/ + tdd-cycle + rule-evolution |
| skills/document-quality-rules/ | 同上 | rules/ + rule-evolution |
| skills/verification-before-completion/ | ルールをskillに置く必要がない | rules/verification.md |
| skills/design-doc-format/ | 同上 | rules/design-doc-format.md |
| hooks/check-skill-gate.ts | Rule層導入でinvoke強制が不要に | warn格下げ → 将来廃止 |

## Claude Codeのコンテキスト読み込みモデル

この設計を理解するには、Claude Codeが各レイヤーをいつ・どのようにコンテキストに読み込むかを把握する必要がある。レイヤーごとの読み込みタイミングとトークンコストが、設計上の制約を決める。

### 読み込みの順序とタイミング

Claude Codeのセッション開始時、以下の順序でコンテキストが構築される:

```
1. システムプロンプト（Claude Code内部の基本指示）
    ↓
2. CLAUDE.md（プロジェクト/ユーザー/ローカルの全階層）
   ├── @importで参照されたファイルもここで展開
   └── 常にコンテキストに存在（毎セッション消費）
    ↓
3. Skill descriptions（全スキルの名前+description行のみ）
   └── ~100トークン/skill × スキル数（常にコンテキストに存在）
    ↓
4. SessionStart hook実行
   └── additionalContextとして注入（常にコンテキストに存在）
    ↓
5. ユーザーの最初のメッセージ
    ↓
6. UserPromptSubmit hook実行（phase-detect等）
   └── additionalContextとして注入
    ↓
--- ここからオンデマンド ---
7. Skill full content（invokeされた時だけ読み込み）
   └── ~2000+トークン/skill（使った時だけ消費）
    ↓
8. Command content（ユーザーがスラッシュコマンド実行時）
   └── commandのmarkdown全体が読み込まれる
    ↓
9. PreToolUse hook（ツール実行前に発火）
10. PostToolUse hook（ツール実行後に発火）
11. Stop hook（セッション終了時に発火）
```

### 2つのコンテキスト領域

| 領域 | 含まれるもの | 特性 |
|------|------------|------|
| **常時コンテキスト** | CLAUDE.md（@import含む）、Skill descriptions、SessionStart hook出力 | 毎セッション消費。増やすほど全セッションのトークンコストが上がる |
| **オンデマンドコンテキスト** | Skill full content、Command content、Tool結果 | 使った時だけ消費。必要な時に必要な分だけ読み込まれる |

### 重要な制約: `.claude/rules/` は公式機能ではない

調査の結果、Claude Code公式ドキュメントに `.claude/rules/` ディレクトリの自動読み込み機能は記載されていない。ECCが使っている `rules/` ディレクトリは、CLAUDE.mdからの `@` importで参照するか、フレームワーク独自の仕組みで読み込んでいる。

つまり「ruleファイルを置くだけで常時適用」は実現できない。Rule層を常時コンテキストに入れるには、以下のいずれかが必要:

1. **CLAUDE.mdからの@import** — `@rules/code-quality.md` のように参照。常時コンテキストに入る
2. **SessionStart hookでの注入** — hookのadditionalContextに内容を含める。常時コンテキストに入る
3. **Skill（現状維持）** — invokeされた時だけ読み込む。オンデマンドだが「常時適用」にならない

### 現在のトークンコスト概算

現在、常時コンテキストを消費しているもの:

| ソース | 推定行数 | 常時/オンデマンド |
|--------|---------|----------------|
| ~/.claude/CLAUDE.md + @imports（RULES.md, PRINCIPLES.md, FLAGS.md, MODE_Reference.md, MCP_Reference.md） | ~400行 | 常時 |
| プロジェクトCLAUDE.md | ~160行 | 常時 |
| Skill descriptions × 13 | ~130行相当 | 常時 |
| SessionStart hook → getting-started inject | ~227行 | 常時 |
| **合計** | **~917行** | **常時** |

これに加えて、オンデマンドで:
- code-quality-rules invoke: ~360行
- document-quality-rules invoke: ~243行
- その他skill invoke: 可変

## Context and Scope

### なぜ今の構造が不安定なのか

claude-praxisの4レイヤーは本来それぞれ異なる責務を持つべきだが、現状はレイヤー間で情報が重複し、「どこが正か」が曖昧になっている。この曖昧さがClaudeの解釈ブレを生み、挙動が安定しない。

問題は3つに分類できる。

**問題1: Rule層が存在しない**

「常に守るべき制約」がskillとして実装されているため、invokeしないと適用されない。この構造上の欠陥を補うためにcheck-skill-gate hookがinvokeを強制しているが、その結果「hookがskillの適用を保証し、skillがルールの内容を保持し、commandがskillのinvokeを宣言する」という三重構造が生まれている。ルールを1箇所に置いて常時適用すれば、この三重構造は不要になる。

該当するskill:
- code-quality-rules（360行）— 制約と自己進化プロトコルが混在
- document-quality-rules（243行）— 同上
- verification-before-completion（102行）— 完了時の制約
- design-doc-format — Design Docフォーマット制約

**問題2: 同じ情報が複数箇所に存在する**

| 情報 | 存在箇所 | 重複数 |
|-----|---------|-------|
| Past Learnings recall手順 | design.md, debug.md, feature-spec.md, implement.md, getting-started | 5箇所 |
| Phase Detection表 | getting-started, phase-detect.ts hook, CLAUDE.md | 3箇所 |
| Post-implementation checks | code-quality-rules, verification-before-completion, implement.md | 3箇所 |
| Parallel Review Team手順 | implement.md, design.md, feature-spec.md | 3箇所 |
| TDD手順（RED-GREEN-REFACTOR） | code-quality-rules, implement.md, subagent-driven-development | 3箇所 |
| Next Phase Lookup | verification-before-completion, getting-started | 2箇所 |

微妙に異なる表現で同じことが書かれているため、Claudeがどの記述を優先すべきか判断できず、解釈がブレる。

**問題3: getting-startedが5つの責務を持つgod-object**

SessionStartフックが毎回injectする227行のskillに、以下が詰め込まれている:
- 哲学（Core Philosophy）
- Phase Detection表 + Suggestion Behavior + Phase Completion Signals
- Skill表 + Mandatory Invocation + Anti-Rationalization
- Contextual Recall手順
- In-flight Process Improvement + Feedback-Driven Improvement
- Session Start Checklist + compact復帰手順

全セッションでこの227行がコンテキストを消費し、かつ内容の多くが他のレイヤーと重複している。

### ECCから学ぶこと

everything-claude-codeリポジトリの設計原則は「各レイヤーが1つの責務だけを持ち、他のレイヤーの内容を複製しない」というもの。CLAUDE.mdにはプロジェクト情報だけ、rulesにはルールだけ、skillsにはワークフローだけ、hooksにはイベント駆動の自動化だけを置く。

Praxisが採用するのはこの「分離原則」であり、ECCのツールキット的構造（多言語対応、大規模skillライブラリ）ではない。Praxisの目的は「1つのプロジェクトで理解を深める」ことであり、レイヤー分離はその目的を支える手段として導入する。

### Scope

**In Scope:**
- 4レイヤーの責務定義と境界ルール
- 既存コンポーネントの移動先マッピング
- getting-startedの分解計画
- 段階的移行の順序

**Out of Scope:**
- hookのTypeScriptロジック変更（移行先が決まった後の別タスク）
- CLAUDE.md / README.mdの書き換え（本ドキュメントを参照して別途実施）
- 新機能の追加

## Proposal

### 6レイヤーの責務定義

各レイヤーは1つの問いに答える。他のレイヤーの問いには踏み込まない。

| レイヤー | 答える問い | 持つもの | 持たないもの |
|---------|-----------|---------|------------|
| **CLAUDE.md** | 「このプロジェクトは何か」 | プロジェクト情報、ワークフロー概要、Skill/Agent一覧 | ルール詳細、手順、hookロジック |
| **Rule** | 「何を常に守るか」 | 制約、禁止事項、品質基準（❌/✅例込み） | 手順、ワークフロー、自己進化ロジック |
| **Command** | 「どの順番で、誰が、どこで人間が判断するか」 | フェーズ順序、PAUSEポイント、skill invoke先、agent dispatch先 | 手順の中身（skillに委譲）、制約（ruleに委譲） |
| **Skill** | 「どうやるか」の再利用断片 | 手順、テンプレート、判断基準 | 制約（Ruleの仕事）、フェーズ順序（Commandの仕事） |
| **Agent** | 「誰がやるか」の定義 | 役割、使えるtools、model、maxTurns | 手順（skillの仕事）、制約（ruleの仕事） |
| **Hook** | 「何を自動で検知・通知するか」 | イベント検知、warn/remind、マーカー管理 | ルール内容の再記述、手順の重複 |

この境界を維持するための原則: **1つの事実は1箇所にだけ書く。他のレイヤーが参照する場合は「○○を参照」とだけ書き、内容を複製しない。**

---

### Rule層の設計

Rule層は「常に守るべき制約」を保持する。invokeなしで常時適用される。

#### 実装方式: CLAUDE.mdからの@import

`.claude/rules/` の自動読み込みは公式機能ではないため、CLAUDE.mdからの `@` importで実現する。具体的には、プラグインのCLAUDE.md（またはプロジェクトのCLAUDE.md）に以下を記述する:

```
@rules/code-quality.md
@rules/document-quality.md
@rules/design-doc-format.md
@rules/verification.md
```

これにより、ruleの内容は常時コンテキストに入る。

#### トークンコストのトレードオフ

ruleを常時コンテキストに入れると、全セッションでトークンを消費する。しかし、以下の相殺がある:

| 削減されるもの | 推定行数 | 理由 |
|--------------|---------|------|
| getting-started inject（SessionStart hook） | -227行 | getting-started廃止 |
| ~/.claude/RULES.md（@import） | -200行 | Rule層に統合、RULES.md廃止 |
| ~/.claude/PRINCIPLES.md（@import） | -50行 | 重複排除でCLAUDE.mdに縮小統合 |
| **削減合計** | **~-477行** | |

| 追加されるもの | 推定行数 | 理由 |
|--------------|---------|------|
| rules/code-quality.md | ~200行 | 360行のskillから制約部分のみ（自己進化、TDD詳細を除外） |
| rules/document-quality.md | ~150行 | 243行のskillから制約部分のみ（自己進化を除外） |
| rules/verification.md | ~60行 | 102行のskillからルール部分のみ |
| rules/design-doc-format.md | ~80行 | 現行skillの全内容 |
| **追加合計** | **~+490行** | |

差引きは概ね同等（+13行程度）だが、質的な改善がある:
- 削減分は「哲学の重複記述」「skill表の反復」「冗長なルール要約」
- 追加分は「具体的な制約とコード例」（Claudeの行動を直接規定する情報）

つまり、同じトークン量で「情報の密度と有用性」が上がる。

#### 制約の記述はコンパクトにする

常時コンテキストに入るため、冗長さを排除する。具体的には:
- ❌/✅のコード例は最小限（1例ずつ）に絞る。現行は複数パターンを網羅的に列挙しているが、ruleとしては代表例で十分
- 説明文は1-2文以内。「なぜこのルールが必要か」は書かない（それはrule-evolution skillの記録に残す）
- Anti-Rationalization表は4ルールファイルに分散させず、1箇所にまとめる

現在のskillから「制約」部分だけを抽出し、「手順」は抽出しない。

#### rules/code-quality.md

**抽出元**: code-quality-rules SKILL.md

抽出する内容:
- Absolute Rules — TDD Required, TypeScript Type Safety, No Generic Return Types, ESLint/Linter Rules, Test Quality, No Obvious Comments
- Post-Implementation Checklist（typecheck, lint, test, buildの4コマンド）
- Security Rules — No Hardcoded Secrets, Input Validation at Boundaries, No Dynamic Code Execution, Dependency Awareness
- Anti-Rationalization表
- Project-Specific Rulesセクション（自己進化で追加されたルールの置き場）

抽出しない内容:
- Rule Evolution Protocol → skill `rule-evolution` に移動
- TDD Required内のRED-GREEN-REFACTORの具体手順 → skill `tdd-cycle` に移動。ruleには「Wrote production code before tests? → Delete and redo.」の制約だけを残す

#### rules/document-quality.md

**抽出元**: document-quality-rules SKILL.md

抽出する内容:
- Absolute Rules — Abstract-to-Concrete Structure（Document/Section両レベル）、Terminology Consistency、Progressive Detailing、No Terminology Drift、Self-Contained Sections
- Document Checklist
- Anti-Rationalization表
- Project-Specific Rulesセクション

抽出しない内容:
- Rule Evolution Protocol → skill `rule-evolution` に統合（code-qualityと共通）

#### rules/design-doc-format.md

**抽出元**: design-doc-format SKILL.md

Design Docのフォーマット制約は「書くたびにinvokeする」ものではなく「常に守るべきフォーマット規約」の性質を持つ。全内容をruleに移動する。

#### rules/verification.md

**抽出元**: verification-before-completion SKILL.md

抽出する内容:
- The Iron Law（完了主張には新鮮な検証証拠が必要）
- Process（4ステップ: コマンド実行 → 出力読む → 証拠引用 → 主張）
- Forbidden Language表
- Verification Checklist
- Completion Report template（Next Phase Lookup表を含む）
- Red Flags

これらは「完了を主張する際に常に守るべき制約」であり、invokeで適用するのでは遅い。hookでblockしている現状が、本来ruleであるべき証拠。

---

### Skill層の再構成

既存のワークフロースキルは維持し、commandに散在する共通パターンを新設skillとして抽出する。

#### 新設: check-past-learnings

**抽出元**: design.md Phase 0, debug.md Phase 0, feature-spec.md Phase 0, implement.md Phase 1 step 3, getting-started Contextual Recall

4つのcommandに散在するPhase 0（学習の想起手順）と、getting-startedのContextual Recall規則を統合する。

Roleベースでファイルマッピングを行う。commandは `invoke check-past-learnings (role: ...)` の1行で済む。

| Role | 読むファイル | 想起の切り口 |
|------|------------|------------|
| requirements | learnings-feature-spec.md, global-learnings.md | 同じコンテキストが当てはまるか |
| design | learnings-feature-spec.md, learnings-design.md, global-learnings.md | 同じ前提が成り立つか |
| implementation | learnings-design.md, learnings-coding.md, global-learnings.md | 同じ前提が成り立つか |
| investigation | learnings-coding.md, global-learnings.md | 同じメカニズムが働いているか |

想起の共通パターン:
> "Previously [past decision/observation] because [rationale]. Does the same [assumption/context/mechanism] hold here?"

getting-startedのContextual Recall規則（原文rationale提示、assumptions確認、quizしない、confidence metadataの提示）もこのskillに含める。

#### 新設: parallel-review-team

**抽出元**: implement.md Phase 3, design.md Phase 5, feature-spec.md Phase 4

3つのcommandに共通するレビュー手順を統合する。

スキルの内容:
- レビューチーム構成の選択原則（agent-team-execution §4 Parallel Review Teamsを参照）
- 3つのレビュー構成テンプレート（Code Review, Document Review, Spec Review）
- Apply Findingsの共通手順（Critical→修正、Minor→報告、競合→明示的解決）
- progress.mdへの記録テンプレート

各commandは `invoke parallel-review-team (type: code-review)` の1行で済む。レビューチーム構成自体はskillが保持し、commandはtypeだけ指定する。

#### 新設: tdd-cycle

**抽出元**: implement.md Step A

RED-GREEN-REFACTORの具体手順を独立skillに抽出する。

スキルの内容:
- RED: 期待動作を定義する失敗テストを書く
- GREEN: テストを通す最小限のコードを書く
- REFACTOR: テストを緑に保ったまま整理する
- 判断ポイントでの人間への相談パターン（複数の妥当なアプローチがある場合）

code-quality ruleには「TDD Required — Delete and redo.」の制約だけが残り、具体的なやり方はこのskillが持つ。subagent-driven-developmentのImplementer Prompt TemplateもこのskillをTDD手順の正として参照する。

#### 新設: rule-evolution

**抽出元**: code-quality-rules Rule Evolution Protocol, document-quality-rules Rule Evolution Protocol, getting-started In-Flight Process Improvement + Feedback-Driven Improvement

2つのskillに存在するRule Evolution Protocolと、getting-startedの改善提案手順を統合する。

スキルの内容:
- 問題検知 → 提案 → 承認 → ルール追加 の共通フロー
- ルール追加フォーマット（❌/✅例 + 言い訳対応）
- In-flight改善（作業中に気づいた改善をその場で提案する手順）
- Feedback-Driven Improvement（人間のフィードバックからルール化を提案する手順）

#### 既存skillの変更

| Skill | 変更 |
|-------|------|
| code-quality-rules | **廃止** → rules/code-quality.md + tdd-cycle + rule-evolution に分散 |
| document-quality-rules | **廃止** → rules/document-quality.md + rule-evolution に分散 |
| verification-before-completion | **廃止** → rules/verification.md に移動 |
| design-doc-format | **廃止** → rules/design-doc-format.md に移動 |
| getting-started | **廃止** → 下記「getting-started分解」参照 |
| subagent-driven-development | TDD手順の参照先をtdd-cycleに変更 |
| context-persistence | 変更なし |
| systematic-debugging | 変更なし |
| agent-team-execution | 変更なし |
| writing-skills | 変更なし |
| requesting-code-review | 変更なし |
| receiving-code-review | 変更なし |
| git-worktrees | 変更なし |

---

### getting-started分解

現在の227行を各レイヤーに分散し、getting-started自体を廃止する。

| セクション | 行数 | 移動先 | 理由 |
|-----------|------|--------|------|
| Core Philosophy | 6行 | CLAUDE.md（既に同等の内容あり。削除のみ） | 哲学はプロジェクト説明の一部 |
| First Response Gate | 10行 | 削除 | Rule層導入でskill invoke gateの前提が消える |
| Mandatory Skill Invocation + Skill表 | 45行 | CLAUDE.mdのワークフロー説明に縮小統合 | 制約はRule層が担保。Skill表はCLAUDE.mdにコンパクトに残す |
| Phase Detection表 + Suggestion Behavior + Completion Signals | 50行 | phase-detect.ts hookに一本化 | getting-startedとhookの二重管理を解消 |
| Contextual Recall of Past Learnings | 20行 | skill `check-past-learnings` に統合 | |
| In-Flight Process Improvement + Feedback-Driven Improvement | 30行 | skill `rule-evolution` に統合 | |
| Session Start Checklist | 15行 | session-start.ts hookの出力に統合 | |
| Recovery from compact/clear | 10行 | skill `context-persistence` に統合（類似内容あり） | |

getting-started廃止後、session-start.ts hookの出力は:
- 既存の永続化ファイル（progress.md, task_plan.md, learnings-*.md）の存在通知
- 前回compact有無の通知
- compound未実行の通知

哲学やskill表ではなく、**セッション状態の事実**だけを伝える。

---

### Command層の薄化

各commandは「フェーズ順序 + PAUSEポイント + skill呼び出し」だけを持つ。フェーズ固有の手順（design.mdのResearch Team構成、feature-spec.mdのインタビュー手順など）は他commandで再利用されないため、commandに残す。

#### implement.md の概念構造

```
Phase 0: invoke check-past-learnings (role: implementation)
Phase 1: Planning
  - Read Design Doc
  - Dispatch Scout agent
  - Break into ~500-line steps
  - Dependency analysis + parallelization evaluation
  - Include Final Review as last task
  PAUSE: present plan for human approval
Phase 2: per task
  - invoke tdd-cycle
  - Verify (typecheck, lint, test, build)  ← implement固有、commandに残す
  - Auto-review checklist                   ← implement固有、commandに残す
  - Record to progress.md
Phase 3: invoke parallel-review-team (type: code-review)
  - Record to progress.md
  - Touch final-review marker
```

Planning手順（Phase 1）はimplement固有だが、plan.mdとの重複がある。今回のスコープでは手をつけず、将来的にplanning skillへの抽出を検討する（Open Question 3参照）。

#### design.md の概念構造

```
Phase 0: invoke check-past-learnings (role: design)
Phase 1: Research (Parallel Research Team)
  - Dispatch 4 agents  ← design固有の構成、commandに残す
  - Synthesis
  - Record to progress.md
Phase 2: Create Outline
Phase 3: Internal Outline Review  ← design固有、commandに残す
Phase 4: Write Full Design Doc
  - Record to progress.md
Phase 5: invoke parallel-review-team (type: document-review)
Phase 6: Present for human approval
  PAUSE: human approves or requests changes
```

#### feature-spec.md の概念構造

```
Phase 0: invoke check-past-learnings (role: requirements)
Phase 1: Free Form — listen, categorize, summarize
  PAUSE: confirm summary
Phase 2: Gap-Filling — contextual questions  ← feature-spec固有
  PAUSE: confirm readiness to draft
Phase 3: Draft — write FeatureSpec
Phase 4: invoke parallel-review-team (type: spec-review)
Phase 5: Present and iterate
  PAUSE: human approves
Phase 6: Suggest next phase
```

#### debug.md の概念構造

```
Phase 0: invoke check-past-learnings (role: investigation)
Phase 1-5: 既存構造を維持（現状でも比較的薄い）
```

---

### Hook層の変更

#### check-skill-gate.ts — 段階的廃止

Rule層導入後、code-quality-rulesとdocument-quality-rulesのinvoke強制は本来不要になる。

- **Step 3完了直後**: blockをwarnに格下げ（permissionDecision: denyではなくadditionalContextで通知）。Rule層が期待通り機能しているか観察する
- **安定確認後**: hook廃止

#### stop-verification-gate.ts — warn格下げ

2つのblockがある:

**verification-before-completion未invoke**: Rules層にverification.mdが入ればinvokeの概念自体がなくなる。ただし「検証コマンドを実際に実行したか」の確認はマーカーでは判定できないため、当面はwarnに格下げして運用する。

**implement final-review未完了**: commandのワークフロー完了確認であり、Rule層とは無関係。commandが薄くなりskill呼び出しが明確になれば、スキップされにくくなるため、warnに格下げして様子を見る。

#### その他のhook — 変更なし

- phase-detect.ts: getting-started廃止後、Phase DetectionのSingle Source of Truthに昇格。変更なし
- mark-skill-invoked.ts: skill invocationトラッキングは統計・デバッグ用途で有用。変更なし
- session-start.ts: getting-started inject廃止、状態通知のみに変更（Step 4で実施）
- pre-compact.ts: 変更なし
- context-pressure-check.ts: 変更なし

---

### Agent層の変更

Agent層は「誰がやるか」を定義する。agent定義ファイル（`agents/*.md`）のfrontmatterでtools, model, maxTurns, skillsを指定し、本文で役割を記述する。

現在の4 agentのfrontmatterでは `skills:` フィールドでcode-quality-rulesやverification-before-completionを参照している:

```yaml
# implementer.md
skills:
  - code-quality-rules
  - verification-before-completion

# reviewer.md
skills:
  - code-quality-rules
```

Rule層導入後、これらのskillは廃止される。agentのfrontmatterから `skills:` の参照を削除する必要がある。

Ruleは親コンテキスト（CLAUDE.md @import）経由で常時適用されるため、agentが個別にskillを読み込む必要がなくなる。これによりagent定義はよりシンプルになる:

| Agent | 現在のskills参照 | 変更後 |
|-------|-----------------|--------|
| implementer | code-quality-rules, verification-before-completion | 削除（Ruleで常時適用） |
| reviewer | code-quality-rules | 削除（Ruleで常時適用） |
| researcher | なし | 変更なし |
| scout | なし | 変更なし |

agent定義の本文（役割説明）は変更不要。agentの責務は「何ができるか」（tools）と「どう振る舞うか」（役割説明）の定義であり、ルールの記述ではない。

---

### 新旧マッピング

```
現在                                → 新構造
────────────────────────────────────────────────────────────
[存在しない]                         → rules/code-quality.md
[存在しない]                         → rules/document-quality.md
[存在しない]                         → rules/design-doc-format.md
[存在しない]                         → rules/verification.md

skills/code-quality-rules/           → 廃止（→ rules/ + tdd-cycle + rule-evolution）
skills/document-quality-rules/       → 廃止（→ rules/ + rule-evolution）
skills/verification-before-completion/ → 廃止（→ rules/verification.md）
skills/design-doc-format/            → 廃止（→ rules/design-doc-format.md）
skills/getting-started/              → 廃止（→ 各レイヤーに分散）
[4 commandにコピペ]                   → skills/check-past-learnings/（新設）
[3 commandにコピペ]                   → skills/parallel-review-team/（新設）
[implement.md内]                     → skills/tdd-cycle/（新設）
[2 skill内]                          → skills/rule-evolution/（新設）

commands/implement.md                → 薄化（skill呼び出しに置換）
commands/design.md                   → 薄化（skill呼び出しに置換）
commands/feature-spec.md             → 薄化（skill呼び出しに置換）
commands/debug.md                    → Phase 0統合のみ

hooks/check-skill-gate.ts           → warn格下げ → 将来廃止
hooks/stop-verification-gate.ts     → warn格下げ
hooks/session-start.ts              → getting-started inject廃止
```

## Alternatives Considered

### 案1: ECCの構造をそのまま採用

rules/common/ + rules/[lang]/ の階層構造、agent frontmatter table、50+ skillsの大規模ライブラリ。

不採用理由: ECCは「多プロジェクト・多言語で再利用するツールキット」に最適化されている。Praxisの目的は「1つのプロジェクトで理解を深める」ことであり、この規模の構造は過剰。言語別ルール分割もTypeScript中心の現状では不要。学ぶべきは「分離原則」であり、具体的な構造ではない。

### 案2: Rule層を新設せず、hookでの強制をさらに強化

check-skill-gateを全ツール操作に拡大し、skillのinvokeを完全に強制する。

不採用理由: hookで「ルールのinvokeを強制」し、skillが「ルール内容を保持」し、commandが「ルールのinvokeを宣言」する三重構造こそが現在の問題の原因。この方向に進むと複雑さが増すだけ。ルールはルール層に置いて常時適用するのが単純で堅牢。

### 案3: 全commandの中身をskillに移して完全にフラット化

commandを完全にskill呼び出しのリストにし、固有手順もすべてskillに抽出する。

不採用理由: design.mdのResearch Team構成やfeature-spec.mdのインタビュー手順は他commandで再利用されない。無理に抽出すると「1箇所からしか呼ばれないskill」が増え、間接参照のコストが追跡のメリットを上回る。共通パターンだけを抽出するのが実用的。

## Migration Plan

一度に全部変更するとデグレードリスクが高い。各ステップは独立して確認可能。

### Step 1: check-past-learnings skill新設

4 commandのPhase 0を1つのskillに集約する。

- **変更**: 4 commandファイル + 1 新規skill
- **リスク**: 低（コピペの集約。動作は同一）
- **検証**: 各commandを実行し、Past Learnings recallが従来通り動作すること

### Step 2: parallel-review-team skill新設

3 commandのレビュー手順を1つのskillに集約する。

- **変更**: 3 commandファイル + 1 新規skill
- **リスク**: 低（レビュー手順の集約。構成テンプレートはskillが保持）
- **検証**: /implement, /design, /feature-specでレビューが従来通り実行されること

### Step 3: Rule層新設 + skill廃止

ruleファイルを新設し、対応するskillを廃止する。tdd-cycleとrule-evolutionを新設する。

- **変更**: 4 新規rule + 5 skill廃止 + 2 新規skill + check-skill-gate warn格下げ
- **リスク**: 中（Rule層の常時適用が機能するか要確認）
- **検証**: ruleがinvoke無しで適用されること。check-skill-gateのwarnが発生しないこと（= ruleが効いている）

### Step 4: getting-started分解

getting-startedを廃止し、内容を各レイヤーに分散する。session-start.tsの出力を変更する。

- **変更**: getting-started廃止 + session-start.ts変更 + CLAUDE.md更新
- **リスク**: 中（セッション開始時の動作が変わる）
- **検証**: 新規セッション開始時に必要な情報が提供されること

### Step 5: Command薄化

commandからインライン手順を削除し、skill呼び出しに置換する。

- **変更**: implement.md, design.md, feature-spec.md, debug.md
- **リスク**: 低（Step 1-4完了が前提。参照先変更のみ）
- **検証**: 各commandのend-to-end実行

### Step 6: Hook整理

stop-verification-gate.tsをwarnに格下げする。check-skill-gate.tsの廃止を検討する。

- **変更**: 2 hookファイル
- **リスク**: 低（warnへの格下げのみ）
- **検証**: 誤検知がないことを観察。安定したら廃止検討

## Open Questions

1. **CLAUDE.md @importの配置場所**: Rule層のファイルを `@rules/code-quality.md` でimportするとき、プラグインのCLAUDE.md（プラグインインストール時に自動適用）に書くか、プロジェクトのCLAUDE.mdに書くか。前者はプラグインユーザー全員に適用されるが、プロジェクト固有ルールの追加が難しくなる。後者はプロジェクトごとのカスタマイズが容易だが、手動設定が必要。ハイブリッド（プラグインCLAUDE.mdに共通ルール、プロジェクトCLAUDE.mdに固有ルール）が現実的か

2. **check-skill-gateの最終的な処分**: Rule層が安定した後、このhookを完全廃止するか軽量warnとして残すか。「ベルトとサスペンダー」として残す価値があるかどうか

3. **Planning手順のskill化**: implement.md Phase 1とplan.mdに重複がある。今回のスコープ外だが、将来的にplanning skillに抽出する価値があるか

4. **~/.claude/RULES.mdとPRINCIPLES.mdの処分**: これらはSuperClaudeフレームワークの一部だが、内容の多くがPraxisのrule層と重複する。Praxisユーザーにとって、これらを削除してrule層に統合するのが理想だが、SuperClaudeとの依存関係を考慮する必要がある
