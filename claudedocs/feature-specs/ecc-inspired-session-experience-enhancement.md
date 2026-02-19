# FeatureSpec: ECC-Inspired Session Experience Enhancement

## Problem Statement

claude-praxisは「理解の深化」という哲学で品質ゲートと学習サイクルを構築してきたが、セッション全体を通じた**体験の滑らかさ**に課題がある。

現在の痛点：

- **コンテキスト管理が粗い**: learnings.mdは単一ファイルで、作業モード（実装/レビュー/リサーチ等）に関係なく全内容がロードされる。本当に必要な知識だけを軽量に取得する仕組みがない
- **学習の品質が不透明**: learnings.mdに蓄積された知見に信頼度の概念がない。一度書いた学習と、繰り返し確認された学習が同じ重みで扱われる
- **フレームワークの進化が手動**: code-quality-rulesの自己進化プロトコルはあるが、スキル生成やパターン抽出は人間主導。実際の開発パターンから自動でスキル候補を提案する仕組みがない
- **コンテキスト逼迫の管理が受動的**: PreCompact hookは自動トリムするが、逼迫する「前」にユーザーへの能動的な通知がない。/compactの前に/compoundで知識確保する連携もない
- **フックの可読性・テスタビリティが低い**: 全hookがBashスクリプトで、ロジックの読み取りが難しく、テストもシェルベースで保守しにくい
- **サブエージェントのコンテキスト効率が悪い**: 一度に全情報をロードするパターンで、段階的な情報取得の仕組みがない

## User Stories

**エンジニアとして**: セッション開始から終了まで、作業フェーズに応じて必要な知識が自然に手元にある体験がほしい。レビュー中に実装の学びが邪魔をしたり、リサーチ中に無関係なコンテキストでウィンドウが圧迫されたりしない状態。

**エンジニアとして**: 繰り返し正しいと確認された学びが、一度きりのメモより信頼できるものとして扱われてほしい。そして十分に成熟した学びが、自動的にスキル候補として提案されてほしい。

**エンジニアとして**: コンテキストが逼迫する前に「そろそろ整理しましょう。先に今回の学びを保存しますか？」と提案されたい。知識の確保と整理が一連の流れとして体験できること。

**プラグイン利用者として**: hooksのコードを読んで理解でき、テストを書いて品質を担保できる環境がほしい。Bashの暗黙知に頼らない、メンテナブルなコードベース。

## Scope

### In Scope

- **Contextsシステム**: 作業モード別の軽量コンテキスト注入。learningsやルールをモードに応じてフィルタリングし、必要なものだけをロードする仕組み
- **信頼度スコア付き学習**: learnings.mdの各エントリに信頼度（確認回数/最終確認日）を付与。/compound時に信頼度を更新する仕組み
- **学習内容のレベル分離**: learnings.mdの内容を3つのレベルで分類管理する。現在のlearnings.mdは全学びがフラットに並んでおり、作業フェーズとの関連が不明瞭。レベル分離により、各フェーズで関連する学びだけを参照可能にする
  - **FeatureSpecレベル**: 要件定義・スコープ判断に関する学び（例：「この種の機能はOut of Scopeにすべき」「ユーザーストーリーにはXの観点が必要」）
  - **Design Docレベル**: 設計判断・アーキテクチャに関する学び（例：「このパターンは保守コストが高い」「代替案にYを含めるべき」）
  - **Codingレベル**: 実装パターン・品質ルールに関する学び（例：「deny-by-defaultパターン」「ESMの.mjs拡張子による解決」）
- **スキル自動生成**: 信頼度が閾値を超えた学習や、繰り返し検出されるパターンからスキル候補を自動提案する仕組み（/compoundまたは専用コマンドから起動）
- **Strategic Compact + Proactive Compound**: コンテキスト逼迫の事前検知と/compact提案。提案時に/compoundを先行実行するよう連携提案
- **Node.js移行**: 全hookをBashからNode.jsに移行。テストフレームワークをvitestに統一
- **Iterative Retrieval Pattern**: サブエージェントが段階的に情報を取得するパターン。subagent-driven-developmentスキルへの統合

### Out of Scope

- **ECCのドメイン特化スキル（Django, Spring Boot等）の移植**: CPの哲学はプロセス特化。言語固有パターンは個別プロジェクトの責務
- **ECCのマルチエージェントオーケストレーションコマンド（/multi-plan, /pm2等）**: CPのsubagent-driven-developmentとagent-team-executionで対応済み
- **instinctsの完全再現**: ECCのinstinctシステム全体（import/export/evolve）ではなく、信頼度スコアの概念だけを取り入れる
- **learnings.mdの分割（モード別ファイル化）**: Contextsシステムはフィルタリングで対応し、ファイル分割は将来の検討事項

## Purpose

セッション全体のライフサイクルを通じて、エンジニアの作業体験が向上すること。

成功の指標：

- **コンテキスト効率**: 作業モードに無関係な情報がロードされない。コンテキストウィンドウの消費が現在より改善
- **学習の成熟**: 信頼度スコアにより、蓄積された学びの品質が可視化される。成熟した学びからスキル候補が自然に生成される
- **知識の保全**: /compact前に/compoundが提案され、コンテキスト喪失前に知識が確保される
- **コードベースの保守性**: hookがNode.jsで読みやすく、vitestでテスト可能
- **サブエージェントの効率**: 段階的取得により、不要なコンテキストロードが減少

## Risks

- **コンテキストウィンドウ圧迫**: 新しい仕組み自体がコンテキストを消費する矛盾。既知の課題（~65KB → ~45KB目標）と衝突する可能性。Contextsシステムは「軽量化」が目的なので、設計次第で逆効果にならないよう注意が必要
- **Node.js移行の互換性**: 既存のBash hookとの動作差異。移行中に品質ゲートが一時的に弱くなるリスク
- **信頼度スコアのオーバーヘッド**: /compound時の信頼度更新が/compoundのフローを複雑にする可能性
- **スキル自動生成の品質**: 自動提案されたスキルが的外れだと、ノイズが増える。人間承認ゲートは必須だが、提案自体の品質担保が課題
- **6概念の相互依存**: 一度に全部実装すると複雑。段階的に実装可能な設計が必要

## Implementation Roadmap

各概念は以下の順序で段階的に実装する。前段が後段の基盤となる依存関係を反映している。

| # | 概念 | 依存関係 | Design Doc |
|---|------|---------|------------|
| 1 | **Node.js移行** | なし（基盤） | `01-nodejs-hook-migration.md` |
| 2 | **Contextsシステム** | #1（hookインフラ上に構築） | `02-contexts-system.md` |
| 3 | **信頼度スコア付き学習** | #2（コンテキストフィルタリングと連携） | `03-confidence-scored-learning.md` |
| 4 | **Strategic Compact + Proactive Compound** | #3（学習システムと連動して知識保全） | `04-strategic-compact-proactive-compound.md` |
| 5 | **Iterative Retrieval Pattern** | #2（コンテキスト効率化の上に構築） | `05-iterative-retrieval-pattern.md` |
| 6 | **スキル自動生成** | #3（信頼度が成熟した学習からスキル候補を生成） | `06-skill-auto-generation.md` |

**順序の根拠**:

- **#1 Node.js移行**が最初：全hookの実装言語を変える基盤作業。後続の全概念がNode.jsベースで実装される
- **#2 Contextsシステム**が次：モード別コンテキスト注入は、学習フィルタリング（#3）やサブエージェント効率化（#5）の前提
- **#3 信頼度スコア付き学習**：Contextsでフィルタリングされた学習に信頼度を付与。#4のCompound連動と#6のスキル自動生成の両方が依存
- **#4 Strategic Compact + Proactive Compound**：信頼度を持つ学習システムと連動し、/compact前の/compoundで知識の質まで考慮した保全が可能に
- **#5 Iterative Retrieval Pattern**：Contextsシステムのフィルタリング機構を活用し、サブエージェントへの段階的注入を実現
- **#6 スキル自動生成**が最後：信頼度が十分に蓄積された学習からスキル候補を生成。学習システム全体が成熟してから初めて意味を持つ

## References

- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) — Continuous Learning v2, Contexts, Strategic Compact, Iterative Retrieval
- [Zenn解説記事](https://zenn.dev/tmasuyama1114/articles/everything-claude-code-concepts) — ECCのコア設計思想
- 既存のUX改善ロードマップ（learnings.md） — PostToolUse async lint, rules/ディレクトリ等の既存計画との整合
- 既存の課題: instruction volume ~65KB → ~45KB目標（learnings.md「Framework improvements tracked in design doc」）
