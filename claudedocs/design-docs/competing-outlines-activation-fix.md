# Competing Outlines 発動失敗の修正

## Overview

実装プラン作成時に competing outlines（複数の設計方針を構造的に比較する手続き）および strategy exploration プロトコル（並列エージェントによる方向性の探索・比較・選定手続き）が発動しない問題を修正する。

この問題には2つの独立した障害クラスタが存在する。**クラスタA**（障害1-2）: Phase detection の分類ミスと advisory の構造的限界により、Claude がそもそもワークフローに入らない。**クラスタB**（障害3-5）: ワークフローに入っても、workflow-planner SKILL.md の仕様ギャップにより competing outlines が発動しない。

本設計は主にクラスタBを修正する — Axes Table 生成責務・トリガー評価マッピング・competing outlines fallback を planner に追加し、因果的依存チェーンを完成させる（Design Decision（以下 DD）1-3）。クラスタAについては低コストの改善（DD4-5: pattern 改善 + advisory メッセージ強化）を行うが、advisory の構造的制約（Claude が無視する可能性）は解決しない。ユーザーの当初の問題（Claude がワークフローに入らなかった）に対しては、DD4-5 の寄与は限定的であり、完全な解決には enforcement メカニズムの検討が必要だが、それは本設計の対象外とする。

## Context and Scope

### 問題の発見経緯

ユーザーが「Design Doc に従って実装プランのドキュメントを作成して」とリクエストした際、claude-praxis のワークフロー（`/implement` の Phase 1 または `/plan`）が呼び出されず、Claude が直接プラン作成に着手した。その結果、Implementation Axes Table の列挙も competing plan outlines の比較も行われなかった。

### 現行アーキテクチャの構造

claude-praxis のワークフローは planner-driven adaptive workflow を採用している。コマンド（`/design`, `/implement`）はフェーズ順序と判断ポイント（例: Axes Table（設計判断を構造化したテーブル）に基づいて competing outlines を作成するか判断する）を定義し、workflow-planner スキルはエージェント選定・レビュー階層・実行計画の生成で判断を提供する。

Phase detection hook はユーザーの入力テキストから適切なコマンドを推定し、advisory（助言）として Claude のコンテキストに注入する。これは `additionalContext`（助言情報）であり、enforcement（強制ゲート）ではない。

### 障害構造: 2つの独立したクラスタ

この問題には5つの障害が関与するが、これらは**1本の連鎖**ではなく**2つの独立したクラスタ**である。クラスタAはワークフローへの到達を阻害し、クラスタBはワークフロー内部の不具合である。両者は独立に発生し、独立に修正可能。

**クラスタA: ワークフローに入らない（障害1-2）**

ユーザーの当初の問題はここに属する。Claude がワークフローを経由せず直接作業を開始した。

- **障害1: Phase detection が意図と異なるフェーズを検出** — `phase-detect.ts` の regex は first-match-wins（先にマッチした方が勝つ）順序で判定する。「Design Doc に従って実装プラン」に対し、`/\bdesign\s+doc/i` が `/実装/` より先にマッチし、`Phase detected: design` を返す。ユーザーの意図は「Design Doc を参照して実装プランを作る」だが、検出結果は「Design Doc を作る」
- **障害2: Advisory の構造的限界** — 障害1で分類が正しくても、Hook の出力は advisory（`additionalContext`）であり、enforcement（`decision: "block"`）ではない。Claude は実行プレッシャーの下でこの助言を無視し、直接作業を開始できる。分類精度の向上が行動変化に直結しない構造的制約

**クラスタB: ワークフロー内で competing outlines が発動しない（障害3-5）**

仮にクラスタAが解消されて正しいワークフローに入っても、以下のギャップにより competing outlines は発動しない。これは潜在的バグであり、修正されなければ今後もワークフロー利用時に同じ問題が再発する。

- **障害3: workflow-planner SKILL.md に Axes Table 生成責務が未定義** — `/design` の Synthesis Rules と `/implement` の Phase 1 Step 1 は Axes Table を MANDATORY として要求しているが、planner SKILL.md の Step 1 には具体的な生成手続きが存在しない。因果的依存の上流データが生成されないため、下流の判断ポイントに到達できない
- **障害4: Axes Table verdict（各軸の判定結果: Clear winner / Requires exploration）からトリガー評価へのマッピングが欠落** — 「Axes Table に "Requires exploration" があり、Strategy Exploration が発動しない場合、competing outlines を作成する」という判断ポイントをコマンドが定義しているが、planner SKILL.md にはこの判断を実行する決定木が存在しない
- **障害5: Competing outlines fallback が planner に未定義** — Strategy Exploration Protocol（P1-P6）は発動条件を満たした場合の手続きを定義しているが、「不発動で "Requires exploration" が残る場合」のフォールバックは planner 側に記述がない。コマンド側の記述のみで、planner が責務を認識していない

### 本設計の対象範囲と限界

本設計の DD1-DD3 はクラスタB（planner 内部の仕様ギャップ）を修正する。これにより、ワークフローに入った場合に competing outlines が正しく発動するようになる。

DD4-DD5 はクラスタA（ワークフローへの到達阻害）に対する低コスト改善だが、advisory の構造的制約は残る。ユーザーの当初の問題（Claude がワークフローに入らなかった）を完全に解決するには、enforcement メカニズムの検討が必要だが、それは影響範囲が大きく別設計の判断を要する。

- **直接影響**: `/design` の Phase 1-2（Design Axes Table → competing outlines）、`/implement` の Phase 1（Implementation Axes Table → competing plan outlines）
- **間接影響**: Phase detection は全ユーザープロンプトに影響するが、advisory のため実害は限定的

## Goals / Non-Goals

### Goals

- workflow-planner SKILL.md に Axes Table 生成責務を明示し、因果的依存チェーンを完成させる
- planner SKILL.md に Axes Table verdict → Strategy Exploration トリガー評価の決定木を追加する
- planner SKILL.md に competing outlines fallback の手続きを追加する
- Phase detection の pattern を改善し、意図の曖昧性を軽減する
- Advisory メッセージに「なぜこのコマンドか」の説明を追加する

### Non-Goals

- **Competing outlines の共有 Skill 抽出** — `competing-strategy-exploration.md` の Alternative C で却下済み。再検討条件（3つ以上のコマンドで使用）は未到達。`/design` と `/implement` の competing outlines は対象が構造的に異なる（アウトライン構造 vs タスク分割）ため、パラメータ化された共有 Skill は premature abstraction のリスクが高い
- **`/plan` コマンドの大幅強化** — `/plan` は「Supporting Command」として意図的に軽量に設計されている。`/implement` Phase 1 が既にフル計画ワークフローを提供しており、`/plan` を同等にすると機能的重複が発生する
- **LLM ベースの phase detection** — 1-3s の latency、非決定性、API 依存を導入する。Phase detection は advisory のみであり、分類精度の向上が行動変化に直結しない
- **Enforcement メカニズムの変更（advisory → gate）** — advisory から gate への変更は影響範囲が大きく、別設計の判断が必要

## Proposal

### Design Decision 1: workflow-planner に Axes Table 生成責務を明示する

workflow-planner SKILL.md の Step 1（Analyze Task Content）に Axes Table 生成を MANDATORY ステップとして追加する。

この判断には2つの理由がある。

第一に、因果的依存の原則（学び: 「因果的依存は compliance handshake ではなく quality improvement として設計する」、確認3回）に基づく。Axes Table を「セクションを埋めよ」（形式要件）ではなく「Step 4（Generate Execution Plan）の必須入力」（因果的依存）として設計する。Step 4 は Axes Table を消費して実行プランを生成するため、Axes Table を欠いた状態では質の高い実行プランを生成できない構造になる。ただし、これは SKILL.md のテキストレベルの指示であり、ランタイムで強制するメカニズムではない — Claude がステップ自体をスキップするリスクは残る（Concerns 参照）。

第二に、構造化出力フォーマットの原則（学び: 「構造化出力フォーマットは AI の裁量を制約する」、確認2回）に基づく。Axes Table は固定カラムのテーブルであり、各軸に対する verdict（Clear winner / Requires exploration）の明示を強制する。自由記述では「Requires exploration」に該当する軸を暗黙にスキップできるが、テーブルの空行は目に見える。

Axes Table の所有権について: Axes Table の**テーブル構造**（カラム定義、verdict の選択肢）はコマンド側（`/design`, `/implement`）が定義する。planner は**テーブルの生成責務**を負う — コマンドが定義した構造に従ってタスク分析結果を構造化データとして出力する。これはコマンドが「何を要求するか」を定義し、planner が「それを実行する」という既存の分離構造と整合する。

具体的な変更箇所:
- Step 1 に「Enumerate design/implementation axes（MANDATORY）」サブステップを追加
- Step 4 の `requires` フィールドに Axes Table を明記
- Step 7 の出力要件に Axes Table とその verdict を含める

再検討条件: Axes Table 生成が planner のコンテキスト消費を著しく増加させ、他のステップの品質に影響する場合。

### Design Decision 2: トリガー評価マッピングを planner に追加する

workflow-planner SKILL.md の Trigger Conditions セクションを拡張し、Axes Table verdict から Strategy Exploration トリガーへの決定木を追加する。

この判断の理由は、コマンド側（`/design`, `/implement`）が定義する「Axes Table に "Requires exploration" があれば competing outlines」という判断ポイントが、planner の手続きに接続されていないためである。コマンドは判断ポイントを定義するが、planner がその判断を実行する手続きがなければ、定義は実行されない。

決定木の構造:

1. Axes Table の全 verdict を確認
2. "Requires exploration" が存在し、かつ Strategy Exploration の3条件（2つ以上の妥当な候補、明確な優位性なし、設計判断レベルの差異）を満たす → Strategy Exploration Protocol を発動（並列エージェントによる重量級の方向性評価）
3. "Requires exploration" が存在するが、探索軸のスケールが小さく並列エージェント評価が過剰な場合 → Competing outlines fallback を発動（同一コンテキスト内での軽量なアウトライン比較、DD3 参照）
4. 全 verdict が "Clear winner" → 単一アウトライン/プランで進行

この決定木は Trigger Conditions セクションの補足として追加し、既存のトリガー条件（「2+ viable candidates, no clear winner, design-decision-level differences」）との関係を明示する。Axes Table は候補の構造化された列挙であり、Trigger Conditions の入力データとして機能する。

再検討条件: Axes Table 以外のトリガー入力（例: ユーザーの明示的なリクエスト）を追加する必要が生じた場合。

### Design Decision 3: Competing outlines fallback を planner に文書化する

workflow-planner SKILL.md の Strategy Exploration Protocol の後に、fallback 手続きを追加する。

この判断の理由は、Strategy Exploration Protocol（P1-P6）は「発動条件を満たした場合」の手続きを定義しているが、「発動条件を満たさないが "Requires exploration" が残る場合」の手続きが planner 側に存在しないためである。コマンド側（`/design` Phase 2, `/implement` Phase 1 Step 2）に「Competing Outlines (any axis "Requires exploration")」の記述があるが、planner がこの手続きを実行する責務を認識していない。

fallback 手続きの内容:

1. Axes Table から "Requires exploration" の軸を抽出
2. コマンドの domain に基づいて competing outlines の形式を決定（design → アウトライン比較、implement → プラン skeleton 比較）
3. 各 outline が探索軸の異なるポジションを取るように生成
4. 比較 → 選定 → 選定結果を downstream の必須入力にする

この fallback はコマンド側の既存記述と整合する。planner 側に手続きを追加することで、コマンドの意図と planner の実行が接続される。

なお、`/design` と `/implement` の competing outlines は対象が異なる（アウトライン構造 vs タスク分割）ため、この手続きは planner SKILL.md 内のドメインコンテキスト依存として記述する。共有 Skill への抽出は行わない（Non-Goals 参照）。

再検討条件: competing outlines の手続きが3つ以上のコマンドで使用されるようになり、planner 内のドメイン分岐が煩雑になった場合。

### Design Decision 4: Phase detection の pattern を改善する

`phase-detect.ts` の regex pattern を改善し、意図の曖昧性を軽減する。

この判断には2つの理由がある。

第一に、現行の first-match-wins 順序（debug → feature-spec → design → implement → ...）は、「Design Doc に従って実装プラン」のような複合的な表現で誤検出を引き起こす。`/\bdesign\s+doc/i` が `/実装/` より先にマッチし、参照（Design Doc に従って）を意図（実装プラン作成）と誤認する。

第二に、修正は低コストで達成可能である。Weighted scoring（重み付きスコアリング）は advisory-only のシステムに対して過剰な複雑性を導入する（Counter-research の知見）。Pattern 配列の順序変更と compound patterns（複合パターン）の追加で同等の改善が達成できる。

具体的な変更:
- `implement` の pattern を `design` より先にチェック（配列順序の変更）
- Compound patterns の追加: `design doc` + `実装|implement|プラン` → implement 優先
- Negative patterns: `設計.*作成|design.*create` → design（作成意図がある場合のみ design に分類）

advisory-only のため、誤検出の実害は限定的である。しかし、正しい phase 提案はClaude がワークフローを選択する際の判断材料になるため、低コストの改善は価値がある。

なお、pattern 順序の変更は新たな false positive を生む可能性がある（例: 「実装の設計 Design Doc を作成して」→ design 意図だが implement を検出）。実装時にはユーザーの典型的なメッセージパターンを網羅するテストケースを追加し、reorder の副作用を検証する必要がある。

再検討条件: Phase detection が enforcement（gate）に昇格し、分類精度がワークフロー品質に直接影響するようになった場合、weighted scoring または LLM fallback への移行を検討する。

### Design Decision 5: Advisory メッセージに理由を追加する

phase-detect の出力テンプレートに「なぜこのコマンドか」の説明を追加する。

現行の出力: `Phase detected: implement. Suggested command: /claude-praxis:implement`

提案する出力: `Phase detected: implement. Suggested command: /claude-praxis:implement — includes competing outlines, TDD workflow, and graduated review`

この判断の理由は、コマンド名だけでは Claude がそのコマンドの価値（competing outlines を含む、など）を判断できないためである。コマンドの主要機能を1行で説明することで、Claude が提案を判断する材料が増える。

実装コストは極小（各 phase の pattern に説明文字列を追加するのみ）であり、harm がない。advisory の構造的制約（Claude が無視する可能性）は残るが、「無視する理由」が減る。

再検討条件: Advisory メッセージが長くなりすぎてコンテキストを圧迫する場合、または enforcement への移行により advisory メッセージ自体が不要になった場合。

## Alternatives Considered

### Competing outlines を共有 Skill として抽出する

`/design` Phase 2 と `/implement` Phase 1 Step 2 の competing outlines 手続きを、パラメータ化された共有 Skill として抽出する案。

本提案より優れる点: DRY 原則に沿い、手続きの変更が1箇所で完結する。

本提案を選んだ理由: `competing-strategy-exploration.md` の Alternative C で既に却下されている。却下理由は「workflow-planner の既存ステップモデルへの統合が自然であり、新しいスキルを導入すると planner および agent-team-execution との責務の重複が生じる」。さらに、`/design` の competing outlines（アウトラインの構造・議論フロー・読者への適合性を比較）と `/implement` の competing plan outlines（タスク順序・依存関係・並列化可能性を比較）は対象が構造的に異なり、パラメータ化による吸収は premature abstraction のリスクが高い。現時点では `/design` と `/implement` の2箇所のみであり、3箇所の閾値に達していない。

再検討条件: `/debug` や `/feature-spec` を含む3つ以上のコマンドで competing outlines が使用されるようになり、共有スキル化の閾値に達した場合。

### `/plan` コマンドに workflow-planner 統合を追加する

`/plan` に `/implement` Phase 1 と同等の workflow-planner 呼び出し・Axes Table・competing outlines を追加する案。

本提案より優れる点: ユーザーが「実装プランを作成して」と言った際に `/plan` が直接対応できる。

本提案を選んだ理由: `/plan` は CLAUDE.md で「Supporting Command — Available for direct invocation when the full workflow is not needed」と位置づけられている。`/implement` Phase 1 が既にフル計画ワークフロー（scout dispatch、learnings check、Axes Table、competing outlines、Strategy Exploration）を提供しており、`/plan` を同等にすると機能的重複が発生する。ユーザーが計画のみを必要とする場合、`/implement` の Phase 1 PAUSE ポイント（計画承認後に実行前に停止）で自然に対応できる。

再検討条件: `/implement` の Phase 1 だけを独立実行したいユースケースが頻繁に発生し、Phase 1 PAUSE 後の手動停止では不十分な場合（例: 計画を別セッションで実行する、計画を非技術者にレビューしてもらう、など）。

### Weighted scoring による phase detection

First-match-wins を重み付きスコアリングに置き換え、各 phase pattern に数値重みを割り当てる案。

本提案より優れる点: 複数の pattern がマッチした場合に最も可能性の高い phase を選択できる。Confidence threshold を設定し、低確信度の場合に LLM fallback に委ねることも可能。

本提案を選んだ理由: Phase detection は advisory-only であり、分類精度の向上が行動変化に直結しない。Counter-research の知見によれば、advisory を LLM にしても Claude は実行プレッシャーで無視する。Pattern reorder + compound patterns で同等の改善が低コストで達成可能（数行の変更 vs weighted scoring システムの設計・実装・テスト）。

再検討条件: Phase detection が enforcement（gate）に昇格した場合。

### `implement-plan` フェーズ分離

`feature-spec → design → implement-plan → implement → debug` のフェーズ構成にする案。

本提案より優れる点: 「実装プランを作成して」が `implement-plan` に一意にマッチし、意図とコマンドの対応が明確になる。

本提案を選んだ理由: 小規模変更に対して2コマンド（plan → implement）を強制するのは過剰。`/implement` Phase 1 の PAUSE ポイントが自然な計画承認ゲートとして機能しており、フェーズを分離する構造的な必然性がない。

再検討条件: 計画と実装を異なるセッションで実行するユースケースが頻繁に発生する場合。

## Cross-Cutting Concerns

### 既存ワークフローへの影響

workflow-planner SKILL.md への仕様追加（DD1-DD3）は、`/design` と `/implement` の既存ワークフローの動作を変更する。具体的には、Axes Table が生成されるようになるため、competing outlines が発動する頻度が増加する。これは意図された変更であり、`competing-strategy-exploration.md` で設計された機能が実際に機能するようになることを意味する。

Phase detection の改善（DD4-DD5）は advisory のため、既存動作への影響は限定的。

### コンテキスト消費

Axes Table 生成は planner の出力にテーブルを追加するため、コンテキスト消費が微増する。ただし、Axes Table はコンパクトな構造化データ（5-10行程度）であり、影響は軽微。

## Concerns

### planner の仕様追加が実行を保証するか

SKILL.md に手続きを追加しても、Claude が実行プレッシャーでステップをスキップする可能性がある。

緩和策: 因果的依存の設計（学び #1: 「因果的依存は compliance handshake ではなく quality improvement として設計する」）により、Axes Table を Step 4 の必須入力にする。Axes Table がなければ Step 4（実行プラン生成）が開始できない構造にすることで、スキップを構造的に困難にする。ただし、Claude が因果的依存自体を無視するリスクは残る。このリスクは SKILL.md の仕様レベルでは解決できず、enforcement メカニズム（hook による gate）の検討が必要だが、それは本設計の Non-Goals。

### Pattern reorder の保守性

Compound patterns と negative patterns の追加は regex の複雑さを増す。新しい phase pattern を追加する際に、既存の compound patterns との干渉が発生する可能性がある。

緩和策: 各 pattern の意図を文書化する（コード内コメント）。テストケースを追加し、典型的なユーザーメッセージに対する期待される分類結果を検証する。将来的に LLM fallback への移行パスを残しておく。

### Advisory 改善の限界

DD4 と DD5 は phase detection の精度とメッセージ内容を改善するが、advisory の構造的制約（Claude が無視する可能性）は解決しない。これは意識的な受容であり、本設計は「advisory をより有用にする」ことを目指し、「advisory を gate に昇格する」ことは目指さない。Advisory → gate の判断は影響範囲が大きく、ユーザー体験への影響（全プロンプトに対する追加の確認ステップ）を含む別設計が必要。

ユーザーの当初の問題（Claude がワークフローに入らなかった）はクラスタAに属し、DD4-DD5 の寄与は限定的である。この点を正直に認識した上で、DD4-DD5 は「害がなく低コスト」であるため含める。

### DD2+DD3 の実装原子性

DD2（トリガー評価マッピング）と DD3（competing outlines fallback）は、DD1（Axes Table 生成）が先に実装されていなければ機能しない。DD1 なしに DD2 を実装しても、評価対象の Axes Table が存在しない。実装順序は DD1 → DD2 → DD3 でなければならず、部分的な実装は機能しない。

### SKILL.md の複雑性増加

DD1-DD3 は workflow-planner SKILL.md に新しいサブステップ、決定木、fallback 手続きを追加する。現時点で SKILL.md は約274行であり、追加により300行を超える可能性がある。SKILL.md が長大になると、Claude が仕様の一部をスキップするリスクが高まる。

緩和策: 追加する手続きは既存のステップ構造（Step 1, Step 4 等）に統合し、新しいセクションの増設を最小化する。独立したセクション（例: 「Axes Table Procedure」）として分離すると、既存ステップとの接続が暗黙的になり読み飛ばされやすい。

## Review Checklist

- [ ] Architecture approved — workflow-planner SKILL.md の変更が既存の planner-driven adaptive workflow と整合
- [ ] Causal dependency verified — Axes Table が Step 4 の必須入力として因果的依存を形成
- [ ] Backward compatibility confirmed — `/design` と `/implement` の既存ワークフローが破壊されない
- [ ] Phase detection changes tested — pattern reorder + compound patterns が典型的なユーザーメッセージで正しく動作
- [ ] Prior design decisions respected — `competing-strategy-exploration.md` Alternative C の却下理由と整合
