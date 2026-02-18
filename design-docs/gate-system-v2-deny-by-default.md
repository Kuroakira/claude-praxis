# Gate System v2: Deny-by-Default and Context-Aware Enforcement

## Overview

claude-praxisのゲートシステムを再設計する。現行のゲートは「壊れた時に素通りする」「コード変更のない会話でもブロックする」「Phase Detectionが機械的に強制されない」という3つの構造的問題を抱えている。本提案は、deny-by-default化、コンテキスト認識型Stop hook、UserPromptSubmitによるPhase Detection自動化の3施策でこれらを解決する。

## Context and Scope

### 現行システムの成り立ち

claude-praxis v0.5.0では、6つのフック（SessionStart, PreCompact, PreToolUse, PostToolUse, Stop, TaskCompleted）で品質ゲートを実装している。PreToolUseフックがEdit/Write前にスキル呼び出しを検証し、Stopフックが完了宣言前に検証を要求する。

このシステムは「セッションマーカー方式」で動作する。PostToolUseフックがSkill tool呼び出し時にマーカーファイルに記録し、PreToolUseフックがそのマーカーを参照して、必要なスキルが呼び出し済みかを確認する。

### 観測された問題

別リポジトリでの実際の開発セッションで、以下が確認された：

1. **code-quality-rulesなしでEditが通過した** — `.tsx`ファイルへのEditがスキルゲートに引っかからずに成功した。check-skill-gate.shの`SESSION_ID`空チェックでのsilent allow（`exit 0`）か、プラグインのフック自体が発火しなかった可能性がある

2. **ブレスト会話でStop hookが3回発火した** — コード変更を含まない純粋な議論セッションで「typecheck, lint, testを実行せよ」とブロックされ、カウンター方式の安全弁に到達して突破した。ゲートが会話のテンポを乱し、最終的に証拠なしで通過した

3. **Phase Detection / Skill Checkが完全にスキップされた** — getting-startedスキルがSessionStartで注入されたにもかかわらず、Claudeはガイダンスに従わず直接タスク実行に入った

### 過去の学習との整合

global-learnings.mdに記録済みの知見が、今回の問題と一致している：

- **"LLM instruction compliance has structural limits"** — テキスト指示のみでは、具体的な実装タスクが来た時にスキップされる。機械的強制が必要
- **"MCP failures displace process gates"** — エラー回復後に実行モードに入ると、ゲートチェックの「ウィンドウ」が過ぎてしまう

これらの学習は「テキスト指示だけでは不十分、機械的強制が必要」という同じ結論に収束する。今回の問題もその延長線上にある。

### プラグインのフックパス問題（新たな制約）

調査の過程で、Claude Codeにおけるプラグインフックパスの既知の問題を確認した。プラグインのバージョンが更新されると、`~/.claude/settings.json`内のフックパスが旧バージョンのパスを保持したままになり、旧バージョンがキャッシュから削除されるとフックが静かに失敗する。

これはdariusリポジトリでフックが発火しなかった直接の原因である可能性がある。ただし、この問題はClaude Code本体の修正を待つ必要があり、claude-praxis側で解決できる範囲は限定的。本Design Docでは、フックが**発火した上で**正しく動作することに焦点を当てる。

## Goals / Non-Goals

### Goals

- **G1**: フック内部のエラー（JSONパース失敗、SESSION_ID空等）が発生した時、素通りではなくブロックして問題を可視化する（deny-by-default）
- **G2**: コード変更を含まないセッション（ブレスト、リサーチ、議論）でStop hookがブロックしない（コンテキスト認識）
- **G3**: Phase Detection（タスクのフェーズ判定とスキル提案）がテキスト指示ではなく機械的に毎プロンプト実行される

### Non-Goals

- フックが発火しない問題（プラグインパス問題）の解決 — Claude Code本体側の問題
- AsyncHooksによるバックグラウンド品質チェック — 将来の改善（改善計画の方針6）
- SubagentStartフックによるルール注入 — 将来の改善（改善計画の方針5）
- Agent Teamsへの移行 — 実験的機能の安定化待ち

## Proposal

3つの施策で構成される。それぞれ独立しており、個別に実装・検証可能。

### 施策1: check-skill-gate.shのdeny-by-default化

**解決する問題**: G1 — エラー時のsilent allow

**なぜこの変更が必要か**: 現行のcheck-skill-gate.shは、SESSION_IDが空またはJSONパースが失敗した場合に`exit 0`を返す。これは「チェック機構自体が壊れた時に、チェックをスキップする」挙動であり、ゲートとしての意味を失わせる。セキュリティの「fail closed」原則に従い、チェックできない場合はブロックする。

**設計判断**: エラーパスでの出力形式にexit 2（stderr生テキスト）を採用する。exit 0 + `permissionDecision: "deny"`（JSON構造化出力）も選択肢だが、JSONパース失敗がエラーの原因であるケースでは、JSON出力の構築自体が信頼できない。エラーパスではシンプルなexit 2 + stderrが適切。

**副次効果**: check-skill-gate.shがコードファイルのEdit/Writeを正常に処理した時に、`code-session`マーカーを書く機能を追加する。このマーカーは施策2で使用される。

**受け入れるトレードオフ**: Claude Codeのstdinフォーマットが変更された場合、全Edit/Writeがブロックされる。これは「品質チェックなしで作業が進む」よりも「作業が止まって問題に気づく」の方が望ましいという判断。ただし、ユーザーがプラグインを一時的に無効化することで回避可能。

### 施策2: コンテキスト認識型Stop hook

**解決する問題**: G2 — ブレスト会話での不要なブロック

**なぜこの変更が必要か**: 現行のStop hookはマッチャー非対応で常に発火し、カウンター方式で最大2回ブロックする。セッションの内容に関わらず同じ挙動をするため、コード変更を含まない会話（ブレスト、リサーチ、Design Doc議論等）でも検証を要求してしまう。

**設計判断**: 施策1で追加する`code-session`マーカーの存在を確認し、マーカーがない場合（コード変更なし）はブロックせずに`exit 0`で通過させる。マーカーがある場合のみ、verification-before-completionのブロックを実行する。

カウンター方式は廃止する。代わりに、verification-before-completionスキルが呼び出された時にmark-skill-invoked.shが記録するマーカーを確認する。スキル呼び出しマーカーが存在すれば検証済みと判断して許可。存在しなければブロック。

無限ループの防止には、stdinに含まれる`stop_hook_active`フラグを使用する。このフラグがtrueの場合、既にStop hookのループ内にいることを意味するため、追加のブロックは行わない。

**受け入れるトレードオフ**: コード変更を含まない純粋なブレストセッションでは、verification-before-completionが完全にスキップされる。ドキュメント変更のみのセッションで検証が不要かは議論の余地があるが、document-quality-rulesの検証は目視レビューが中心でありtypecheck/lint/testとは性質が異なるため、ブロックしない判断とする。

### 施策3: UserPromptSubmitによるPhase Detection自動化

**解決する問題**: G3 — Phase Detectionの機械的強制

**なぜこの変更が必要か**: Phase Detection（タスクのフェーズ判定と適切なスキルの提案）は、getting-startedスキルにテキスト指示として記載されている。しかし過去の学習が示す通り、テキスト指示だけではClaudeが実行モードに入った時にスキップされる。

**設計判断**: UserPromptSubmitフックを`type: "prompt"`で追加する。LLM（高速モデル）がユーザーのメッセージ内容を分類し、適切なスキル提案を`additionalContext`として注入する。

`type: "prompt"`を選択する理由: Phase Detectionは「このメッセージは実装依頼か、リサーチ依頼か、ブレストか」というセマンティックな判断を必要とする。`type: "command"`のキーワードマッチでは「undo/redoの実装を調べて」が「リサーチ」と「実装」のどちらかを正確に判定できない。LLMならメッセージ全体の意図を読み取れる。

毎プロンプト実行の正当性: 1セッション内でフェーズが変わるケース（調査 → ドキュメント作成 → 実装）が実際に発生するため、初回のみの判定では不十分。毎プロンプト1-3秒のレイテンシは、フェーズ誤検出によるスキル未適用のリスクと比較して許容範囲。

**additionalContextとして返す内容**: ブロック（`decision: "block"`）ではなくコンテキスト注入を使う。Phase Detectionはゲートではなく「道案内」であり、Claudeの判断を支援するものであって、ユーザーのプロンプトをブロックすべきではない。

**受け入れるトレードオフ**: 毎プロンプトにLLM呼び出しが発生する。高速モデル（Haiku相当）で1-3秒のレイテンシ、金銭コストは無視できるレベル。ただし、累積的なレイテンシがユーザー体験に与える影響は、実装後にモニタリングが必要。

## Alternatives Considered

### Alternative: カウンター方式の改良（Stop hook）

現行のカウンター方式を維持しつつ、ブロック回数を増やす（例: MAX_BLOCKS=5）。

| Aspect | Detail |
|--------|--------|
| How it works | 既存のカウンターベースのロジックを維持。ブロック上限を引き上げ |
| Why Proposal is preferred | カウンターは「何回ブロックしたか」を数えるだけで、「検証が完了したか」を判断しない。回数を増やしても本質的な問題（証拠なしの突破）は解決しない。また、ブレスト会話での不要なブロック問題も残る |
| When to reconsider | マーカーファイルの信頼性に問題が見つかった場合（ファイルシステムのレースコンディション等） |

### Alternative: `type: "command"`キーワードマッチ（Phase Detection）

UserPromptSubmitを`type: "command"`で実装し、正規表現でユーザーメッセージを分類する。

| Aspect | Detail |
|--------|--------|
| How it works | 「実装」「バグ」「調査」などのキーワードを正規表現でマッチ。LLM呼び出しなし |
| Why Proposal is preferred | 自然言語の意図はキーワードだけでは判定できない。「undo/redoの実装を調べて」は「調べて」と「実装」の両方を含むが、意図は「リサーチ」。LLM判断なら文脈から正しく分類できる |
| When to reconsider | Prompt hookのレイテンシが許容できないほど大きい場合。または、フェーズの分類が十分に単純化できた場合 |

### Alternative: Stop hookを`type: "prompt"`に変更

Stop hookのハンドラタイプを`type: "prompt"`に変更し、LLMに「このセッションでコード変更があったか」を判断させる。

| Aspect | Detail |
|--------|--------|
| How it works | Stop発火時にLLMがセッション内容を分析し、コード変更の有無を判定 |
| Why Proposal is preferred | `code-session`マーカーは確定的（コードファイルのEdit/Writeが実行された事実に基づく）。LLM判断は確率的であり、誤判定のリスクがある。また、マーカー方式はLLM呼び出しコストがゼロ |
| When to reconsider | 「コード変更」の定義が単純なファイル拡張子チェックでは不十分になった場合（例: Notebook編集、設定ファイルの変更がコード変更に含まれるべきケース） |

## Cross-Cutting Concerns

### レイテンシへの影響

施策3（UserPromptSubmit Prompt Hook）は毎プロンプトに1-3秒のレイテンシを追加する。Claude自体の応答生成時間（通常5-30秒）と比較すると相対的に小さいが、体感には個人差がある。実装後に「遅い」というフィードバックが出た場合、Prompt Hookの分類ロジックを簡略化するか、`type: "command"`へのフォールバックを検討する。

### フック間の依存関係

施策2（Stop hook）は施策1（check-skill-gate.sh）が書く`code-session`マーカーに依存する。施策1なしに施策2を単独で実装すると、`code-session`マーカーが存在しないためStop hookが常にスルーになる。実装順序は施策1 → 施策2とする。施策3は独立しており、任意の順序で実装可能。

### プラグインのバージョンアップ耐性

すべての施策はマーカーファイル（`/tmp/claude-praxis-markers/`）とstdin JSONに依存する。Claude Codeのstdin JSON構造が変更された場合、deny-by-default（施策1）によりブロックが発生し、問題が可視化される。これは意図された挙動。

## Concerns

### C1: deny-by-defaultによる作業中断リスク

check-skill-gate.shのエラーパスがexit 2を返すことで、フックの不具合時に全Edit/Writeがブロックされる。ユーザーが原因を特定できない場合、開発作業が完全に止まる可能性がある。

**緩和策**: ブロック時のstderrメッセージに「プラグインを一時的に無効化して作業を続行できます」というガイダンスを含める。また、どのエラーパスでブロックされたかを特定できるよう、エラーメッセージにコンテキスト（「SESSION_ID extraction failed」等）を含める。

### C2: Prompt Hookの分類精度

UserPromptSubmitのLLM分類が誤判定した場合、不適切なスキルが提案される。ただし、施策3はadditionalContext（道案内）であってブロックではないため、誤判定の影響は「不要な提案が表示される」に留まる。Claudeまたはユーザーが提案を無視することは自由。

### C3: `code-session`マーカーの網羅性

現在のcheck-skill-gate.shはファイル拡張子でコードファイルを判定している。NotebookEdit（.ipynb）やConfig系ファイルの変更はコード変更として扱われない。将来的にスコープを拡大する必要があるかもしれないが、まずは現行の拡張子ベースで開始し、実運用でフィードバックを得る。

## Review Checklist

- [ ] deny-by-defaultのエラーメッセージに十分なコンテキストが含まれるか
- [ ] Stop hookの`stop_hook_active`フラグによるループ防止が正しく機能するか
- [ ] UserPromptSubmit Prompt Hookのプロンプトテンプレートが分類精度を満たすか
- [ ] 施策1 → 施策2の実装順序依存が文書化されているか
- [ ] 全施策にテストが存在するか
