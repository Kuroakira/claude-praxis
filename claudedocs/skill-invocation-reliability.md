# スキル呼び出しの信頼性向上

## Overview

claude-praxisのスキル呼び出し（Phase Detection、code-quality-rules gate、verification-before-completion gate）が実際のセッションでスキップされる問題を解決する。現状、これらのルールはテキスト指示のみで強制力がなく、MCPエラーやタスクの具体性といった要因でバイパスされる。テキスト指示の強化と機械的なゲートの組み合わせにより、構造的にスキップしにくい仕組みを構築する。

## Context and Scope

### 発生した事象

darius/frontendプロジェクトで「PR5を実装しましょう」と依頼した際、以下のCRITICALルールがすべてスキップされた：

1. **Phase Detection** — `/praxis:implement` の提案なし
2. **Skill Check** — `code-quality-rules` の呼び出しなし
3. **TDD** — テストを書く前にプロダクションコードを編集

ユーザーが手動で「TDDの原則上まずはテストコードから」と指摘するまで、ルール違反に気づかなかった。

### 根本原因分析

| 原因 | 重要度 | 説明 |
|------|--------|------|
| 機械的な強制力の欠如 | 最重要 | ルールはテキスト指示のみ。モデルの自己規律に完全依存 |
| MCP障害による注意の逸れ | 高 | Serena language serverエラーの復旧にリソースが消費され、プロセスゲートを通り越した |
| 指示量の希釈 | 高 | ~65KB / 1,342行の指示。スキル呼び出しルールはその約3%（40行） |
| 7箇所の重複 | 中 | 同じルールが7箇所に書かれ、「努力目標」感が増す |
| タスクの具体性 | 中 | 明確な実装依頼ほど「すぐやろう」となり、メタプロセスを飛ばしやすい |

## Goals / Non-Goals

### Goals

- ファイル編集前に `code-quality-rules` が呼ばれていなければ機械的にブロックする
- Phase Detectionのスキップ率を構造的に下げる
- 指示の総量を30%削減し、CRITICALルールの相対的重みを上げる
- スキル呼び出しルールの重複を1箇所に集約する

### Non-Goals

- 100%のスキップ防止（LLMの性質上、テキスト指示の完全遵守は保証不可）
- 新しいスキルの追加や既存スキルの内容変更
- MCP障害の根本修正（Serena language serverの問題はスコープ外）

## Proposal

5つの施策を組み合わせ、「テキスト指示の改善」と「機械的ゲート」の両面から対処する。

### 施策1: PreToolUse Hook — コード編集前のスキルチェック

最もインパクトの高い施策。`PreToolUse` hookで `Edit|Write` をmatchし、セッションのtranscriptに `code-quality-rules` のSkill呼び出し記録がなければ `deny` する。

**仕組み**:

```
モデルがEdit/Writeを呼び出す
    ↓
PreToolUse hook発火
    ↓
transcript JSONLをgrepし、code-quality-rulesのSkill呼び出しを検索
    ↓
見つからない → deny + 理由メッセージ
見つかった → exit 0（許可）
```

**設計判断: なぜtranscript grepなのか**

- 環境変数やtempファイルでフラグを立てる案も検討したが、PostToolUse hookとの連携が必要で複雑になる
- transcriptはClaude Codeが自動的に記録するため、追加のフック不要
- `jq`でJSONLをパースし、Skill toolの呼び出しを確認するだけでシンプル
- 懸念: transcriptが大きくなるとgrepが遅くなる可能性 → `grep -m 1`で最初のマッチで停止すれば十分

**受け入れるトレードオフ**:

- claude-praxis以外のプロジェクトでの軽微な編集でもブロックされる → plugin scopeのhookなので、claude-praxisプラグインが有効なプロジェクトのみで発動
- 初回のEdit/Writeで必ず1回denyされるオーバーヘッド → モデルに「まずスキルを呼べ」と伝わるので、むしろ教育効果がある

### 施策2: implement.md の auto-invocable化

`disable-model-invocation: true` を `false` に変更する。

**現状の問題**: Phase Detectionでモデルが `/praxis:implement` を提案しても、ユーザーが手動でコマンドを打つまでスキルチェーンが走らない。モデルが提案自体をスキップすると、スキルチェーン全体が走らない。

**変更後の流れ**:

```
モデルがPhase Detection → /praxis:implement を自ら呼び出し可能
    ↓
implement.md内部でcode-quality-rules + verification-before-completionを呼ぶ
    ↓
Phase 1でプランを提示し、人間の承認を待つ（既存の承認ゲートは維持）
```

**設計判断: 全commandを auto-invocable にするか**

- `/praxis:implement` と `/praxis:debug` のみを auto-invocable にする（最頻出で、スキップされた場合のダメージが大きい）
- `/praxis:design` はDesign Doc作成という重い判断を含むため、ユーザー主導を維持
- `/praxis:compound` はセッション終了時のreflectionなので、ユーザー主導を維持
- `/praxis:research`, `/praxis:plan`, `/praxis:review` は supporting commands として現状維持

### 施策3: First Response Gate の追加

`getting-started/SKILL.md` の冒頭に、モデルの最初のアクション前に完了すべきチェックリストを追加する。

**現状の問題**: スキルチェックのルールは getting-started 内に存在するが、散文的で「最初のtool call前に」という制約が埋もれている。

**変更内容**: 冒頭に視覚的に目立つゲートセクションを追加。「最初のtool callがRead/Grep/Edit/Bashで、このチェックリストを完了していなければルール違反」と明示する。

**設計判断**: チェックリスト形式にする理由は、散文よりも構造化された指示の方がLLMの遵守率が高いという実践的知見に基づく。

### 施策4: 指示量の削減

~65KB → ~45KB（30%削減）を目標に、以下を統合する。

| 対象 | 現状 | 変更 | 削減見込み |
|------|------|------|-----------|
| MODE_*.md（5ファイル, 306行） | 各ファイルで詳細な説明 | 1ファイルに統合、各モード1-2行のサマリー | ~9,000 bytes |
| MCP_*.md（6ファイル, 183行） | 各ファイルで詳細な説明 | 1ファイルに統合、各サーバー1-2行のサマリー | ~6,000 bytes |
| FLAGS.md（120行） | 全フラグの詳細定義 | 実際に使用されているフラグのみ残す | ~3,000 bytes |
| RULES.md重複箇所 | Phase Detection等が完全に記述 | getting-startedへの参照のみ | ~2,000 bytes |

**設計判断: なぜ削除ではなく統合なのか**

- MODE/MCPの情報自体は有用。問題は量であり存在ではない
- 統合後のファイルは「クイックリファレンス」として機能する
- 詳細が必要な場合はContext7や公式ドキュメントを参照すればよい

**受け入れるトレードオフ**: 個別のMODE/MCPファイルの詳細度が下がる。ただし、これらの詳細が実際のセッションで参照される頻度は低く、CRITICALルールの相対的重みを上げる方が価値が高い。

### 施策5: スキル呼び出しルールの重複排除

7箇所の重複を1箇所（getting-started/SKILL.md）に集約する。

**現在の重複箇所**:

1. `RULES.md` — Workflow Rules: Skill Check（行20-22）
2. `RULES.md` — Phase Detection セクション（行48-58）
3. `RULES.md` — Implementation Prerequisite セクション（行60-69）
4. `RULES.md` — Quick Reference: CRITICAL summary（行279-288）
5. `getting-started/SKILL.md` — Mandatory Skill Invocation（行12-31）
6. `getting-started/SKILL.md` — Phase Detection & Suggestion（行73-104）
7. `getting-started/SKILL.md` — Session Start Checklist, implementation gate（行187-191）

**変更後**:

- `getting-started/SKILL.md` を **Single Source of Truth** とする（箇所5, 6, 7を維持）
- `RULES.md` の箇所1, 2, 3を1行の参照に置換: 「スキル呼び出しルールは getting-started skill で定義。🔴 CRITICALゲート」
- `RULES.md` Quick Reference（箇所4）は残す（サマリーとしての役割が異なるため）

**設計判断: なぜ完全に1箇所にしないのか**

- RULES.md Quick Referenceは「一覧性」の機能がある。getting-startedの詳細ルールへの入口として残す価値がある
- ただし詳細な記述は排除し、「何が CRITICALか」のリストのみにする

## Alternatives Considered

### Alternative: UserPromptSubmit hookで毎回リマインド

ユーザーがプロンプトを送信するたびに、additionalContextとして「Phase Detectionとスキルチェックを忘れていませんか？」を注入する案。

| Aspect | Detail |
|--------|--------|
| How it works | `UserPromptSubmit` hookが毎回発火し、リマインドコンテキストを追加 |
| Why Proposal is preferred | 毎回のリマインドはノイズになり、重要なコンテキストを押し出す。PreToolUseの方がピンポイントでブロックできる |
| When to reconsider | PreToolUse hookだけではPhase Detection自体のスキップを防げない場合 |

### Alternative: Stop hookで完了前チェック

モデルが応答を終了する前に、スキルが呼ばれたかチェックするStop hook。

| Aspect | Detail |
|--------|--------|
| How it works | `Stop` hookでtranscriptを解析し、コード編集があったのにスキルが呼ばれていなければ `block` |
| Why Proposal is preferred | 事後チェックより事前ブロック（PreToolUse）の方が、ルール違反したコードが書かれること自体を防げる |
| When to reconsider | PreToolUse hookのdenyメッセージだけではモデルが学習せず、同じターンで何度もdenyされる場合 |

### Alternative: 指示量を削減せず、CRITICALルールの書式を変更

MODE/MCPファイルはそのまま維持し、CRITICALルールだけ特別な書式（例: XML-likeタグ、大文字ブロック）で強調する案。

| Aspect | Detail |
|--------|--------|
| How it works | `<CRITICAL_GATE>` タグ等でルールをラップし、視覚的に目立たせる |
| Why Proposal is preferred | LLMは「量」に対して注意が分散する。書式の強調だけでは根本的な希釈問題は解決しない。量を減らす方が効果的 |
| When to reconsider | 統合後のサマリーだけでは情報が不足し、モデルの行動品質が下がった場合 |

## Concerns

| 懸念 | 対応方針 |
|------|---------|
| PreToolUse hookがtranscript grepで遅くならないか | `grep -m 1` で最初のマッチで停止。長いセッションでも実用的な速度を維持する見込み。実測で問題があれば `tail -c 50000` で末尾のみ検索に変更 |
| auto-invocable化でモデルが不要な場面で `/praxis:implement` を呼ぶリスク | implement.md Phase 1で人間承認ゲートがあるため、不要なら却下可能。実運用で頻度を観察 |
| 指示統合で情報が失われるリスク | 統合後も各MODE/MCPの核心（トリガー条件、主要ユースケース）は残す。詳細はContext7や公式ドキュメントで補完 |
| transcript内のSkill呼び出しパターンが変わるリスク | Claude Codeのバージョンアップでtranscript形式が変わる可能性。hookのgrep patternを定期的に検証する運用ルールを追加 |

## Review Checklist

- [ ] 施策1: PreToolUse hookスクリプトが正しくtranscriptを読めるか実機検証
- [ ] 施策2: auto-invocable化後、モデルがPhase Detectionで自然に `/praxis:implement` を呼ぶか検証
- [ ] 施策3: First Response Gateの文面がセッション開始時に実際に参照されるか検証
- [ ] 施策4: 統合後の指示で、MCPサーバーの適切な使い分けが維持されるか検証
- [ ] 施策5: 重複排除後、getting-startedが注入されないセッションでルール認知が下がらないか検証
