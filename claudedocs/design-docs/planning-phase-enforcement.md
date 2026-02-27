# Planning Phase の確実な実行

## Overview

`/implement` の Planning phase がスキップされると Final Review が TodoWrite に含まれず、実装完了後のレビューが構造的に発生しない。

## Context and Scope

### Background

`/implement` は 3 つの Phase で構成される: Planning（計画）→ Execution（実装）→ Final Review（並列レビュー）。Planning phase の step 8 は「Final Review を計画の最後のタスクに入れる」と指示している。しかし Planning 自体がスキップされると、この指示も実行されない。

### Failure Case

ユーザーが「Phase 1 の実装をお願いします」と依頼した際、Claude は Design Doc のタスク構成を「計画済み」と解釈し、implement.md の Planning phase を飛ばして直接実装を開始した。TodoWrite リストに Final Review が含まれず、全タスク完了後もレビューに進まなかった。ユーザーが手動で「コードレビューをして」と指示して初めてレビューが実行されたが、4 並列 reviewer dispatch ではなくセルフレビューにフォールバックした。

### Attempted Solutions

4 コミット（`ba36e65`〜`de03d7d`）にわたり multi-agent workflow を実装し、テキスト指示の強化（step 8 追加、「Do NOT self-review with a checklist」追記）を試みたが、Planning スキップという根本原因には対処できていない。

## Goals / Non-Goals

### Goals

- Planning がスキップされた場合に、Final Review が欠落することを防止する
- 既存の implement.md ワークフローとの後方互換性を維持する
- Planning を main session 内で実行する設計を維持する（agent 分離しない）

### Non-Goals

- Planning の品質向上（計画の内容が良いかどうかは対象外）
- `/implement` 以外のコマンドへの Planning enforcement 追加
- Final Review の実行方法の強制（parallel review team vs セルフレビュー）— dispatch 指示の問題であり、Planning enforcement とは別の課題
- TodoWrite の内容を外部から検証する汎用的な仕組みの構築

## Proposal

Planning がスキップされる構造的原因は 2 つある:

1. Planning が Claude の内部思考として完結し、外から観察可能なアクション（observable action）を伴わない
2. Planning の出力（Final Review を含むタスクリスト）が Execution の入力要件として定義されていない

この 2 つを解消するために、Stop hook による機械的ゲート（主軸）と implement.md の構造改善（補助）を行う。

### 主軸: Stop hook による Final Review ゲート

既存の `stop-verification-gate.ts` を拡張し、`/implement` ワークフロー中に Final Review の完了を機械的に検証する。

**ワークフロー判定**: `/implement` は Skill tool 経由で呼び出されるため、PostToolUse hook（`mark-skill-invoked.ts`）が自動的にマーカーファイルに `implement` を記録する。Stop hook は `hasSkill(markerDir, sessionId, "implement")` で `/implement` ワークフロー中かどうかを判定する。既存のインフラをそのまま利用でき、新規の判定機構は不要。

**検証条件**: implement.md Phase 3 の末尾で Final Review 完了マーカー（`{sessionId}-implement-final-review`）を touch する指示を追加する。Stop hook は以下の条件を検証する:

```
if hasSkill("implement") AND NOT markerExists("{sessionId}-implement-final-review"):
  → block: "/implement workflow detected but Final Review has not been completed.
     Complete Phase 3 (Final Review with Parallel Review Team) before ending."
```

**Alternative 3（PreToolUse marker）との違い**: Alternative 3 は Planning 完了時にマーカーを書く設計で、「Planning をスキップする Claude はマーカーも書かない」ため機能しない。本提案のマーカーは Phase 3（Final Review）の完了時に書く。Planning スキップ → Final Review が計画に入らない → Phase 3 が実行されない → マーカーが書かれない → Stop hook がブロック、という因果連鎖で検出する。

**検証タイミング**: Stop hook 発火時（Claude が停止しようとした時点）に、マーカーファイルの存在を `fs.existsSync()` で確認する。transcript の解析は不要。既存の verification gate（`code-session` マーカー → `verification-before-completion` skill 確認）と同じパターン。

### 補助: implement.md の構造改善

以下の 2 つのテキストレベルの改善を行う。Stop hook が発火する前に Planning スキップを防ぐための補助策であり、スキップされる可能性がある。

**因果的依存の記述**: Phase 2（Execution）の冒頭に前提条件チェックを追加する:

> Before executing any task, verify that the plan includes "Final Review (Parallel Review Team)" as the last task. If it does not, return to Phase 1 and complete planning before proceeding.

**Design Doc と実装計画の違いの明記**: Planning phase 冒頭に、Design Doc の構成と実装計画が異なることを明記する:

> Planning creates an implementation-specific plan distinct from the Design Doc's phase/task structure. Even if the Design Doc already defines phases and tasks, this planning step is required because:
> - The Design Doc defines WHAT to build. The implementation plan defines HOW (file paths, test ordering, verification steps)
> - Final Review must be an explicit task in every plan — the Design Doc does not include this
> - The plan must be presented to the human for approval before execution begins

learnings-design.md の学びを適用している: テンプレートの空欄埋め（compliance handshake）ではなく、上流の出力データを下流の必須入力にする因果的依存構造。ただし implement.md 内の記述である以上、テキスト指示の域を出ない。

## Alternatives Considered

### Alternative: Planner agent dispatch

Planning を専用の Planner agent に委譲する。Planner の出力フォーマットに Final Review を強制することで、構造的にスキップを防止する。

| Aspect | Detail |
|--------|--------|
| How it works | Task tool で Planner agent を dispatch。Planner が Design Doc + Scout 結果を読み、Final Review を含む計画を返す |
| Why Proposal is preferred over this | collaborative-multi-agent-workflows Design Doc で分析済み: Planning は Design Doc + Scout + Learnings の統合判断であり、単一コンテキストでの推論が最適。agent に分離すると main session が計画の推論過程を失い、実装中の判断に支障が出る。また、Planning と Execution は独立した検証ソースを持たないため、agent 分離の構造的根拠が弱い |
| When to reconsider | Planning の複雑さが増し、main session のコンテキストを圧迫するようになった場合。または Planning 品質の問題が顕在化した場合（現在の問題はスキップであって品質ではない） |

### Alternative: テキスト指示の強化のみ

implement.md の Planning 指示をより詳細にし、「スキップ不可」「Final Review 必須」と繰り返す。

| Aspect | Detail |
|--------|--------|
| How it works | implement.md の Planning phase に警告文を追加 |
| Why Proposal is preferred over this | 現在の問題がまさにテキスト指示のスキップ。同じ手段（テキスト）で同じ問題（スキップ）を解決しようとしている。提案の implement.md 改善（補助策）もテキスト指示だが、Stop hook による機械的ゲートと組み合わせることで defense in depth を構成する |
| When to reconsider | Claude Code のモデルがテキスト指示の遵守率を大幅に改善した場合 |

### Alternative: PreToolUse hook で planning marker を検証

Planning 完了時にマーカーファイルを書き出し、Edit/Write の PreToolUse hook でマーカーの存在を確認。なければ実装をブロック。

| Aspect | Detail |
|--------|--------|
| How it works | Planning 完了時に `/tmp/claude-praxis-markers/{sessionId}-planning-complete` を作成。PreToolUse hook がこのマーカーを検証 |
| Why Proposal is preferred over this | マーカーを書く行為自体がテキスト指示に依存する。Planning をスキップする Claude はマーカー書き出しもスキップする。check-skill-gate のように PostToolUse hook で自動記録される Skill invocation とは異なり、Planning にはそのような自動記録ポイントがない。提案の Final Review マーカーもテキスト指示に依存するが、マーカー不在を Stop hook で検出するため、Phase 3 全体のスキップを捕捉できる |
| When to reconsider | Planning に対応する Skill invocation を新設し、PostToolUse hook で自動記録できるようになった場合 |

## Concerns

| Concern | Mitigation |
|---------|------------|
| Final Review マーカーもテキスト指示に依存する（Phase 3 末尾の touch 指示がスキップされる可能性） | Phase 3 末尾の touch を Phase 3 の他の指示（reviewer dispatch, findings 適用, completion report）と一体で記述する。Phase 3 が実行されれば touch もされる蓋然性が高い。Phase 3 が実行されたのに touch だけがスキップされるケースは、Phase 3 自体がスキップされるケースより発生確率が低い |
| 小規模タスク（1-2 ファイル修正）で Planning がオーバーヘッドになる | implement.md に簡略化基準を追加: 単一ファイル修正で cross-module 影響がない場合は計画を簡略化できるが、Final Review タスクは常に必須 |
| `/implement` 以外のフロー（直接的な実装依頼）では hook が発火しない | 既存の phase-detect hook が `/implement` を検出・提案する。直接依頼でも「/implement を使いますか？」と提案される |

## Review Checklist

- [ ] implement.md の変更が既存ワークフローと後方互換か
- [ ] Stop hook の拡張が既存の verification gate と共存するか
- [ ] Final Review マーカーの touch 指示が Phase 3 に自然に統合されているか
- [ ] 小規模タスクでの Planning オーバーヘッドが許容範囲か
- [ ] `/implement` 以外のフローへの影響がないか
