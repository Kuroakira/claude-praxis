# Learnings — Design Level

設計判断・アーキテクチャに関する学び。design, implement, review, planフェーズで参照される。

## 開発学習に時間減衰は不適切。明示的な無効化のみ

- **Learning**: 開発パターンの学び（deny-by-default等）は時間経過で価値が減らない。学びが無効になるのは前提条件が変化した時であり、自動的な時間減衰ではなく/compoundの圧縮ステップで人間が判断する
- **Context**: ECC（everything-claude-code）も自動減衰ではなく矛盾検出時の処理として設計している。spaced repetitionの減衰モデルは記憶保持用であり、再利用可能な設計パターンには不適切
- **Implication**: 知識管理に信頼度を導入する際、減衰メカニズムは慎重に選択する。「確認されていない = 価値が下がった」ではない
- **Confirmed**: 1回 | 2026-02-28 | compound

## メタデータは同一ファイルにインラインで保持する（別ファイル管理は同期リスク）

- **Learning**: 学びエントリとそのメタデータ（信頼度等）は物理的に同一のファイルに置く。別ファイルに分離すると、エントリ名変更や圧縮操作のたびに同期が必要になり、漏れのリスクが生じる
- **Context**: 信頼度スコアの設計で、別JSONファイルによるメタデータ管理を検討したが、/compoundの重複排除・統合でエントリが変わるたびに2ファイルの同期が必要になる問題があった。インライン方式なら同期の問題が構造的に発生しない
- **Implication**: Markdownファイルに機械可読なメタデータを追加する場合、`- **Key**: Value`パターンのインラインフィールドが同期リスクと可読性のバランスが最も良い
- **Confirmed**: 1回 | 2026-02-28 | compound

## Design Docは実装中に更新してよい（FeatureSpecとの乖離が発生する場合）

- **Learning**: Design Docの判断がFeatureSpecの記述と異なる場合がある。WHY（なぜそのアプローチか）が変わらない限り、HOW（具体的な手段）をDesign Doc段階で修正することは自然であり、FeatureSpecの遡及修正は不要
- **Context**: Contextsシステムで、FeatureSpecは「learnings.mdの分割は将来の検討事項（Out of Scope）」としていたが、Design Doc段階で「ファイル分割が物理的なコンテキスト削減に必要」と判断を変更。WHY（コンテキスト効率化）は不変、HOW（セクション構造 → ファイル分割）が進化した
- **Implication**: FeatureSpecはWHATとWHY、Design DocはHOWを所有する。HOWの変更はDesign Docの責務であり、FeatureSpecとの「差分」は矛盾ではなく詳細化
- **Confirmed**: 1回 | 2026-02-28 | compound

## Design Docの暗黙操作はUI上の明示操作に昇格させる

- **Learning**: Design Docで本文記述のみの操作（暗黙的なフロー）がある場合、コマンドやUIの提案テーブルに明示的な操作として昇格させると、ユーザーが意識的に選択できるようになる
- **Context**: Confidence-Scored LearningのDesign Docでは「既存Stockのレビュー時の確認更新」を本文で説明していたが、圧縮提案テーブルには3操作（Dedup/Obsolete/Synthesize）のみだった。4つ目の「Confirm（インクリメント）」操作として表面化したことで、ユーザーが操作を選択可能に。レビュアーも「improvement over the Design Doc」と判定
- **Implication**: command/skillの設計時、Design Docの散文的な記述に埋もれている操作がないか確認する。ユーザーが判断する場面では、暗黙より明示の方が良い
- **Confirmed**: 2回 | 2026-02-25 | implement, design

## 単一スコア(0.0-1.0)より多次元メタデータが人間の判断に有用

- **Learning**: 知識の信頼度を表現する際、単一の数値スコアより、独立した意味を持つ複数ディメンション（確認回数・最終確認日・確認元フェーズ）の方が人間の判断材料として有用
- **Context**: ECCは単一のconfidenceスコア（0.0-1.0）を使用するが、ECCはinstinct単位の機械的なフィルタリング（import/export）が前提。claude-praxisは人間が読み判断するMarkdownファイルであり、用途によって重要なディメンションが異なる（圧縮判断→回数、Recall優先度→日付、スキル候補→フェーズ多様性）
- **Implication**: 人間が判断者であるシステムでは、集約された単一スコアより、各ディメンションを独立して提示する方が判断の質が高い
- **Confirmed**: 1回 | 2026-02-28 | compound

## 外部書き込み側はデータのみ、状態管理は消費側が所有する

- **Learning**: 外部プロセスがファイルにデータを書き込み、hookがそれを読む設計では、外部側は生データ（数値・タイムスタンプ）のみ書き込み、状態遷移（通知レベルのエスカレーション等）は消費側hookが所有すべき
- **Context**: StatusLine BridgeでStatusLineが`lastNotifiedLevel: "info"`を書く設計にしたところ、hook側の`=== "none"`チェックでinfo通知が到達不能になった。修正: StatusLineは常に`"none"`を書き、hookが通知後に`"info"` → `"urgent"`へエスカレーションして書き戻す。責務分離: writer = データ報告、consumer = 状態管理
- **Implication**: ファイルベースのプロセス間連携では、書き込み側と読み込み側の状態管理責務を明確に分離する。双方が同じフィールドを更新する設計は競合の原因になる
- **Confirmed**: 1回 | 2026-02-28 | compound

## エージェント特化は独立した検証ソースがある場合のみ有効

- **Learning**: エージェントの特化（専門分担）は、各エージェントが独立した検証ソースを持つ場合に有効。認知的に結合したフェーズ（テスト設計と実装など）を別エージェントに分割すると、コンテキスト共有コストが利点を上回る
- **Context**: Multi-agent研究で、Research team（Problem Space / Scout / Best Practices / Devil's Advocate）とReview team（Spec Compliance / Code Quality / Security / Devil's Advocate）は各自が独立した検証ソースを持ち並列化が有効。一方、TDDのRED-GREEN-REFACTORはテスト意図と実装が密結合しており、分割は逆効果
- **Implication**: 並列エージェントを設計する際、「各エージェントが独立に正しさを検証できるか」を判断基準にする。検証ソースが共有される場合は単一エージェントが適切
- **Confirmed**: 1回 | 2026-02-25 | design

## 因果的依存はcompliance handshakeではなくquality improvementとして設計する

- **Learning**: ワークフローステップの遵守を改善する際、テンプレートの空欄埋め（compliance handshake）ではなく、上流ステップの出力データを下流ステップの必須入力にする因果的依存構造が有効。形式遵守はもっともらしいテキストで充足できるが、因果的依存はデータ生成を要求する
- **Context**: implement.mdのScout dispatch問題で、テンプレート必須セクション方式は「チェックボックスコンプライアンス」のリスクがあり棄却。Scout findingsをPlanタスク定義の入力要件にすることで、Scoutを実行するか同等の調査を自力で行う必要がある構造にした
- **Implication**: プロンプトでステップ遵守を求める場合、「セクションを埋めよ」（形式要件）ではなく「このデータを使って次を書け」（入力要件）として設計する
- **Confirmed**: 2回 | 2026-02-27 | design, implement

## 構造化出力フォーマットはAIの裁量を制約する（anti-sycophancy）

- **Learning**: AI出力を自由記述ではなく固定カラムのテーブルや構造化テンプレートにすると、選択的省略（sycophantic elision）を構造的に防止できる。自由記述では都合の悪い項目を暗黙にスキップできるが、テーブルの空セルは目に見える
- **Context**: Understanding Checkの比較テーブル（Decision / Your Explanation / AI's Rationale / Difference）は全エントリの表示を強制する。自由記述の「フィードバック」では、Alignedな項目を長く書きMissing/Divergentを省略するsycophancyリスクがあった
- **Implication**: AIが人間に対してフィードバックや評価を返す場面では、構造化フォーマット（テーブル、固定セクション）を使い、全項目の明示を強制する
- **Confirmed**: 1回 | 2026-02-27 | implement

## Skill統合: role/typeパラメータ + ルックアップテーブル + フォールバック

- **Learning**: N個のコマンドが同じ手続きを重複して持つ場合、共有Skillに抽出しrole/typeパラメータでリソーステーブルを切り替える。未認識値に対するフォールバック（全ファイル読み込みや警告）を必ず含める
- **Context**: check-past-learnings（role→learningsファイル）とparallel-review-team（type→レビュアー構成）で同じパターンを2回適用。5-way/3-way重複をそれぞれ1箇所に統合。レビューで未認識roleのフォールバック欠如が指摘され追加
- **Implication**: 3箇所以上の手続き重複を発見したら、パラメータ化された共有Skillへの抽出を検討する。パラメータのルックアップテーブルと未認識値フォールバックはセットで実装する
- **Confirmed**: 1回 | 2026-02-27 | implement

## Opt-inステータスフィールドは「未実行」ではなく「省略」で表現する

- **Learning**: オプション機能のステータスをレポートに含める場合、未使用時は「not run」と表示するのではなくフィールド自体を省略する。「not run」表示は暗黙の guilt mechanism として機能し、本来オプションであるはずの機能を心理的に強制する
- **Context**: Understanding Checkの完了レポートへのUnderstanding Status追加で、「not run」を表示する案と「省略」する案を比較。Design Docの「罪悪感メカニズムの回避」原則に基づき省略方式を採用。未使用時はフィールドが存在しないため、レポート読者に不要なプレッシャーを与えない
- **Implication**: オプション機能のステータス表示を設計する際、デフォルト状態の表現方法に注意する。「off」「disabled」「not run」は見えないプレッシャーになりうる
- **Confirmed**: 1回 | 2026-02-27 | implement
