# Contexts System

## Overview

claude-praxisの学習資産（learnings.md）は現在モノリシックな単一ファイルで、作業フェーズに関係なく全内容が等しく扱われる。Contextsシステムは、蓄積された学びをレベル別ファイルに分離し、作業フェーズに応じて必要なファイルだけを読み込む仕組みである。コンテキストウィンドウの効率化と、学びの再利用精度を同時に向上させることが目的である。

## Context and Scope

claude-praxisには8つの作業フェーズがある（feature-spec、design、implement、debug、research、plan、review、compound）。各フェーズは異なる種類の知識を必要とする。要件定義中に実装パターンの学びは不要であり、デバッグ中にスコープ判断の学びは邪魔になる。

しかし現在のlearnings.mdはフラットなリストである。23のエントリが作業フェーズとの関連性の区別なく並んでおり、どのフェーズでも全エントリが読み込み対象になる。Claude CodeのRead toolはファイル単位で動作するため、単一ファイルを読んだ時点でコンテキストウィンドウに全内容が載る。セクション構造やメンタルフィルタリングでは、この物理的なコンテキスト消費を削減できない。

加えて、claude-praxisのinstruction volume（~65KB）をターゲットの~45KBに近づけるという既存の課題がある。学びの読み込みをファイル単位で制御することで、この目標に貢献する。

FeatureSpecでは学習内容を3レベルに分類することが定義されている：

- **FeatureSpecレベル**: 要件定義・スコープ判断に関する学び（例：「この種の機能はOut of Scopeにすべき」）
- **Design Docレベル**: 設計判断・アーキテクチャに関する学び（例：「このパターンは保守コストが高い」）
- **Codingレベル**: 実装パターン・品質ルールに関する学び（例：「deny-by-defaultパターン」）

このレベル分類をフェーズと紐づけ、ファイル単位で物理的に分離することで、「いま必要な学びだけをコンテキストに載せる」体験を実現する。

既存インフラとの関係として、Node.js移行済みのhookシステム（session-start.ts、context-files.ts等）の上に構築する。UserPromptSubmit hookによるフェーズ検出も既に稼働しており、Contextsシステムはこれらの基盤を活用する。

## Goals / Non-Goals

### Goals

- learnings.mdを3つのレベル別ファイルに分割し、Read toolのファイル単位動作を活かしたコンテキスト削減を実現する
- 作業フェーズごとに参照すべきファイルを定義し、フェーズに応じた選択的読み込みを可能にする
- `/claude-praxis:compound` でFlow→Stock昇格時にレベル分類を行う仕組みを組み込む
- `/claude-praxis:compound` に学習圧縮ステップを追加し、重複排除・陳腐化削除・類似統合を行う
- 既存の「Write Auto, Read Manual」原則を維持する（自動注入ではなく、選択的読み込み）
- SessionStartの通知にレベル別ファイルのメタデータを含め、Claudeの読み込み判断を支援する

### Non-Goals

- 信頼度スコアの導入（#3 信頼度スコア付き学習の責務）
- 自動注入の導入（Iron Lawを破らない）
- フェーズ検出機構の変更（既存のUserPromptSubmit hookはそのまま活用）
- コンテキストウィンドウ使用量の計測・監視（#4 Strategic Compactの責務）
- global-learnings.mdのレベル分割（クロスプロジェクト学習は単一ファイルを維持。プロジェクト固有の学習のみ分割対象）

## Proposal

### レベル別ファイル分割

learnings.mdを3つのレベル別ファイルに分割する。

```
{repo}/.claude/context/
├── learnings-feature-spec.md   ← 要件定義・スコープ判断の学び
├── learnings-design.md         ← 設計判断・アーキテクチャの学び
└── learnings-coding.md         ← 実装パターン・品質ルールの学び
```

ファイル分割を採用する理由は、Claude CodeのRead toolがファイル単位で動作するためである。単一ファイル内のセクション構造では、読み込んだ時点で全セクションがコンテキストに載る。ファイルを分けることで、フェーズに無関係な学びが物理的にコンテキストに入らない。これはContextsシステムの本来の目的（不要なコンテキストを載せない）を直接実現する。

レベルが3つである根拠は、claude-praxisのワークフロー構造に由来する。FeatureSpec→Design Doc→Implementation（Coding）という3フェーズの流れがあり、各フェーズで蓄積される知識の性質が異なる。要件判断の学び（「このスコープは広すぎた」）と設計判断の学び（「CQRSは保守コストが高い」）と実装パターンの学び（「deny-by-default」）は、再利用される文脈が異なる。

複数レベルに該当する学びが存在する場合は、最も影響の大きいレベルに1箇所だけ配置する。重複配置はStock（永続知識）のインフレを招き、Contextsシステムが解決しようとする問題を悪化させる。

### フェーズとレベルのマッピング

作業フェーズごとに、読み込むべきファイルを定義する。

| フェーズ | 読み込むファイル | 根拠 |
|---------|----------------|------|
| feature-spec | learnings-feature-spec.md | 要件定義にはスコープ判断の学びが必要 |
| design | learnings-feature-spec.md + learnings-design.md | 設計判断には要件の背景と設計パターンの両方が必要 |
| implement | learnings-design.md + learnings-coding.md | 実装には設計判断の理解と実装パターンが必要 |
| debug | learnings-coding.md | デバッグには実装パターンと品質ルールの知識が必要 |
| review | learnings-design.md + learnings-coding.md | レビューには設計意図と実装基準の両方が必要 |
| research | 全ファイル | リサーチは探索的で、どのレベルの学びも関連しうる |
| plan | learnings-design.md + learnings-coding.md | 計画には設計判断と実装見積もりの知識が必要 |
| compound | 全ファイル | キュレーションは全学びを対象とする |

このマッピングはハードコードではなく、設定として定義する。フェーズの追加や学びの性質の変化に応じて調整可能にするためである。

### 学習圧縮: /compoundの圧縮ステップ

/compoundにFlow→Stock昇格のレベル分類に加えて、既存Stockの圧縮ステップを追加する。人間の記憶の定着プロセス（回想→整理→圧縮）と同じ仕組みで、学びの品質を維持する。

圧縮は3つの操作で構成される：

- **重複排除**: 同じ知見を異なる文脈で記録したエントリを統合する。例: 「deny-by-defaultパターンが重要」と「エラー時はexit 2で拒否」は同一パターンの異なる表現であり、1つのエントリに統合できる
- **陳腐化削除**: プロジェクトの進化により不要になった学びを削除する。例: Bash hookの学びはNode.js移行完了後に不要になる
- **類似統合**: 共通の原則を持つ複数の学びを、より抽象的な1つの学びに昇華する。例: 「マーカーファイルで状態管理」「env var overrideでテスト分離」「exit 2でdeny-by-default」→「hookインフラは機械的な状態検証に徹する」

圧縮の判断は人間が行う。/compoundの提案テーブルに「圧縮候補」カラムを追加し、統合・削除・昇華の提案をClaudeが行い、人間が承認する。自動圧縮は誤削除のリスクがあるため採用しない。

この圧縮ステップにより、学びファイルは時間と共に「量が増える」のではなく「密度が上がる」方向に進化する。ファイルサイズの肥大化を防ぎつつ、各エントリの再利用価値を高める。

### 統合: 既存インフラへの組み込み

Contextsシステムは3つの接点で既存インフラに組み込まれる。

**SessionStart通知の拡張**: session-start.tsが出力するpersistence metadataに3つのlearningsファイルを個別に通知する。現在は`learnings.md (updated: 2026-02-19 10:38)`のような通知だが、`learnings-feature-spec.md (3 entries, updated: ...)` / `learnings-design.md (8 entries, updated: ...)` / `learnings-coding.md (12 entries, updated: ...)`のようにファイル別の情報を伝える。Claudeはこの情報とUserPromptSubmitで検出されたフェーズを組み合わせて、必要なファイルだけを読む。

この統合は「Write Auto, Read Manual」原則を維持する。SessionStartはメタデータ（件数と日時）のみを通知し、学びの内容は注入しない。Claudeが自身の判断で必要なファイルだけを読む。

**Command Phase 0の効率化**: 各コマンドの「Check Past Learnings」フェーズで、フェーズに対応するファイルだけを読む指示に更新する。現在は「learnings.mdを読む」だが、「implementフェーズではlearnings-design.mdとlearnings-coding.mdを読む」と具体化する。不要なファイルはRead toolで開かないため、コンテキストに載らない。

**/compound の拡張**: 2つのステップを追加する。(1) Flow→Stock昇格時にレベルを判定し、対応するファイルに書き込む。(2) 既存Stockの圧縮（重複排除・陳腐化削除・類似統合）を提案し、人間の承認を得て実行する。

### context-files.tsの拡張

context-files.tsの`detectPersistenceFiles`関数の追跡対象に3つのlearningsファイルを追加する。各ファイルのエントリ数（h2セクション数）をカウントし、PersistenceFileInfoとして返す。session-start.tsはこの情報をadditionalContextに含める。

旧learnings.mdが存在する場合は後方互換として従来通り通知する。移行完了後に旧ファイルの追跡を削除する。

### フェーズ-レベルマッピングの配置

フェーズとファイルの対応関係は、hookインフラ内にTypeScriptの定数として定義する。

hookインフラに置く理由は、フェーズ検出（UserPromptSubmit）と永続化ファイル検出（context-files.ts）が既にhook層に存在するためである。Contextsシステムの設定もこの層に集約することで、フェーズに関する知識が分散しない。

コマンド側（commands/*.md）はマッピングを直接参照するのではなく、コマンド内の指示文でフェーズに対応するファイル名を明示する。hookが動的にマッピングを適用するのではなく、コマンドの静的な指示としてファイル名を記述する。これは「hookは通知、コマンドは指示」という既存の責務分離を維持するためである。

```mermaid
graph TD
    A[SessionStart hook] -->|per-file metadata: entries, mtime| B[additionalContext]
    C[UserPromptSubmit hook] -->|detected phase| D[additionalContext]
    B --> E[Claude decides which files to read]
    D --> E
    E -->|reads only relevant files| F[learnings-feature-spec.md]
    E -->|reads only relevant files| G[learnings-design.md]
    E -->|reads only relevant files| H[learnings-coding.md]
    I[/compound command] -->|promotes with level + compresses| F
    I -->|promotes with level + compresses| G
    I -->|promotes with level + compresses| H
    J[Command Phase 0] -->|specifies which files to read| E
```

## Alternatives Considered

### Alternative: 単一ファイル + セクション構造

learnings.mdをファイル分割せず、3つのh2セクション（FeatureSpec / Design Doc / Coding）で構造化する。

| Aspect | Detail |
|--------|--------|
| How it works | learnings.md内にレベル別h2セクションを設け、各学びをh3エントリとして配置。SessionStartはセクション別エントリ数を通知。コマンドは「該当セクションだけを読め」と指示 |
| Why Proposal is preferred over this | Claude CodeのRead toolはファイル単位で動作する。単一ファイルを読んだ時点で全セクションがコンテキストに載るため、セクション構造だけではコンテキスト削減を実現できない。ファイル分割なら不要なファイルを物理的に開かないため、コンテキスト消費をゼロにできる |
| When to reconsider this alternative | Read toolにセクション単位の部分読み込み機能が追加された場合。または、learningsファイルが極めて小さく（各10行以下）、ファイル管理コストが読み込みコストを上回る場合 |

### Alternative: タグベースの自由分類

各学びエントリに自由形式のドメインタグ（例: `[coding, testing, security]`）を付与し、フェーズごとに関連タグのセットを定義してフィルタリングする。

| Aspect | Detail |
|--------|--------|
| How it works | 学びエントリのヘッダーにタグを付与（`## deny-by-default [coding, security]`）。フェーズごとにタグの優先度マッピングを定義し、マッチするエントリを返す |
| Why Proposal is preferred over this | タグの粒度管理が必要になる。タグが増えるほど分類判断のコストが上がり、/compound時のオーバーヘッドが大きくなる。claude-praxisの現在の学びエントリ数（23件）と成長速度を考えると、3レベルの分類で十分な精度が得られる。さらに、タグベースでもファイル単位の物理分離問題は解決しない（単一ファイル内のタグ検索は全件読み込みが前提） |
| When to reconsider this alternative | 学びエントリが100件を超え、3レベルではフィルタリング精度が不足する場合。かつ、ファイル分割と組み合わせる場合（タグをファイル内サブフィルタとして使う） |

### Alternative: コマンド側の指示変更のみ（インフラ変更なし）

hookやcontext-files.tsを変更せず、各コマンドのPhase 0の指示文だけを更新して「このフェーズに関連する学びだけを読め」と記述する。

| Aspect | Detail |
|--------|--------|
| How it works | commands/*.mdのPhase 0を「learnings.mdのうち、implementフェーズに関連するエントリ（実装パターン、品質ルール等）だけを読め」と書き換える。learnings.mdのフォーマット変更なし |
| Why Proposal is preferred over this | learnings.mdにフィルタリング構造がないと、Claudeはファイル全体を読んだ上で関連性を判断する必要がある。結果としてコンテキストウィンドウの消費は変わらない。ファイル分割なら不要なファイルを開かないため物理的に削減できる |
| When to reconsider this alternative | hookインフラへの変更コストが許容できない場合。または、learnings.mdのエントリ数が非常に少なく（10件以下）、全件読み込みでもコンテキスト消費が無視できる場合 |

## Cross-Cutting Concerns

### Observability

learningsファイルが存在しない場合やフォーマットが不正な場合、context-files.tsはそのファイルをスキップし、存在するファイルのメタデータのみを返す。エラーが発生してもSessionStart自体はブロックしない（deny-by-defaultの対象外。メタデータの精度低下は許容できるが、セッション開始の失敗は許容できない）。

## Concerns

- **移行コスト**: 既存の23エントリの分類は手動判断が必要。自動分類は信頼性が低く、誤分類はContextsシステムの価値を損なう。初回は/compoundセッションで人間が分類する。移行中は旧learnings.mdと新3ファイルが共存するが、context-files.tsが両方を追跡するため段階的移行が可能
- **レベル境界の曖昧さ**: 「deny-by-defaultパターン」は設計判断でもあり実装パターンでもある。複数レベルに該当する学びの配置先に迷うケースがある。対策として「最も影響の大きいレベルに配置」の原則を設け、/compoundの分類ステップで人間が判断する
- **ファイル管理の複雑性**: 3ファイルへの分割により/compoundのルーティング先が増える。ただし/compoundは既にproject learnings / global learnings / code-quality-rules / discardの4択を提示しており、project learningsの下位分類として3レベルを追加する形になるため、フローの構造変化は限定的
- **圧縮の判断基準**: /compound時の圧縮（重複排除・陳腐化・統合）は人間判断に依存する。Claudeが提案し人間が承認するフローだが、提案の質が低いと圧縮が形骸化する。対策として、圧縮候補の提案には「なぜこの統合が妥当か」の理由を必須とする
- **フェーズ-レベルマッピングの妥当性**: 初期マッピングが実際の利用パターンと合わない可能性がある。マッピングは設定として定義するため調整可能だが、調整の判断基準が明確でない。数セッション使用した後にマッピングの妥当性を/compoundで振り返る

## Review Checklist

- [ ] 3つのlearningsファイルのフォーマットが明確であること
- [ ] フェーズ-レベルマッピングが全8フェーズをカバーしていること
- [ ] context-files.tsの変更がSessionStartの動作を壊さないこと（後方互換含む）
- [ ] /compoundのレベル分類 + 圧縮ステップが既存の昇格フローに自然に統合されること
- [ ] 「Write Auto, Read Manual」原則が維持されていること（自動注入なし）
- [ ] 旧learnings.mdからの移行パスが明確であること
- [ ] 圧縮ステップの提案フォーマットが定義されていること
