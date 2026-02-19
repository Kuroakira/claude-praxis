# Node.js Hook Migration

## Overview

claude-praxisの全hookスクリプトをBashからTypeScriptに移行し、ビルド済みJavaScriptをプラグインと一緒に配布する。テストフレームワークはvitestに統一する。型安全性・可読性・テスタビリティ・クロスプラットフォーム対応を改善するための基盤作業であり、後続の機能追加（Contextsシステム、Strategic Compact等）がTypeScriptベースで実装される前提を整える。

## Context and Scope

claude-praxisは現在6つのBash hookスクリプトでセッションライフサイクルを制御している。これらのhookはJSON入力の解析にpython3サブプロセスを起動し、ファイル操作にsed/grep/headを使い、ハッシュ生成にmd5/md5sumの分岐を持つ。

この構造には3つの課題がある。

第一に、**可読性が低い**。Bashスクリプト内でpython3ワンライナーを呼び出すパターンは、ロジックの追跡が困難になる。JSON解析→条件分岐→ファイルI/O→JSON出力という流れが、異なる言語とシェルコマンドの混在で表現されている。

第二に、**テスタビリティが低い**。現在のテストは独自のassert関数を持つBashスクリプトで、テスト実行にはプロセス起動（パイプ + bash）が必要になる。個々のロジック（ファイル拡張子判定、マーカー管理）を単体テストする手段がない。

第三に、**プラットフォーム依存がある**。`stat -f '%Sm'`（macOS）/ `stat -c '%y'`（Linux）の分岐、`md5 -q` / `md5sum`の分岐など、OS差異を手動で吸収している。Windowsには対応できない。

TypeScriptに移行することで、Claude Codeのhook入出力JSON構造に型定義を与えて安全性を高め、JSON.parse()でネイティブにJSONを処理し、fs/crypto/pathモジュールでクロスプラットフォームなファイル操作を行い、関数をexportしてvitestで直接テストできるようになる。ビルド済みJavaScriptをリポジトリに含めて配布することで、エンドユーザーはビルドステップなしでプラグインを利用できる。

### 現在のhook構成

| Hook | イベント | 現在のスクリプト | 役割 |
|------|---------|----------------|------|
| Session Start | SessionStart | session-start.sh | getting-startedスキル注入 + マーカー削除 + 永続化ファイル通知 |
| Skill Gate | PreToolUse (Edit\|Write\|MultiEdit) | check-skill-gate.sh | ファイル種別に応じたスキルゲート（deny-by-default） |
| Skill Marker | PostToolUse (Skill) | mark-skill-invoked.sh | スキル呼び出し記録（マーカーファイル追記） |
| Stop Gate | Stop | stop-verification-gate.sh | コードセッションの検証完了チェック |
| Task Gate | TaskCompleted | task-completed-gate.sh | タスク完了前の検証サイクル強制 |
| Pre-Compact | PreCompact | pre-compact.sh | Flow fileのトリミングとタイムスタンプ更新 |

UserPromptSubmitは`type: "prompt"`（LLM呼び出し）であり、コマンドhookではないため移行対象外。

## Goals / Non-Goals

### Goals

- 全6つのcommand hookスクリプトをBashからTypeScript（.ts）に移行する
- ビルド済みJavaScript（.mjs）をリポジトリに含め、プラグインと一緒に配布する
- テストをvitest（.test.ts）に移行し、hookロジックを関数単位でテスト可能にする
- Claude Codeのhook入出力に型定義を与え、JSON構造の安全性を担保する
- 既存の全動作（deny-by-default、マーカー管理、サイドエフェクト）を完全に保持する
- hooks.jsonのcommandを`node`実行（ビルド済み.mjsを指定）に更新する
- python3サブプロセス依存を排除する

### Non-Goals

- hookの動作変更や新機能追加（この移行は純粋なリライト）
- `type: "prompt"`のUserPromptSubmit hookの変更
- 新しいhookイベント（SessionEnd, SubagentStart等）の追加
- tsxやts-nodeなどのTypeScriptランタイム依存（ビルド済みJSを配布するため不要）

## Proposal

### アーキテクチャ: モジュラー構造

hookスクリプトを「エントリポイント」と「ライブラリ」に分離し、TypeScriptソースとビルド済みJavaScriptの両方をリポジトリに含める。エントリポイントはstdinからJSON入力を読み取り、ライブラリ関数を呼び出し、結果をstdoutに出力する薄いラッパーになる。ビジネスロジックはライブラリに集約され、vitestで直接importしてテストできる。

この分離を採用する理由は、現在のBash hookが「入力解析 + ロジック + 出力」を1ファイルに混在させており、テストにプロセス起動が必要になっている点を解決するためである。ロジックを関数としてexportすれば、プロセスを起動せずにテストでき、テストの速度と信頼性が向上する。

TypeScriptを採用する理由は、Claude Codeのhook入出力が明確なJSON構造を持っているためである。session_id、tool_name、tool_input、permission_modeなど14イベントのスキーマに型定義を与えることで、JSONフィールドの参照ミスやプロパティ名のtypoをコンパイル時に検出できる。hookのロジックは各50-90行と小さいが、JSON構造のパース・分岐が中心であり、型の恩恵は大きい。

```
hooks/
├── hooks.json                    # hook設定（dist/の.mjsを指定）
├── src/                          # TypeScriptソース（開発者が編集）
│   ├── session-start.ts          # エントリポイント
│   ├── check-skill-gate.ts       # エントリポイント
│   ├── mark-skill-invoked.ts     # エントリポイント
│   ├── stop-verification-gate.ts # エントリポイント
│   ├── task-completed-gate.ts    # エントリポイント
│   ├── pre-compact.ts            # エントリポイント
│   └── lib/
│       ├── types.ts              # hook入出力の型定義
│       ├── io.ts                 # stdin読み取り、JSON出力ヘルパー
│       ├── markers.ts            # マーカーファイルCRUD
│       ├── file-type.ts          # 拡張子→ファイル種別判定
│       └── context-files.ts      # 永続化ファイル検出・メタデータ取得
├── dist/                         # ビルド済みJS（リポジトリにコミット、エンドユーザーが実行）
│   ├── session-start.mjs
│   ├── check-skill-gate.mjs
│   ├── ...
│   └── lib/
│       ├── io.mjs
│       └── ...
├── tsconfig.json                 # TypeScriptコンパイラ設定
└── package.json                  # vitest + typescript依存
```

ビルド出力をESM（`.mjs`）にする理由は、Node.jsのネイティブモジュールシステムであり、実行時にpackage.jsonの`"type": "module"`設定に依存しないためである。.mjsなら拡張子だけでESMとして認識される。ビルド済みファイルをリポジトリにコミットすることで、エンドユーザーは`git clone`（またはプラグインインストール）だけでhookを使える。ビルドステップは開発者のみが実行する。

### エントリポイントのパターン

各エントリポイントは同じ構造に従う。

**Conceptual** — illustrates the approach, not the final implementation.

```typescript
import { readStdin, writeJson, exitDeny } from './lib/io.js';
import { checkSkillGate } from './lib/skill-gate-logic.js';
import type { PreToolUseInput } from './lib/types.js';

const input = await readStdin<PreToolUseInput>();
const result = checkSkillGate(input);

if (result.deny) {
  exitDeny(result.reason);
} else {
  writeJson(result.output);
}
```

stdin読み取り→ロジック呼び出し→出力の3行構造。ジェネリック型パラメータでhookイベントごとの入力型を指定でき、存在しないフィールドへのアクセスがコンパイル時にエラーになる。ロジック関数（`checkSkillGate`）はpure functionに近く、ファイルI/O以外の副作用を持たない。

### ライブラリの責務分割

**types.ts**: Claude Codeの全hookイベント入出力の型定義を集約する。SessionStartInput、PreToolUseInput、StopInput等の型と、各hookの出力型（PermissionDecision、HookSpecificOutput等）を定義する。hookごとに異なるJSON構造を型で表現することで、フィールド参照の安全性を担保する。

**io.ts**: stdinをバッファリングしてJSON.parseする関数、JSON出力をstdoutに書く関数、exit 2 + stderrで拒否する関数を提供する。readStdinはジェネリック型パラメータを受け取り、パース結果に適切な型を付与する。全エントリポイントがこれを共有する。

**markers.ts**: マーカーファイルの読み書き・存在チェック・削除を担当する。マーカーディレクトリのパス（`/tmp/claude-praxis-markers`）を定数として持ち、全マーカー操作を一箇所に集約する。現在6つのhookに散在している`mkdir -p` / `touch` / `echo >>` / `grep -q` / `rm -f`パターンを統一する。

**file-type.ts**: ファイルパスから拡張子を取得し、code/document/config/unknownに分類する関数を提供する。check-skill-gate.shの巨大なcase文をデータ駆動のマッピングに置き換える。

**context-files.ts**: 永続化ファイル（task_plan.md, progress.md, learnings.md, global-learnings.md）の存在チェック・メタデータ（更新日時、エントリ数）取得を担当する。session-start.shのファイル検出ロジックを分離する。Node.jsの`fs.statSync().mtime`でクロスプラットフォーム対応。

### hooks.jsonの変更

`$CLAUDE_PLUGIN_ROOT`環境変数を使ったパス指定に移行する。Claude Code公式ドキュメントが推奨するプラグイン向けの参照方法であり、プラグインのインストール先に依存しないパス解決が可能になる。

**Conceptual** — hooks.jsonの変更パターン。

```json
{
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/dist/session-start.mjs\""
}
```

hooks.jsonはビルド済みの`dist/`ディレクトリを参照する。エンドユーザーの実行時にTypeScriptコンパイラは不要。

### テスト戦略

テストを2層に分ける。

**ユニットテスト**（vitest）: ライブラリ関数を直接importしてテスト。ファイルI/Oはtmpディレクトリを使う実ファイルテスト（モックではなく）。JSON解析、ファイル種別判定、マーカー操作のロジックを網羅する。

**統合テスト**（vitest + child_process）: エントリポイントスクリプトをchild_process.execSyncでプロセス起動し、stdin→stdout/stderrのパイプラインをテスト。現在のBashテストが検証している「exit code + 出力内容」をそのまま移行する。

ユニットテストがロジックの正確性を担保し、統合テストがhook実行パイプライン全体の動作を担保する。この分離により、ロジック変更時はユニットテストだけで高速にフィードバックが得られ、パイプライン変更時のみ統合テストが必要になる。

```
tests/
├── unit/
│   ├── io.test.ts
│   ├── markers.test.ts
│   ├── file-type.test.ts
│   └── context-files.test.ts
└── integration/
    ├── session-start.test.ts
    ├── check-skill-gate.test.ts
    ├── mark-skill-invoked.test.ts
    ├── stop-verification-gate.test.ts
    ├── task-completed-gate.test.ts
    └── pre-compact.test.ts
```

vitestはTypeScriptをネイティブサポートしているため、テストファイルも.tsで記述できる。vitest設定はプロジェクトルートの`vitest.config.ts`に置く。package.jsonはvitest + typescript依存の管理のためにルートに配置し、`"private": true`を設定してnpmパッケージとして公開されないようにする。

### 移行順序

hookの複雑さと依存関係に基づいて段階的に移行する。各ステップで統合テストが通ることを確認してから次に進む。

1. **mark-skill-invoked**（最も単純: stdin→パース→ファイル追記）
2. **task-completed-gate**（ハッシュ生成 + マーカーチェック）
3. **stop-verification-gate**（2つのマーカーチェック）
4. **check-skill-gate**（最も複雑: ファイル種別判定 + deny-by-default + サイドエフェクト）
5. **pre-compact**（ファイル操作: トリミング + タイムスタンプ更新）
6. **session-start**（最も大きい: スキル読み込み + ファイル検出 + JSON出力）

この順序の根拠は、単純なhookで移行パターンを確立し、ライブラリ（io.mjs, markers.mjs）を先に構築したうえで、複雑なhookが既存ライブラリを活用できるようにすることにある。

### 動作保証の原則

移行は「動作の完全保持」を原則とする。具体的には：

- deny-by-defaultパターンを維持する。JSONパース失敗やフィールド欠損時はprocess.exit(2) + stderrメッセージ
- マーカーファイルのパス・フォーマット・ライフサイクルを変更しない
- check-skill-gateのcode-sessionマーカー書き込み（サイドエフェクト）を維持する
- 全hookの出力JSON構造を変更しない
- 既存のBashテストが検証している全ケースを統合テストでカバーする

## Alternatives Considered

### Alternative: Plain Node.js（.mjs）移行

TypeScriptを使わず、plain JavaScriptの.mjsファイルで直接記述する。

| Aspect | Detail |
|--------|--------|
| How it works | hookスクリプトを.mjsで直接記述する。ビルドステップなし、package.jsonに`"type": "module"`不要 |
| Why Proposal is preferred over this | Claude Codeのhook入出力は14イベントにわたる明確なJSON構造を持っており、型定義の恩恵が大きい。session_id、tool_name、tool_input等のフィールド参照ミスをコンパイル時に検出できる。また後続の機能追加（Contextsシステム等）で型が複雑化する見込みがあり、初期から型安全を確保しておくことでリファクタリングの安全性も向上する。ビルド済みJSを配布することで、エンドユーザーへの影響はゼロ |
| When to reconsider this alternative | ビルドステップの保守コストが型安全性の恩恵を上回る場合。または開発者チームが極端に小規模でTypeScriptのオーバーヘッドが負担になる場合 |

### Alternative: Bash維持 + テスト改善のみ

Bashスクリプトを維持し、テストフレームワークだけをbats-coreに移行する。

| Aspect | Detail |
|--------|--------|
| How it works | bats-core（Bash Automated Testing System）でBashテストを構造化する。hookスクリプト自体は変更しない |
| Why Proposal is preferred over this | 可読性の問題（python3ワンライナー、sedパターン）が解決しない。クロスプラットフォーム対応ができない。後続の機能追加（Contextsシステム等）で同じ問題が再発する。bats-coreは関数単体テストに対応しておらず、プロセス起動テストのみ |
| When to reconsider this alternative | Node.jsランタイムの可用性が問題になる環境（組み込みシステム等）でプラグインを使用する場合 |

### Alternative: 段階的デュアルランタイム

BashとNode.jsを長期間共存させ、新規hookのみNode.jsで書く。

| Aspect | Detail |
|--------|--------|
| How it works | 既存hookはBashのまま、新機能（Strategic Compact等）をNode.jsで追加する。既存hookは「壊れたら移行」方針 |
| Why Proposal is preferred over this | 二言語の保守コストが継続する。ライブラリ（markers.mjs等）がNode.jsで構築されても、既存BashからはNode.jsライブラリを呼べない。共通ロジックが二重に存在し続ける |
| When to reconsider this alternative | 移行にかけるまとまった時間が確保できず、新機能追加が先行する必要がある場合 |

## Concerns

- **Node.jsランタイム依存**: Claude Codeを使用する環境にNode.jsがインストールされている前提。ただしClaude Code自体がNode.jsベースであるため、この前提は現実的。README/プラグイン説明に明記する
- **プロセス起動コスト**: BashよりNode.jsのプロセス起動が遅い可能性がある。ただし各hookは単純な同期処理（ファイルI/O + JSON操作）であり、起動後の処理時間は短い。実測で問題があれば最適化を検討する
- **ビルド済みファイルの同期**: src/を編集した後にビルドを忘れるとdist/が古いまま配布される。対策: `npm run build`をpre-commitフックやCIで自動実行し、dist/の同期を担保する。また、dist/の変更が含まれないPRを検知する仕組みも検討する
- **package.jsonとプラグインシステムの干渉**: vitest + TypeScript依存のためにpackage.jsonをルートに配置する必要がある。`"private": true`で意図しないnpm publishを防ぎ、プラグインシステムとの干渉を回避する。plugin.jsonとの共存は問題ないことを移行初期に検証する
- **移行中の品質ゲート低下**: 一つのhookを移行する間、そのhookの旧Bashテストが通らなくなる。対策: 各hookの移行を1コミットで完結させ、移行前にBashテスト通過を確認し、移行後にvitestテスト通過を確認してからBashテストを削除する

## Review Checklist

- [ ] 全6 hookの動作がBash版と同一であること（統合テストで検証）
- [ ] deny-by-defaultパターンが維持されていること
- [ ] マーカーファイルのパス・フォーマットが変更されていないこと
- [ ] hooks.jsonの更新がClaude Codeプラグインシステムで正常動作すること
- [ ] vitestユニットテスト + 統合テストの両方が通ること
- [ ] TypeScriptのstrictモードでコンパイルエラーがないこと
- [ ] dist/のビルド済みファイルがリポジトリにコミットされていること
- [ ] python3サブプロセス依存が完全に排除されていること
- [ ] クロスプラットフォーム対応（macOS/Linux、stat/md5の差異解消）が実現していること
