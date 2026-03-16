# TypeScript PR Review Insights from Top Committers

収集日: 2026-03-16
目的: 著名なTypeScriptコミッターのPRレビュー指摘パターンを抽出し、コードレビューに活用する

---

## 1. TanStack/query — @TkDodo (Dominik Dorfmeister)

### レビュー傾向
TkDodoのレビューは**型推論の正確性**と**既存ユーティリティの再利用**に強くフォーカスしている。

### 主要な指摘パターン

#### 型推論の流れを壊さない設計
> "shouldn't string be inferred here?" — [PR #9835](https://github.com/TanStack/query/pull/9835#discussion_r2649085929)
> "this assertion also shouldn't be necessary if types flow correctly" — [PR #9835](https://github.com/TanStack/query/pull/9835#discussion_r2649087915)
> "I think you need 4 type params to avoid the type assertion on the query key" — [PR #9835](https://github.com/TanStack/query/pull/9835#discussion_r2649088392)

**原則**: 型アサーションが必要な時点で型設計に問題がある。ジェネリクスのパラメータ数を適切に設定し、推論が自然に流れるようにする。

#### `any` の使用を厳しく問う
> "is `FetchQueryOptions<any, any, any, any>` really good enough here?" — [PR #8734](https://github.com/TanStack/query/pull/8734#discussion_r1989979327)

**原則**: `any` は型安全性の放棄。具体的な型パラメータを使うか、ジェネリクスで推論させる。

#### 既存ユーティリティの再利用を求める
> "we have a `replaceData` util for this that we should use here." — [PR #10101](https://github.com/TanStack/query/pull/10101#discussion_r2871076675)
> "can we just pass `this.#options` as an arg here?" — [PR #10101](https://github.com/TanStack/query/pull/10101#discussion_r2871077986)

**原則**: 既存の抽象化を活用する。同じロジックの再実装はバグの温床。

#### テストの実証性を重視
> "please show test-cases that fail on `main` while yielding correct results on your PR" — [PR #10051](https://github.com/TanStack/query/pull/10051)

**原則**: 型改善のPRでも、mainで失敗しPRで成功するテストケースがなければ意味がない。

#### オプション設計: まとめて渡す
> "also here it would make more sense to pass options as a whole" — [PR #10101](https://github.com/TanStack/query/pull/10101#discussion_r2871080939)

**原則**: オプションオブジェクトを分解して個別に渡すと、将来のオプション追加時に漏れが生じる。

---

## 2. colinhacks/zod — @colinhacks (Colin McDonnell)

### レビュー傾向
パフォーマンスへの徹底的なこだわりと、**ランタイム環境の多様性への配慮**が際立つ。

### 主要な指摘パターン

#### パフォーマンスクリティカルパスの保護
> "FYI this has been optimized down to the level of minimizing property accesses in the fast path. There are a lot of unneeded changes happening here. Make it as minimal as possible and it'll be easier for me to benchmark the performance impact." — [PR #5462](https://github.com/colinhacks/zod/pull/5462#discussion_r2596960870)

**原則**: ホットパスのコードは1行の変更でもパフォーマンスに影響する。変更は最小限に、ベンチマーク必須。

#### 不必要な複雑化への拒否
> "IIFE plus a getter? This is odd. Was there a reason to change this so dramatically instead of just dropping the condition?" — [PR #5462](https://github.com/colinhacks/zod/pull/5462#discussion_r2596964580)
> "Why change from using `cached()`?" — [PR #5462](https://github.com/colinhacks/zod/pull/5462#discussion_r2596963671)

**原則**: 既存パターンからの逸脱には明確な理由が必要。シンプルな変更で済むならそちらを選ぶ。

#### ランタイム環境の考慮
> "It's problematic that this is eagerly attempted. It'll throw a warning/error in various environments. Zod currently avoids ever using the function constructor if `z.config({ jitless: true })` has been set..." — [PR #5565](https://github.com/colinhacks/zod/pull/5565#discussion_r2644065305)

**原則**: `new Function()` のようなJIT最適化は環境依存。Cloudflare Workers等での制約を常に考慮する。

#### スキーマ変換の正確性
> "nice catch fix this. I also think you should take the result value from `retryResult`, re-stringify it, and use that as the new key. it's possible there are numeric keyType schemas that perform transforms/calculations." — [PR #5585](https://github.com/colinhacks/zod/pull/5585#discussion_r2654324602)

**原則**: スキーマがtransformを持つ場合、キーの再計算が必要。変換後の値で再構築する。

#### テストの質を厳しく問う
> "are you sure this works at runtime? add a test." — [PR #5556](https://github.com/colinhacks/zod/pull/5556#discussion_r2638123647)
> "this should be an inline snapshot so the custom error message is actually tested" — [PR #5556](https://github.com/colinhacks/zod/pull/5556#discussion_r2638777564)

**原則**: 型の変更でもランタイムテストが必要。スナップショットテストでは具体的な出力を検証する。

#### 仕様への正確な理解
> "You should never use format=time. In JSON Schema this corresponds to a 'full time' with offset or Z. There's no set of params for z.iso.time() that conform to that definition." — [PR #5557](https://github.com/colinhacks/zod/pull/5557#discussion_r2638805654)

**原則**: JSON Schemaなどの仕様を正確に理解し、仕様に準拠しない使い方を防ぐ。

#### PRスコープの厳格な管理
> "This is not an inconsistency. It's a nitpick. Look at the original issue this PR is resolving." — [PR #5556](https://github.com/colinhacks/zod/pull/5556#discussion_r2638152087)

**原則**: PRは元のissueに対するfix。無関係な修正はスコープ外。

---

## 3. trpc/trpc — @KATT (Alex Johansson)

### レビュー傾向
**依存関係の最小化**、**opt-in設計**、**テストの実証性**を重視。コードの可読性にも強い関心。

### 主要な指摘パターン

#### 依存関係ゼロ主義
> "We don't like to have dependencies, so please remove this" — [PR #6311](https://github.com/trpc/trpc/pull/6311#discussion_r1881783058)

**原則**: ライブラリは依存を最小化する。インライン実装かインポートかを慎重に判断。

#### opt-in設計の原則
> "This should be opt-in based on some setting or grabbed from context or whatever" — [PR #6311](https://github.com/trpc/trpc/pull/6311#discussion_r1881785656)

**原則**: デフォルト動作を変える新機能はopt-inにする。既存ユーザーの挙動を壊さない。

#### 内部型のexportを制限
> `@internal` アノテーションの追加を求める — [PR #6803](https://github.com/trpc/trpc/pull/6803#discussion_r2634789057)

**原則**: 内部型は `@internal` でマークし、パブリックAPIとの境界を明確にする。

#### テストの配置と網羅性
> "Not a blocker, but if you're doing unit tests, I think you can have this right next to the file you're testing" — [PR #6311](https://github.com/trpc/trpc/pull/6311#discussion_r1881784217)
> "Would also like to see some actual integration tests that leverages this" — [PR #6311](https://github.com/trpc/trpc/pull/6311#discussion_r1881784978)

**原則**: ユニットテストはソースの近くに。加えて統合テストで実際の使用パターンを検証する。

#### コードの可読性を重視
> "The code within here is... horribly hard to follow. should we split it up into less DRY operations instead?" — [PR #6311](https://github.com/trpc/trpc/pull/6311#discussion_r1894099026)

**原則**: DRYよりも可読性。過度な抽象化は理解を妨げる。分割して読みやすくする。

#### カスタム比較関数の拡張性
> "I think we should allow custom comparators here too - for instance if you use any custom data types like `Temporal.PlainDate` etc?" — [PR #6311](https://github.com/trpc/trpc/pull/6311#discussion_r1884216301)

**原則**: 比較ロジックはカスタマイズ可能にする。ユーザーが独自の型を使う可能性を考慮。

#### PRの実証を求める
> "I don't see what this PR does, seeing that the tests seemingly pass even if I revert the files changed?" — [PR #7073](https://github.com/trpc/trpc/pull/7073)

**原則**: 変更がなくてもテストが通るなら、その変更の必要性を証明するテストが足りない。

---

## 4. pmndrs/zustand & jotai — @dai-shi (Daishi Kato)

### レビュー傾向
**バンドルサイズへの意識**、**破壊的変更への慎重さ**、**`any`/`let` の排除**、**テストの本質を問う**姿勢が特徴的。

### 主要な指摘パターン

#### バンドルサイズの保護
> "This increases bundle size. We hope only type improvements without affecting the result of bundling." — [PR #3362](https://github.com/pmndrs/zustand/pull/3362#discussion_r2702190481)

**原則**: 型改善のPRがランタイムコードに影響を与えてはならない。バンドル出力を確認する。

#### `any` の排除
> "Can we avoid `any` here?" — [PR #3362](https://github.com/pmndrs/zustand/pull/3362#discussion_r2702190132)

**原則**: `any` は最後の手段。`unknown` + 型ガードで代替できないか検討する。

#### `let` の排除
> "Not a big fan of `let` here. Could we do like this? `const getter = createGetter(store, atom, () => isSync)`" — [PR #3198](https://github.com/pmndrs/jotai/pull/3198#discussion_r2615887214)
> "Avoiding `let` is nice." — [PR #3253](https://github.com/pmndrs/jotai/pull/3253#discussion_r2899592413)

**原則**: `let` は可変状態を示す。クロージャやファクトリで `const` にできないか検討する。

#### 型の精度を高める
> "`dispatchFromDevtools: unknown` should be more precise." — [PR #3362](https://github.com/pmndrs/zustand/pull/3362#discussion_r2702744906)
> "Actually, the name is confusing. This is not to check if it has the function, but if devtools should dispatch. `const shouldDispatchFromUs = (api: unknown): api is WithDispatch =>`" — [PR #3362](https://github.com/pmndrs/zustand/pull/3362#discussion_r2702744334)

**原則**: 型ガード関数の命名は意図を表す。「何をチェックするか」ではなく「何を意味するか」。

#### 破壊的変更への慎重さ
> "We consider a behavioral breaking change seriously. async usage might be smaller than sync one, but it's not too small." — [PR #3391](https://github.com/pmndrs/zustand/pull/3391#discussion_r2840529741)
> "So, do you think this is a breaking change, or not?" — [PR #3391](https://github.com/pmndrs/zustand/pull/3391#discussion_r2838731311)

**原則**: APIの振る舞い変更は、シグネチャが同じでも破壊的変更になりうる。慎重に評価する。

#### ロジックの変更を避ける
> "Let's not change the logic." — [PR #3362](https://github.com/pmndrs/zustand/pull/3362#discussion_r2704618553)
> "We didn't check if it's `true`, only if it's truthy. That's the original behavior." — [PR #3362](https://github.com/pmndrs/zustand/pull/3362#discussion_r2705011062)

**原則**: 型改善のPRでロジックを変えない。truthy チェックと `=== true` チェックは異なる動作。

#### テストは実装ではなく振る舞いを検証する
> "Do you think this is a valid test? It's assuming an implementation detail. Improving test coverage is nice, but we should test the behavior, not the implementation." — [PR #3223](https://github.com/pmndrs/jotai/pull/3223#discussion_r2731938931)

**原則**: テストは公開APIの振る舞いを検証する。内部実装の詳細に依存するテストは壊れやすい。

#### テスト削除の禁止
> "It doesn't feel valid to remove this. It means to remove the entire spec. Would it be possible for you to try reverting temporarily and learn how to reproduce the issue?" — [PR #3147](https://github.com/pmndrs/jotai/pull/3147#discussion_r2573326589)

**原則**: テストの削除はスペックの削除。元のissueを再現して理解してからアプローチを決める。

#### 不要な変更の排除
> "Could you remove changes that only add new lines? It makes the diff bigger." — [PR #3147](https://github.com/pmndrs/jotai/pull/3147#discussion_r2573328140)
> "This changes the behavior. Can you revert?" — [PR #3147](https://github.com/pmndrs/jotai/pull/3147#discussion_r2573327814)

**原則**: PRのdiffは最小限に。フォーマット変更や無関係な変更は別PRで。

#### 過剰なラッピングへの警戒
> "To me, this feels kind of overwrapping. If we aren't afraid of breaking changes, I hope this to be: `hooks: SetLike<() => void>`" — [PR #3186](https://github.com/pmndrs/jotai/pull/3186#discussion_r2591435706)

**原則**: 内部APIは将来の変更を恐れずシンプルに。internalsは破壊的変更が許容される。

---

## 5. microsoft/TypeScript — @RyanCavanaugh & @DanielRosenwasser

### レビュー傾向
**パフォーマンス（アロケーション削減）**、**テストの網羅性**、**既存パターンとの一貫性**を重視。

### 主要な指摘パターン

#### 不要なアロケーションの排除
> "Probably don't want to allocate a closure on every member" — [PR #63084](https://github.com/microsoft/TypeScript/pull/63084#discussion_r2761223169) (DanielRosenwasser)

```typescript
// ❌ クロージャを毎回生成
members.some(m => containedBy(declaration, m))

// ✅ ループで直接チェック
if (declaration && container.declarations) {
    for (const d of container.declarations) {
        if (containedBy(declaration, d)) {
            return true;
        }
    }
}
```

**原則**: ホットパスでのクロージャ生成は避ける。特にコンパイラのような頻繁に呼ばれるコードでは。

#### null合体演算子の活用
> `(result ??= []).push(symbol)` — [PR #63084](https://github.com/microsoft/TypeScript/pull/63084#discussion_r2761206962) (DanielRosenwasser)

**原則**: `??=` で遅延初期化をワンライナーに。

#### エッジケースの防御的処理
> "Line 6423 implies that this is possible. Invalid .d.ts files and JSDoc-based symbols can produce weird results; it'd be better to just handle it." — [PR #63200](https://github.com/microsoft/TypeScript/pull/63200#discussion_r2865409902) (RyanCavanaugh)

**原則**: 「起きないはず」ではなく「起きうる」前提でガードする。特に外部入力（.d.ts、JSDoc）。

#### テストの網羅性
> "are import() type nodes also what we use in `typeof import(...)` and `typeof import(...).someValue`? If so, can we add tests for that too?" — [PR #63172](https://github.com/microsoft/TypeScript/pull/63172#discussion_r2835495001) (DanielRosenwasser)

**原則**: 修正対象のノード型が他の構文でも使われるなら、その構文もテストする。

#### 新機能追加への慎重さ
> "I don't think we should add a new LS feature for it at this point" — [PR #63054](https://github.com/microsoft/TypeScript/pull/63054#discussion_r2766230929) (RyanCavanaugh)

**原則**: 機能追加のスコープを慎重に判断。既存の仕組みで解決できるなら追加しない。

#### ジェネリクスの必要性を問う
> "Does this actually need to be generic?" — [PR #49929](https://github.com/microsoft/TypeScript/pull/49929#discussion_r923836905) (DanielRosenwasser)
> "Do you ever want the non-type-predicate version of this? It's only called twice anyway for a very specific purpose." — [PR #49929](https://github.com/microsoft/TypeScript/pull/49929#discussion_r923844459) (DanielRosenwasser)

**原則**: ジェネリクスや抽象化は「本当に必要か？」を問う。2箇所でしか使わない関数に汎用性は不要。

#### 二重キャストへの疑念
> "I always feel suspicious when I see `as Node as T`. It's kind of hard during code review to tell" — [PR #49929](https://github.com/microsoft/TypeScript/pull/49929#discussion_r923857901) (DanielRosenwasser)

**原則**: `as X as Y` の二重キャストはコードの型安全性が破綻しているシグナル。根本的な型設計を見直す。

#### ジェネリクスの制約順序
> "shouldn't this permit `TOut` <= `TIn` <= `T`? Also, feels like `TIn` should be the callback param type, and `T` should be the element type so that you'd have `TOut` <= `T` <= `TIn`" — [PR #49929](https://github.com/microsoft/TypeScript/pull/49929#discussion_r923849301) (DanielRosenwasser)

**原則**: ジェネリック型パラメータの制約は変性（variance）に基づいて正しい順序にする。

#### Debug.assert にはメッセージを付ける
> "Since these are early assertions, it would be nice to provide an error message to API consumers. `Debug.assert(getObjectFlags(type) & ObjectFlags.ClassOrInterface, \"Provided type should be a class or interface type.\")`" — [PR #49929](https://github.com/microsoft/TypeScript/pull/49929#discussion_r923830216) (DanielRosenwasser)

**原則**: アサーションにはAPI利用者向けのエラーメッセージを含める。

#### strictNullChecks無効時の型の振る舞い
> "A value of type `true` might be inhabited by `null`. Obviously the expression `true` itself isn't, but that's not really under analysis" — [PR #55291](https://github.com/microsoft/TypeScript/pull/55291#discussion_r1286260594) (RyanCavanaugh)
> "Any value can be falsy due to being `null` / `undefined`" — [PR #55291](https://github.com/microsoft/TypeScript/pull/55291#discussion_r1286203847) (RyanCavanaugh)

**原則**: `strictNullChecks: false` では全ての型が `null`/`undefined` を含みうる。型リテラル `true` でさえ。

#### OS依存の振る舞いはエディタ設定から取得
> "we don't want to be providing any OS-dependent behavior ourselves. It should all come from the editor config." — [PR #52298](https://github.com/microsoft/TypeScript/pull/52298#discussion_r1083122615) (RyanCavanaugh)

**原則**: コンパイラはOS非依存であるべき。環境依存の振る舞いはエディタ設定に委譲する。

---

## レビューパターン横断サマリー

### 全コミッター共通の原則

| 原則 | TkDodo | colinhacks | KATT | dai-shi | Ryan/Daniel |
|------|--------|------------|------|---------|-------------|
| `any` の排除 | ✅ | - | - | ✅ | - |
| 型アサーション不要な設計 | ✅ | - | - | - | - |
| パフォーマンス意識 | - | ✅ | - | ✅ (bundle) | ✅ (alloc) |
| テストの実証性 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 最小限のdiff | - | ✅ | - | ✅ | - |
| 既存パターンの再利用 | ✅ | ✅ | - | - | - |
| 破壊的変更への慎重さ | - | - | ✅ (opt-in) | ✅ | ✅ |
| 依存関係の最小化 | - | - | ✅ | - | - |
| 可読性 > DRY | - | - | ✅ | - | - |
| 不要な抽象化への拒否 | - | ✅ | - | ✅ | ✅ |
| 二重キャスト/`as`への疑念 | ✅ | - | - | - | ✅ |

### レビュー時に使えるチェックリスト

```markdown
## TypeScript Code Review Checklist (inspired by top committers)

### 型安全性 (TkDodo, dai-shi)
- [ ] `any` が使われていないか？ `unknown` + 型ガードで代替可能か？
- [ ] 型アサーション (`as`) なしで型推論が流れるか？
- [ ] ジェネリクスのパラメータ数は適切か？（推論を助ける十分な数）
- [ ] 型ガード関数の命名は意図（what it means）を表しているか？

### パフォーマンス (colinhacks, DanielRosenwasser)
- [ ] ホットパスでクロージャを生成していないか？
- [ ] 型改善がバンドルサイズに影響していないか？
- [ ] 変更は最小限か？（特にパフォーマンスクリティカルなコード）

### テスト (全員)
- [ ] mainで失敗しPRで成功するテストケースがあるか？
- [ ] テストは実装ではなく振る舞いを検証しているか？
- [ ] 関連する構文パターンもテストされているか？
- [ ] テストを削除していないか？（スペック削除に等しい）

### 設計 (KATT, dai-shi)
- [ ] 新機能はopt-inか？（既存ユーザーの挙動を壊さない）
- [ ] 不要な依存関係を追加していないか？
- [ ] ロジック変更と型変更が混在していないか？
- [ ] 内部APIは `@internal` でマークされているか？

### コンパイラ/ライブラリ設計 (RyanCavanaugh, DanielRosenwasser)
- [ ] ジェネリクスは本当に必要か？具象型で十分ではないか？
- [ ] 二重キャスト (`as X as Y`) が発生していないか？
- [ ] Debug.assertにエラーメッセージが含まれているか？
- [ ] OS依存の振る舞いがハードコードされていないか？

### PRの質 (colinhacks, dai-shi)
- [ ] diffは最小限か？（フォーマット変更は別PR）
- [ ] PRスコープは元のissueに限定されているか？
- [ ] `let` を `const` に置き換えられないか？
```

---

## データソース

| リポジトリ | コミッター | 収集コメント数 | 期間 |
|-----------|-----------|--------------|------|
| TanStack/query | @TkDodo | ~20 | 2025-02 〜 2026-03 |
| colinhacks/zod | @colinhacks | ~15 | 2025-12 〜 2026-01 |
| trpc/trpc | @KATT | ~25 | 2024-11 〜 2026-03 |
| pmndrs/zustand | @dai-shi | ~40 | 2025-01 〜 2026-03 |
| pmndrs/jotai | @dai-shi | ~55 | 2025-11 〜 2026-03 |
| microsoft/TypeScript | @RyanCavanaugh, @DanielRosenwasser | ~25 | 2022-08 〜 2026-03 |
