# TypeScript Review Points

レビュー観点チェックリスト。各項目はOSSトップコミッターの実際のPRレビューから抽出。

---

## 1. 型安全性

### 1-1. `any` の排除
`any` は型安全性の放棄。`unknown` + 型ガード、またはジェネリクスで推論させる。ライブラリ内部であっても `any` は例外ではない。
— TkDodo, dai-shi, colinhacks

### 1-2. 型アサーション (`as`) が不要な設計
`as` が必要な時点で型設計に問題がある。ジェネリクスのパラメータ数を調整し、推論が自然に流れるようにする。
— TkDodo

### 1-3. 二重キャスト (`as X as Y`) は型設計の破綻シグナル
`as Node as T` のような二重キャストはレビューで安全性を判断できない。根本的な型設計を見直す。
— DanielRosenwasser

### 1-4. ジェネリクスの必要性を問う
2箇所でしか使わない関数にジェネリクスは不要。「本当に汎用性が必要か？」を問う。
— DanielRosenwasser

### 1-5. ジェネリクス制約の変性 (variance) に基づく順序
型パラメータの制約は `TOut <= T <= TIn` のように変性に基づいて正しい順序にする。
— DanielRosenwasser

### 1-6. 型ガード関数の命名は意図を表す
「何をチェックするか」ではなく「何を意味するか」で命名する。
例: `hasDispatchFunction` → `shouldDispatchFromUs`
— dai-shi

### 1-7. `unknown` も精度を高める
`unknown` で止めず、可能な限り具体的な型にする。
— dai-shi

### 1-8. strictNullChecks 無効時の型の振る舞い
`strictNullChecks: false` では全ての型が `null`/`undefined` を含みうる。型リテラル `true` でさえ。
— RyanCavanaugh

### 1-9. 型の正確性がAPI破壊より優先される場合がある
型定義がランタイム動作と合っていないなら、breaking change でも型を修正する。「型が嘘をつくよりマシ」。
— pcattori (React Router)

### 1-10. Tuple型 > Union型 でミドルウェア拡張を追跡
`Array<Middleware>` のunion型ではdispatch拡張が正しく推論されない。tuple型で正確に追跡する。
— markerikson (Redux Toolkit)

### 1-11. 関数オーバーロード vs 条件型の使い分け
ケース数が少なく列挙可能なら、broad conditional type よりオーバーロードの方が精度もIDE支援も良い。
一方、型推論が壊れる場合は `extends` 制約で分岐する方がオーバーロードより安全。
— mattpocock (ts-reset), mikearnaldi (Effect-TS)

### 1-12. 型の読み書き非対称性
APIの型変更は「書く側」と「読む側」の両方を評価する。書きやすくなっても、読み取り側で型比較やパターンマッチが壊れるなら採用しない。
— dsherret (ts-morph)

### 1-13. 型ユーティリティのエッジケース網羅
`any`, `never`, `unknown`, `readonly`, union, negative index, 空配列 — すべてテストする。型ユーティリティは「正常系だけ通る」では不十分。
— sindresorhus (type-fest)

---

## 2. パフォーマンス

### 2-1. ホットパスでのクロージャ生成を避ける
`members.some(m => fn(m))` よりも `for...of` ループで直接チェック。頻繁に呼ばれるコードでは1行の差がパフォーマンスに影響する。
— DanielRosenwasser, colinhacks

### 2-2. プロパティアクセスの最小化
パフォーマンスクリティカルパスではプロパティアクセス回数まで最適化されている。変更は最小限に、ベンチマーク必須。
— colinhacks

### 2-3. 型改善がバンドルサイズに影響していないか
型のみのPRがランタイムコードに影響を与えてはならない。バンドル出力を確認する。
— dai-shi

### 2-4. `??=` による遅延初期化
`(result ??= []).push(item)` でワンライナーに。不要な分岐を減らす。
— DanielRosenwasser

### 2-5. 最適化の採否はベンチマークで決める
「速そう」ではなく計測結果で判断。~95%改善のベンチマークがあれば方針を変える。コード重複を生む最適化は数値的根拠なしには採用しない。
— yyx990803 (Vue.js)

### 2-6. Tree-shaking を意識したコード構造
モジュールレベルの定数宣言は tree-shake されない。関数内でインラインキャッシュとして使い、未使用時に除去可能にする。
— yyx990803 (Vue.js)

### 2-7. 圧縮を意識した宣言の配置
`const` 宣言をまとめて配置すると minifier の圧縮率が上がる。
— yyx990803 (Vue.js)

### 2-8. 不要な計算を避ける
全ファイルに対して重い処理を実行してからフィルタするのではなく、フィルタしてから処理する。「raw buffer size で判定できるならそちらを使う」。
— yyx990803 (Vite)

### 2-9. `process.env.NODE_ENV` でデバッグコードを除去可能にする
関数呼び出しとエラーメッセージをNODE_ENVチェックで囲み、bundler が production build で除去できるようにする。
— markerikson (Reselect)

### 2-10. 量的根拠が非正統的アプローチを正当化する
6700ms → 700ms のような具体的メトリクスがあれば、mutable object による subscription 管理のような「技術的にはlegal だがhacky」なアプローチも許容される。
— markerikson (Redux Toolkit)

### 2-11. `slice()` > スプレッド、`for` ループ > `for...of`
`slice()` は iterableシム不要で高速。`for...of` はイテレータプロトコル呼び出しが入るので plain `for` ループの方が速い。
— DanielRosenwasser, yyx990803

### 2-12. npm 配布サイズへの意識
`@shikijs/cli` (~21MB) のような大きな依存を追加しない。npm install 時のネットワーク要求を減らす。devDependencies にしてバンドル可能にする。
— yyx990803 (Vite)

### 2-13. `EMPTY_OBJ` に `for...in` を走らせない
`Object.assign(target, EMPTY_OBJ)` は空オブジェクトへの `for...in` を実行する。不要なイテレーションを避ける。
— yyx990803 (Vue.js)

### 2-14. 二次計算量に注意
`indexOf` をループ内で繰り返し呼ぶと O(n²)。tight loop で `isAnyDirectorySeparator` を直接チェックする方が効率的。
— DanielRosenwasser

---

## 3. API・モジュール設計

### 3-1. 既存ユーティリティの再利用
同じロジックの再実装はバグの温床。既存の抽象化を探して活用する。
— TkDodo

### 3-2. オプションオブジェクトはまとめて渡す
分解して個別に渡すと、将来のオプション追加時に漏れが生じる。
— TkDodo

### 3-3. 新機能は opt-in
デフォルト動作を変える新機能は opt-in にする。既存ユーザーの挙動を壊さない。
— KATT

### 3-4. 内部型は `@internal` でマーク
パブリックAPIとの境界を明確にする。
— KATT

### 3-5. 依存関係の最小化
ライブラリは依存を最小化する。インライン実装とインポートを慎重に判断。core パッケージは dependency-free を目指す。
— KATT, Angelelz (Drizzle)

### 3-6. 破壊的変更はシグネチャだけでなく振る舞いで評価
APIのシグネチャが同じでも、振る舞いの変更は破壊的変更になりうる。
— dai-shi

### 3-7. 内部APIは過剰ラッピングせずシンプルに
internals は破壊的変更が許容される。将来の変更を恐れずシンプルに保つ。
— dai-shi

### 3-8. 機能追加のスコープを慎重に判断
既存の仕組みで解決できるなら新機能を追加しない。
— RyanCavanaugh

### 3-9. OS依存の振る舞いはエディタ設定に委譲
コンパイラ/ライブラリはOS非依存であるべき。環境依存はエディタ設定に委譲。
— RyanCavanaugh

### 3-10. 構造化オブジェクト返却で型推論を有効にする
メソッドを middleware 自体に付けると dispatch の型推論が壊れる。`{middleware, startListening, stopListening}` のようにオブジェクト返却に変更すれば推論が通る。API形状を型の正確性のために変える判断。
— markerikson (Redux Toolkit)

### 3-11. 個別 setter より統合 configuration 関数
setter を個別に生やすと API surface が膨張する。将来の拡張を見越して統一的な設定関数にまとめる。
— markerikson (Reselect)

### 3-12. 関数の返り値型は概念的意図で決める
reset メソッドが `0` を返すのは JS の副作用であり、概念的には `void`。型注釈はランタイムの偶然ではなく設計意図を表す。
— markerikson (Reselect)

### 3-13. 状態判定ロジックは情報が最も豊富な場所に置く
hydration の fallback 表示判定は Router が持つべき（hydration context を知っているのは Router だから）。render 層で下流計算しない。
— pcattori (React Router)

### 3-14. 直列化は明示的にする（暗黙の toJSON に頼らない）
`json()` を使い型情報を保持する。暗黙の serialization convention はクライアント側で型が失われる。
— pcattori (Remix)

### 3-15. Request のメタデータを保持する
observability のために `.data` サフィックスや `?index` パラメータを剥がさない。監視ツールが document/data request を区別できるようにする。
— React Router team

### 3-16. 過去の設計ミスは受け入れて複雑さを吸収する
後方互換コストが大きい場合、理想的でない設計でも「absorb the complexity」する判断がある。
— yyx990803 (Vue.js)

### 3-17. エラーハンドリングの責任境界を明確にする
フレームワークが全てのエラーを捕捉するのは不可能。ユーザーの責任範囲を文書化して線引きする。
— yyx990803 (Vue.js)

### 3-18. renderer の nodeOps にメソッドを安易に追加しない
カスタムレンダラーが全メソッドを実装する必要があるため、追加は技術的に breaking change。
— yyx990803 (Vue.js)

### 3-19. 言語機能の最低サポートバージョンに注意
`Array.prototype.at` (Node 16.6+), `??=` (ES2021) など、サポート範囲外の構文をbug fix PRに紛れ込ませない。
— yyx990803 (Vue.js)

### 3-20. core は self-contained に保つ
外部ライブラリの型機構（HKT registry 等）に依存しない。依存グラフを単純化し、コンパイル高速化・メンテナンス容易化を実現する。
— mikearnaldi (Effect-TS)

### 3-21. 言語機能が効率的な実装を可能にするまで待つ
パターンが「可能」になった時点ではなく、「効率的」になった時点で実装する。TypeScript 4.1 の template literal types を待って typeclass を再設計するなど。
— mikearnaldi (Effect-TS)

### 3-22. 新規パラメータは required で追加し、最後に default 値を入れる
1) required で追加 → 2) 全箇所に実装 → 3) 後方互換のために default 値追加。こうすれば内部的な漏れがなくなる。
— KATT

### 3-23. Node.js API を直接 import せず duck type で抽象化する
`import { AsyncLocalStorage } from 'node:async_hooks'` ではなく、`interface AsyncStorageLike<T>` のような duck type を使う。Lambda 等の特殊環境での互換性を確保する。
— KATT

### 3-24. エラーメッセージの変更は breaking change
ユーザーがエラーメッセージ文字列に依存している可能性がある。文言変更は semver 的に breaking。
— colinhacks

### 3-25. `test.only` や `.d.ts` の global 汚染をチェック
`test.only` のマージ忘れ、`.d.ts` ファイルによるグローバルスコープ汚染をレビューで確認する。
— colinhacks, KATT

### 3-26. ニッチなユースケースは core に入れない
「面白いが影響範囲が狭い」機能はユーザーランドで実装させる。core のバンドルサイズと保守コストを守る。
— colinhacks, mattpocock

### 3-27. factory 関数でモジュール単位の tree-shake を実現する
monolithic クラスではなく独立した factory 関数にすれば、subscriptions を使わないユーザーはそのコードを読み込まない。
— KATT

### 3-28. 全 API surface で一貫性を監査する
route masking を追加したら、`useLocation` と `router.subscribe` の両方が同じ location を返すか確認する。API 間の不整合はユーザーの前提を壊す。
— React Router team

---

## 4. ランタイム環境

### 4-1. `new Function()` 等の環境依存コード
JIT最適化は Cloudflare Workers、CSP制約のある環境等で使えない。opt-out機構を用意する。
— colinhacks

### 4-2. 仕様への正確な準拠
JSON Schema 等の仕様を正確に理解し、仕様に準拠しない使い方を防ぐ。
— colinhacks

### 4-3. スキーマ変換時のキー再計算
スキーマが transform を持つ場合、変換後の値でキーを再構築する必要がある。
— colinhacks

### 4-4. ESM/CJS 移行はビルドツール横断のマニュアルテストが必須
複数のビルドツール（webpack, Rollup, esbuild, Vite 等）× dev/prod モードで手動テストする。module resolution の挙動はツールごとに異なり、自動化では不十分。
— markerikson (Redux Toolkit)

### 4-5. package.json フィールドはツール解決に cascading 影響を持つ
`name` フィールドが Vitest のモジュール解決を妨げるなど、metadata フィールドは cosmetic ではない。
— markerikson (Redux Toolkit)

### 4-6. 型宣言バンドルと module augmentation は相性が悪い
interface merging / declared module パターンはバンドルされた .d.ts で壊れる。pragmatic に retreat する判断もある。
— markerikson (Redux Toolkit)

### 4-7. Vite プラグインでは Rollup の sanitizeFileName に注意
`:` が `_` に置換されるため、virtual module の名前マッチングは `name.endsWith()` で defensive に。
— pcattori (React Router)

### 4-8. `globalThis` の存在を仮定しない
Vue のサポート範囲では `globalThis` が使えない場合がある。`import { getGlobalThis } from '@vue/shared'` を使う。
— yyx990803 (Vue.js)

### 4-9. `__DEV__` ブランチで dev-only コードを囲む
HMR コード、warning メッセージ、`formatComponentName` 等は `__DEV__` ブランチに入れて production で tree-shake 可能にする。
— yyx990803 (Vue.js)

---

## 5. テスト品質

### 5-1. main で失敗し PR で成功するテストケースがあるか
型改善のPRでも、テストで差分を実証できなければ意味がない。
— TkDodo, KATT

### 5-2. テストは振る舞いを検証する（実装ではなく）
内部実装の詳細に依存するテストは壊れやすい。公開APIの振る舞いを検証する。
— dai-shi

### 5-3. テスト削除はスペック削除に等しい
テストを消す前に、元のissueを再現して理解してからアプローチを決める。
— dai-shi

### 5-4. インラインスナップショットで具体的な出力を検証
`toMatchInlineSnapshot` でカスタムエラーメッセージ等の出力を実際にテストする。
— colinhacks

### 5-5. 関連する構文パターンもテスト
修正対象のノード型が他の構文でも使われるなら、その構文もテストする。
— DanielRosenwasser

### 5-6. ランタイムテストは型の変更でも必要
型だけの変更に見えても「ランタイムで動くか？」を確認するテストを追加する。
— colinhacks

### 5-7. 再現テストは修正前に提出
「修正の再現を issue で示してから fix を validate する」。修正と再現を同時に確認できるテストが必要。
— brophdawg11 (React Router)

### 5-8. 型テストの決定性を確保
TypeScript の union 型は反復順序が非決定的。テストが「たまたま通る」のではなく「常に失敗する」ことを保証する test case を書く。
— sindresorhus (type-fest)

### 5-9. 新しいメソッドには必ずテストを追加
"Add test?" "Needs tests." — 未テストの新メソッドはマージしない。テスト数は1件で十分な場合もある。
— dsherret (ts-morph)

### 5-10. テスト結果の件数をアサートする
`edits` が何件返るか、`results` のlengthが想定通りかをアサートし、テストの信頼性を高める。
— dsherret (ts-morph)

### 5-11. `.find` で1件だけ見つけるのではなく全件収集してエラー報告
`.find` は最初の1件で止まる。全パラメータを検査し、不正な値を全て列挙するほうがユーザーフレンドリー。
— timneutkens (Next.js)

### 5-12. type-test で `sleep` は不要
型テストはランタイム実行しない。`Promise.resolve(...)` を queryFn から返せば十分。
— TkDodo

### 5-13. fake timers を使い実時間の `sleep` を避ける
テストで `await sleep(5000)` は遅い。`vi.useFakeTimers()` で高速かつ決定的にする。
— TkDodo, KATT

### 5-14. 防御的テスト: 将来のリグレッション防止のためのテストも有効
現時点で問題がなくても「将来ループが発生しないことの証明」としてテストを残す価値がある。issue 報告への証拠にもなる。
— timneutkens (Next.js)

### 5-15. パス/ファイル名のアサーションは正確に
pathname とファイルパスを混同しない。helper の命名も `isMetadataRouteFile` vs `isMetadataFileStaticRoutePage` のように区別する。
— huozhi (Next.js)

### 5-16. ソースコードをテストでソースコードに依存させない
ハッシュやサフィックスをソースから取得してテストに使うのではなく、ハードコードする。実装が変わったときにテストが自動的に失敗するべき。
— huozhi (Next.js)

---

## 6. コード品質

### 6-1. `let` を `const` に置き換えられないか
`let` は可変状態を示す。クロージャやファクトリで `const` にできないか検討する。
— dai-shi

### 6-2. 可読性 > DRY
過度な抽象化は理解を妨げる。DRYを追求して読みにくくなるなら分割する。
— KATT

### 6-3. 既存パターンからの逸脱には理由が必要
`cached()` を使っていたのにIIFE + getterに変えるなら、なぜか説明が必要。
— colinhacks

### 6-4. Debug.assert にはエラーメッセージを含める
API利用者がアサーション失敗時に原因を理解できるようにする。
— DanielRosenwasser

### 6-5. ロジック変更と型変更を混在させない
型改善PRでロジックを変えない。truthy チェックと `=== true` チェックは異なる動作。
— dai-shi

### 6-6. バグ修正のスコープを狭く保つ
全要素に影響する修正ではなく、対象要素（例: Vue custom elements のみ）に限定する。広い修正は副作用リスクが高い。
— yyx990803 (Vue.js)

### 6-7. 条件分岐の否定を避ける
`if (!cond) { A } else { B }` より `if (cond) { B } else { A }` が読みやすい。
— RyanCavanaugh

### 6-8. early return でネストを減らす
nested `if` は読みにくい。`return false` を早めに返してインデントレベルを減らす。
— KATT, yyx990803

### 6-9. `void promise` は unhandled rejection の温床
`void asyncFn()` は Promise rejection をハンドルしない。Node.js ではサーバーがクラッシュする原因になる。
— KATT

### 6-10. 1文字変数名を避ける
`p`, `m`, `t` のような変数名はレビューで文脈を追えない。
— KATT

### 6-11. destructuring を安易に使わない
参照回数が少ない場合、destructuring は可読性を下げる。"rule of 3" — 3回以上参照するなら destructure。
— KATT

### 6-12. index.ts を避ける
index ファイルはインポートパスが曖昧になる。具体的なファイル名を使う。
— KATT

### 6-13. try-catch のスコープを最小化する
大きな try-catch は問題を隠す。I/O 操作だけを囲み、他のエラーは伝播させる。
— huozhi (Next.js)

### 6-14. 不要な `await` を除去する
同期的に完了する箇所の `await` は不要なマイクロタスクを生む。
— huozhi (Next.js)

### 6-15. オブジェクトの不要なコピーを避ける
spread で毎回コピーするのではなく、参照を直接渡せないか検討する。
— timneutkens (Next.js)

### 6-16. コメントで変更理由を説明する
元の実装と異なるアプローチを取る場合、なぜ変更したかコメントを追加する。
— timneutkens (Next.js)

### 6-17. オブジェクトを直接 mutate しない
`res.props[key] = { ...t.props[key], optional: true }` のようにクローンしてから変更する。ユーザーの raw オブジェクトや共有構造体の意図しない変更を防ぐ。
— yyx990803 (Vue.js)

### 6-18. Concurrent Mode で ref 代入をレンダリング中に行わない
`ref.current = value` をレンダリング中に行うと Concurrent Mode で安全でない。effect 内で行う。
— TkDodo, dai-shi

### 6-19. `||` と `??` の使い分けに注意
`false` や `0` を有効な値として扱う場合は `??` を使う。`||` は falsy 値を全てスキップする。
— DanielRosenwasser

### 6-20. 関数パラメータの数を最小化し、option object に統合
4つ以上のパラメータは option object にまとめる。「What do you think about making this a single object parameter?」
— dsherret (ts-morph)

### 6-21. 変数名に boolean の意味を持たせない（実際は述語や関数の場合）
`excludeDeclaration` (boolean 風) → `declarationFilter` (述語風)。名前が型と役割を正確に表すようにする。
— RyanCavanaugh

### 6-22. タプル型はオブジェクト型より可読性に注意
「Can you use a (preferably named) object type instead of this tuple?」— タプルは位置に意味があるため、フィールド名を持つオブジェクトの方が自己文書化される。
— DanielRosenwasser

### 6-23. `timer.unref()` でプロセス終了を妨げない
ping interval 等の timer は `unref()` してプロセスのgraceful shutdownを妨げないようにする。
— KATT

### 6-24. `EMPTY_OBJ` を活用して不要なアロケーションを避ける
`return EMPTY_OBJECT` で空オブジェクトの新規生成を避ける。ただし `EMPTY_OBJ` に対する `for...in` は避ける（2-13 参照）。
— yyx990803 (Vue.js)

### 6-25. 正規表現の dotAll フラグ (`s`) やブラウザ互換に注意
ES2018 の正規表現機能は古いブラウザで動かない。`/[^]+/` のような互換性のある書き方を使う。
— yyx990803 (Vue.js)

### 6-26. helper を再実装せず、既存の helper を正しく呼ぶ
同じ目的の regex を2つメンテナンスするのは苦痛。既存 helper の呼び方を変える方が安全。
— huozhi (Next.js)

---

## 7. PR規律

### 7-1. diff は最小限
フォーマット変更や無関係な修正は別PRで。diffが大きいとレビュー品質が下がる。
— colinhacks, dai-shi

### 7-2. PRスコープは元のissueに限定
無関係な修正はスコープ外。「ついでに」の修正は別PRで。
— colinhacks

### 7-3. 変更の必要性を証明するテストが必要
変更を戻してもテストが通るなら、その変更の必要性を証明するテストが足りない。
— KATT

### 7-4. drive-by の変更は分離する
「Is this drive-by, or necessary?」— 無関係な変更は別PR。機能別にPRを分ける。
— RyanCavanaugh, dsherret

### 7-5. 依存パッケージの安定性を確認してから採用
tinyglobby のように、vite/pnpm/storybook 等のエコシステムでの採用実績を確認してからマージする。
— dsherret (ts-morph)

### 7-6. PRが大きすぎる場合は分割を求める
"This PR is too large to merge. Individually, we could discuss these pieces and get them merged one by one." — 複数の変更は個別PRに分割。
— mattpocock (ts-reset)

### 7-7. バージョンの bumping は慎重に
ビルド設定の変更は互換性に影響する可能性がある。minor bump が必要かを評価する。
— markerikson (Redux Toolkit)

### 7-8. `.test.only` のマージ忘れを防ぐ
CI では全テストが走るため `.only` が残っていても気づきにくい。レビューで確認する。
— colinhacks, dsherret

### 7-9. lock ファイルの変更は原則不要
ライブラリリポジトリでは lock ファイルの変更をPRに含めない。
— TkDodo

### 7-10. 機能追加は deprecated 機能の削除より後にする
deprecated API を残しつつ新 API を追加し、十分な移行期間の後に削除する。
— multiple committers

---

## 8. フレームワーク/コンパイラ固有

### 8-1. コンパイラコードはオブジェクトアロケーションを避ける
switch を map/object に置き換えると毎回アロケーションが発生する。コンパイラのような高頻度パスでは switch を残す。
— RyanCavanaugh

### 8-2. テストフォーマットはベースライン化を優先
手書きのアサーションより、ベースラインファイルを生成して diff で確認する。TypeScript リポジトリではユニットテストより compiler/fourslash テストが適切。
— RyanCavanaugh, DanielRosenwasser

### 8-3. カスタムレンダラーへの影響を考慮
Vue の nodeOps にメソッドを追加すると、全カスタムレンダラーが実装を強いられる。breaking change として扱う。
— yyx990803

### 8-4. `__DEV__` ガードで dev-only コードをプロダクションから除去
warning、formatComponentName、HMR コードは `__DEV__` ブランチに入れる。ユーザーのバンドルサイズに直結する。
— yyx990803

### 8-5. 型レベルの複雑さが実用性を殺す場合がある
TypeScript 5.5 で推論結果が複雑化し、開発者が理解できなくなった場合、正しさより実用性を優先する。HKT の内部 plumbing が export に漏れるのも同様。
— mikearnaldi (Effect-TS)

### 8-6. Standard Schema 等の相互運用規格を採用する
エコシステムロックインを避けるため、Standard Schema v1 のような interop 規格に準拠する。
— gcanti (Effect-TS)

### 8-7. SQL 慣習に沿った API 設計
`select().from()` の順序は SQL の `SELECT...FROM` に従う。ユーザーの既存知識を活かすために、型安全性の理論的利点より慣習を優先する場合がある。
— Drizzle ORM team

### 8-8. 実用的な型安全 > 理論的な型安全
完全な型安全 API は error message が不可読になる場合がある。production で20ヶ月使った結果、simpler API に戻した事例。
— dankochetov, AlexBlokh (Drizzle)

### 8-9. SSR / hydration でのコンテキスト分離
`renderToString` は async。concurrent 呼び出しが ssrContext を上書きする。context はコール内で生成して下流に渡す。
— yyx990803 (Vue.js)

### 8-10. `/*#__PURE__*/` アノテーションで side-effect-free を宣言
factory 関数呼び出しに `/*#__PURE__*/` を付けると、bundler が未使用時に除去できる。
— yyx990803 (Vue.js)

### 8-11. microtask タイミングの落とし穴
async 関数の返却と評価の間に microtask gap がある。Svelte の async components ではコンテキストラッピングが必要。
— Rich-Harris (Svelte)

### 8-12. `Explicit Resource Management` (`using`) はビルド環境の対応を確認
`using` / `Symbol.dispose` は polyfill が bundle に大量のコードを追加する。`tslib` / `@swc/helpers` で共有するか、ターゲット環境が対応するまで待つ。
— KATT

### 8-13. ESLint rule 例外には言語固有の理由をコメント
`// eslint-disable` を使う場合、「constructors cannot use # prefix」のように言語制約の理由を明記する。
— pcattori (Remix)

### 8-14. `Date.now()` は synchronous I/O 追跡をトリガーする環境がある
Next.js の内部では `Date.now()` がトラッキングを発火させる場合がある。パフォーマンスクリティカルな箇所では代替手段を検討する。
— huozhi (Next.js)

---

## データソース

| リポジトリ | コミッター | 収集コメント数 | 期間 |
|-----------|-----------|--------------|------|
| TanStack/query, router | @TkDodo | 601 | 2023 〜 2026-03 |
| colinhacks/zod | @colinhacks | 581 | 2020 〜 2026-03 |
| trpc/trpc | @KATT | 173 | 2024-11 〜 2026-03 |
| pmndrs/zustand, jotai, valtio | @dai-shi | 1,687 | 2023 〜 2026-03 |
| microsoft/TypeScript | @RyanCavanaugh, @DanielRosenwasser | 197 | 2022-08 〜 2026-03 |
| sindresorhus/type-fest | @sindresorhus | 253 | 2023 〜 2026-03 |
| dsherret/ts-morph | @dsherret | 270 | 2018 〜 2026-03 |
| total-typescript/ts-reset | @mattpocock | ~54 | 2023 〜 2026-03 |
| reduxjs/redux-toolkit, redux, reselect, react-redux | @markerikson | 645 | 2021 〜 2026-03 |
| vuejs/core, vitejs/vite | @yyx990803 | 437 | 2019 〜 2026-03 |
| remix-run/react-router, remix | @pcattori, @brophdawg11 | 790 | 2024 〜 2026-03 |
| sveltejs/svelte, kit, rollup/rollup | @Rich-Harris | 862 | 2022 〜 2026-03 |
| vercel/next.js | @timneutkens, @huozhi, @shuding | 152 | 2025 〜 2026-03 |
| Effect-TS/effect | @mikearnaldi, @gcanti | 787 | 2022 〜 2026-03 |
| drizzle-team/drizzle-orm, prisma/prisma | @dankochetov, @AndriiSherman, @jacek-prisma, @aqrln | 349 | 2023 〜 2026-03 |
| **合計** | **20+ コミッター** | **7,785** | |
