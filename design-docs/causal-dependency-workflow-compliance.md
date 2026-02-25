# Causal Dependency によるワークフローステップ遵守の改善

## Overview

claude-praxis のワークフローコマンド（特に `/implement`）で、推奨されているステップ（Scout dispatch、並列化評価）が silent skip される問題に対する incremental improvement。テンプレート強制や hook gate ではなく、ステップ間の因果的依存を利用して「実行しないと Plan が不完全になる」構造をプロンプトレベルで実現する。これは完全な解決策ではなく、hook を使わない制約下での最善のテキストレベル改善として位置づける。

## Context and Scope

この Design Doc は、claude-praxis のワークフロー遵守問題に対して、既に試行された2つのアプローチの限界を踏まえた第三の選択肢を提案する。

claude-praxis はAI支援開発のフレームワークで、ワークフローコマンド（`/implement`、`/design` 等）がフェーズごとの手順を定義している。各コマンドは Scout dispatch（コードベース調査）、並列化評価（agent-team-execution の検討）、レビューフェーズなどのステップを含む。

実際の運用で、以下の問題が繰り返し発生している：

- **Scout が dispatch されない**: `/implement` の Phase 1 で Scout agent の dispatch が指示されているが、AI が汎用の Explore エージェントを選択したり、直接ファイルを読み始める
- **並列化が検討されない**: 複数の独立した調査対象があっても、agent-team-execution の適用判断自体が行われない
- **レビューフェーズが省略される**: 成果物完成時点で「完了」と判断し、review や verification のステップが計画に組み込まれない

これらの問題の根本原因は「Skill Check ゲートを通らなかった」ことにある。AI がワークフローの入口を通らずに実行モードに入ると、下流のすべてのステップが影響を受ける。

この問題に対して、2つのアプローチが既に試行され、それぞれ限界が確認されている：

- **Hook による hard gate**: PreToolUse hook でツール実行をブロックする方式。code-quality-rules のゲートでは機能しているが、JSON フォーマットの不整合や通常の問いかけを無視するケースが発生した。すべてのステップを hook 化すると副作用が拡大する
- **テキスト強調（MUST、CRITICAL、Iron Rule）**: getting-started skill で「Iron Rule: 1%でも適用可能性があればスキルを呼び出せ」と定義しているが、具体的な実装タスクを受け取ると AI は実行モードに入り、メタプロセスをスキップする。Global Learnings にも「LLM instruction compliance has structural limits」として記録されている

なお、このプロジェクトの global learnings は「テキストレベルの指示だけでは重要なゲートに不十分」と結論づけている。本提案もテキストレベルの変更であり、この限界は認識した上で、hook を追加しないという制約下での改善を目指す。

## Goals / Non-Goals

### Goals

- Scout dispatch の結果が Plan の構成要素になり、Scout を skip すると Plan が不完全になる構造を作る
- agent-team-execution の適用判断が Plan 作成プロセスの一部として自然に発生する構造を作る
- 正当な skip（Scout 不要な小規模タスク等）を許容しつつ、silent skip（判断なしの省略）を排除する
- 10セッション後に効果を測定し、次のアプローチを判断するための基準を設ける

### Non-Goals

- 新しい hook や hard gate の追加（副作用が確認済み）
- 全ワークフローステップの強制テンプレート化（チェックボックスコンプライアンスのリスク）
- implement.md 以外のコマンドの変更（まず implement で効果を検証してから波及を判断）
- 完全な解決（テキストレベル変更の限界は認識済み）

## Proposal

2つの改善を implement.md の Phase 1（Planning）に適用する。どちらもプロンプト構造の変更のみで、hook やスキーマバリデーションは追加しない。

### なぜ因果的依存か — 完全な orchestration との比較

claude-praxis のコマンドは現在、2つのモデルでエージェント dispatch を扱っている：

- **Command orchestration**: `/design` Phase 1 は「4つのエージェントを dispatch せよ。自分でリサーチするな」と明示的に orchestrate する。この方式はリサーチフェーズで機能している
- **AI discretion**: `/implement` Phase 1 は「Scout を dispatch せよ」と書くだけで、AI の判断に委ねる。この方式で silent skip が発生している

完全な orchestration（`/design` 方式）を `/implement` の Scout にも適用しない理由は、Scout dispatch がすべてのタスクで必要とは限らないためである。`/design` のリサーチは常に必要だが、`/implement` の Scout は既知の単一ファイル修正では不要な場合がある。因果的依存は「常に実行」と「任意に実行」の間の第三の選択肢であり、「実行するか、skip する理由を明示するか」を求める。

### 改善 1: Scout Dispatch の因果的依存化

現状、Scout dispatch は Phase 1 のステップとして記載されているが、その結果が後続ステップにどう使われるかが明示されていない。AI は Scout を「推奨される追加ステップ」と解釈し、直接ファイルを読むことで代替できると判断する。

設計方針: Scout の出力を Plan の必須入力にする。Plan の各タスク定義が既存パターンとの関係を記述する際、その情報源が Scout report であることを構造的に示す。Scout を実行せずに Plan を書くと、既存パターンに関する記述が空欄または推測になり、Plan が visibly incomplete になる。

この方式がテンプレートの「空欄埋め」と異なるのは、因果の方向性にある。テンプレートは「セクションを埋めよ」という形式要件であり、もっともらしいテキストで満たせる。因果的依存は「Scout の出力データを Plan に使え」という入力要件であり、data を生成するには Scout を実行するか、同等の調査を自力で行う必要がある。bypass のコスト（自力でコードベースを調査し、結果を Scout output のように記述する）が compliance のコスト（Scout を dispatch する）と同等かそれ以上になるため、compliance が合理的な選択になる。

ただし、このインセンティブ構造は完全ではない。AI が実行モードに入っている場合、ファイルを直接読むことは「追加コスト」ではなく「デフォルト行動」であり、その結果を Scout findings として記載することも容易である。この限界は Concerns セクションで扱う。

**Skip パスの設計**: Scout dispatch が不要なケースでは、Plan の冒頭でその判断と理由を記載する。Skip の判断基準は「このタスクで、Scout が発見しうる未知のパターンや integration point があるか」であり、Planning の判断として記載する（compliance の checkbox としてではなく）。

Skip が適切なケース：
- ユーザーが明示的に指定した単一ファイルへの変更で、他モジュールとの integration point がない
- 直前のタスクで同じコードベース領域を Scout 済みで、findings が有効

Skip が不適切なケース：
- 複数ファイルにまたがる変更
- 初めて触るモジュールやライブラリ
- 「たぶん大丈夫」「スコープが明確だから」（推測ベースの理由）

**Design Doc なしで `/implement` が呼ばれた場合**: Design Doc が存在しない直接実装リクエストでも、Scout の因果的依存は同様に適用される。むしろ Design Doc がない場合は Plan がコードベース理解の唯一の根拠になるため、Scout findings の価値はより高い。

### 改善 2: 並列化評価の判断ステップ化

現状、implement.md には「consider using subagent-driven-development」と記載されている。「consider」は AI にとって「検討したが不要と判断した」と等価であり、判断プロセスが不可視になる。

設計方針: Plan 作成の中間ステップとして、タスク間の依存関係分析を明示的に組み込む。各タスクの仕様定義後に、タスク間の依存関係を整理し、独立タスクの数を数えるステップを追加する。

独立タスクが3つ以上ある場合、subagent-driven-development（実装）または agent-team-execution（調査・レビュー）の適用を評価し、結果を Plan に記載する。2つ以下の場合は sequential で進行し、その旨を記載する。

この設計のポイントは「並列化するか」の二択ではなく、「依存関係を分析する」ステップが Plan の構成プロセスに自然に含まれることにある。依存関係の分析は Plan の品質にも直接貢献するため、「余分なステップ」ではなく「Plan を良くするステップ」として機能する。

**Skip パスの設計**: タスクが1-2個の場合は依存関係分析自体が trivial なので、「タスク数: N、全て sequential」の一行で十分。判断の記録は求めるが、分析の深さはタスク数に比例する。

### 変更のスコープ

この Proposal は implement.md の Phase 1（Planning）のみを対象とする。Phase 2（Task Execution）と Phase 3（Final Review）は変更しない。他のコマンド（`/design`、`/debug` 等）も変更しない。`/debug` にも「consider using agent-team-execution」という同様のパターンがあるが、implement での効果検証後に判断する。

## Alternatives Considered

### Alternative: テンプレート必須セクション追加

Plan の出力に「Scout Summary」「Parallelization Decision」セクションを必須として追加し、空欄を許さない方式。

| Aspect | Detail |
|--------|--------|
| How it works | Plan テンプレートに必須セクションを追加。AI はセクションを埋めないと Plan を提出できない |
| Why Proposal is preferred over this | 研究で「チェックボックスコンプライアンス」のリスクが指摘されている — AI はセクションをもっともらしいテキストで埋めるが、実際に Scout を実行するとは限らない。Proposal は「Scout の出力データを Plan に使え」という入力要件なので、bypass にはデータ生成が必要。ただし、Proposal にも fabrication リスクはあり（Concerns 参照）、テンプレート方式と比べた優位性は程度の差であって質的な差ではない |
| When to reconsider this alternative | Proposal の因果的依存でも形式的な引用が頻発する場合。その場合はテンプレート + 事後レビューの組み合わせが現実的 |

### Alternative: Hook による hard gate 化

PreToolUse hook で Plan 提出前に Scout marker を確認し、無ければブロックする方式。

| Aspect | Detail |
|--------|--------|
| How it works | Scout dispatch 時に marker ファイルを作成。Plan 関連ツール呼び出し時に marker を確認 |
| Why Proposal is preferred over this | 既に hook gate で JSON フォーマット不整合や通常の問いかけ無視が発生した実績がある。これは hook の概念的な問題ではなく実装上の問題であり、改善可能ではある。しかし現時点では hook 追加のリスクを避け、プロンプト改善の効果を先に測定する判断をした |
| When to reconsider this alternative | Proposal の効果が不十分な場合、hook の実装品質を改善した上で再検討する。既存の check-skill-gate パターンは機能しており、同様のパターンで Scout gate を追加することは技術的に可能 |

### Alternative: 事後レビューによるインセンティブ型遵守

ステップ強制ではなく、タスク完了後のレビューで「Scout を使っていればより良い結果だったか？」を評価する方式。

| Aspect | Detail |
|--------|--------|
| How it works | Phase 3（Final Review）のレビュー項目に「ワークフローステップ遵守」を追加。レビュアーが skip の妥当性を評価 |
| Why Proposal is preferred over this | 事後的なフィードバックは「次回から気をつける」であり、今回のタスクの品質には影響しない。Proposal は Plan 作成段階で Scout 情報を使うため、Plan 自体の品質が向上する |
| When to reconsider this alternative | Proposal と組み合わせる形で有効。因果的依存で Plan 段階の遵守を改善し、事後レビューで効果を測定する二重構造は将来の選択肢 |

## Cross-Cutting Concerns

### Token コスト

Scout dispatch は haiku モデルの subagent で実行されるため、追加コストは限定的。並列化評価ステップは Plan 作成プロセス内のテキストで、依存関係分析を含めると300-500トークン程度の追加。テンプレート必須セクション方式と比較して同等だが、Plan 品質への貢献を考慮すると投資対効果は高い。

### タスク複雑度への適応性

Skip パスの設計により、小規模タスクではオーバーヘッドが最小（skip 判断の一行 + sequential の一行）。大規模タスクでは Scout findings が Plan の品質に直接貢献するため、オーバーヘッドではなく投資になる。

## Concerns

### Fabrication による bypass

AI が Scout を実際に dispatch せず、コードベースを直接読んだ結果を「Scout findings」として記載する可能性がある。因果構造は「Scout output が必要」という前提だが、AI が output を fabricate すれば構造を迂回できる。

特に、AI が実行モードに入っている場合（global learnings で記録されている問題）、直接ファイルを読むことはデフォルト行動であり、fabrication の追加コストはほぼゼロになる。この限界は認識している。

現時点の対策: human checkpoint（Plan 承認時の目視確認）に依存する。Plan 承認時に Scout dispatch の実行ログを確認することで fabrication を検出できる。将来、効果が不十分な場合は hook による Scout dispatch marker の確認を検討する（check-skill-gate パターンの拡張）。

### Skip path のゴム印化

Skip が容易すぎると、「Scout skip: スコープが明確」が定型文化し、判断の明示化という目的が形骸化する可能性がある。Skip の判断基準（具体的なケース例）を implement.md に含めることで基準を共有するが、最終的には human が Plan 承認時に skip 理由の妥当性を判断する。

### implement.md の複雑度増加

Phase 1 にステップを追加することで、implement.md の総テキスト量が増加する。モデルの注意リソースは有限であり、指示が増えるほど個々のステップへの attention が分散するリスクがある。変更は最小限に留め、既存ステップの言語を変更する形を優先し、新規ステップの追加は依存関係分析のみに限定する。

### テキストレベル変更の根本的限界

このプロジェクトの global learnings は「テキストレベルの指示だけでは重要なゲートに不十分」と記録している。本提案もテキストレベルの変更であり、この限界を超えることはできない。本提案は「完全な解決」ではなく「hook を使わない制約下での incremental improvement」として位置づける。効果が不十分な場合は、hook gate の実装品質改善（check-skill-gate パターンの Scout への拡張）を次のステップとして検討する。

## Success Criteria

この変更を incremental experiment として評価するための基準：

- **測定期間**: 変更適用後 10 セッション
- **Primary metric**: `/implement` セッションで Scout が dispatch された割合（現状のベースラインから改善があるか）
- **Secondary metric**: Plan 承認時に human が「Scout 情報が Plan の品質に貢献した」と判断した割合
- **Failure signal**: 10セッション中5回以上で Scout skip が generic な理由（「スコープが明確」等）で使われた場合、skip path の設計を見直す
- **Escalation criteria**: Primary metric が改善しない場合、hook gate（Alternative 2）を再検討する

## Review Checklist

- [ ] Architecture approved — 因果的依存の設計が Scout/並列化の問題を改善するか（完全解決ではなく改善）
- [ ] Side effects assessed — implement.md の変更が他のフェーズや他のコマンドに悪影響を与えないか
- [ ] Skip path validity — 正当な skip が不必要に困難にならないか
- [ ] Token cost acceptable — 追加トークンが Plan 品質の改善に見合うか
- [ ] Success criteria measurable — 10セッション後に効果を判断できるか
