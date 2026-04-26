# clade-parallel マニフェスト記述ルール（v0.5 以降）

plan-report に clade-parallel 用 YAML フロントマターを記載する際のルール。

## フィールド仕様

### timeout_sec
- デフォルト: **900**（省略時の最終フォールバック）
- 合計実行時間制限（秒）
- 通常は `phase_scales` から自動解決されるため直書き不要。特定グループだけ調整したい場合のみ直書きする（グループ直書きが `phase_scales` より優先される）

### idle_timeout_sec（v0.5 新フィールド）
- デフォルト: **なし**（省略可）
- stdout/stderr への出力が N 秒間まったくなければタスクを強制終了する
- **worktree-developer には設定すること**（`phase_scales` から自動解決されるため通常は直書き不要）
- `read_only: true` のタスクには **設定禁止**（実行時に無視されるうえ stderr に警告が出る）

### read_only
- **YAML boolean で書くこと**（`true` / `false`。文字列 `"true"` は不可）
- `read_only: true` — code-reviewer・security-reviewer など読み取り専用エージェント
- `read_only: false` — worktree-developer など書き込みが発生するエージェント

### writes
- 書き込みファイルを宣言するフィールド
- **symlink を解決した実体パスではなく、マニフェストに書くパスをそのまま記述する**
- 衝突検出は clade-parallel 側が内部で処理する
- `read_only: true` のグループでは省略する

### phase（optional）
- `phase: developer` — developer フェーズのグループ（worktree あり実装タスク）
- `phase: reviewer`  — reviewer フェーズのグループ（read_only: true のレビュータスク）
- **省略時**: `phase: developer` と同等（後方互換）
- `--phase developer` フィルタ: `phase: developer` または未指定のグループを抽出
- `--phase reviewer` フィルタ: `phase: reviewer` のグループのみ抽出

### concurrency_group（optional, v0.7）
- このタスクが属するコンカレンシーグループ名（文字列）
- 同じグループのタスクは `concurrency_limits` で指定した数まで同時実行される
- 省略時: コンカレンシーグループなし（`--max-workers` の上限のみ適用）

## マニフェストトップレベルフィールド

| フィールド | 型 | 説明 |
|---|---|---|
| `concurrency_limits` | object | グループ名をキー、同時実行上限（1〜256）を値とするマップ。`concurrency_group` を使うタスクが存在する場合は必須（v0.7） |

### 使用例

```yaml
concurrency_limits:
  claude-api: 3   # claude-api グループのタスクは同時3つまで
  db-write: 1     # db-write グループのタスクは直列実行
```

## timeout 設定の判断基準

`phase_scales` で scale を指定すると `plan-to-manifest.js` が自動解決する。直書きは個別調整時のみ。

### developer フェーズ（worktree-developer）

| scale | timeout_sec | idle_timeout_sec | 想定シナリオ |
|---|---|---|---|
| small  | 3000（50分）  | 2400（40分） | 並列化の最低ライン。3〜4ファイル・単一機能 |
| medium | 6000（100分） | 3600（60分） | 標準的な並列実装（デフォルト）。複数機能にまたがる |
| large  | 12000（200分）| 4800（80分） | 複数サブシステムの同時実装・大規模リファクタ |

### reviewer フェーズ（code-reviewer / security-reviewer）

`idle_timeout_sec` は **設定禁止**（read_only タスクは runner.py が強制 None にする）。

| scale | timeout_sec | 想定シナリオ |
|---|---|---|
| small  | 3000（50分）  | 小規模レビュー |
| medium | 9000（150分） | 標準的なレビュー（デフォルト）|
| large  | 45000（750分）| 大規模・広範囲レビュー |

## よくある誤り

| 誤り | 正しい書き方 |
|---|---|
| `read_only: "true"` | `read_only: true` |
| read_only: true + idle_timeout_sec を設定 | idle_timeout_sec を削除する |
| worktree-developer に timeout_sec / idle_timeout_sec を直書きする | `phase_scales` で scale を指定して自動解決させる（個別調整が必要な場合のみ直書き） |
| writes に symlink 解決後の実体パスを書く | マニフェストに記述するパスをそのまま書く |
| reviewer グループで `phase:` を省略する | `phase: reviewer` と明示する（省略すると developer 扱いになり `--phase reviewer` に含まれない） |
| 複数ラウンド分のグループを同一 plan-report に記載する | ラウンドごとに planner が新しい plan-report ファイルを生成する（1ファイル = 1ラウンド分のみ） |

## フルワークフロー例（developer + reviewer 両フェーズ並列）

同一 plan-report 内に developer/reviewer 両グループを定義し、フェーズごとに分けて実行する:

```yaml
---
phase_scales:
  developer: medium   # small: 50分/40分idle  medium: 100分/60分idle  large: 200分/80分idle
  reviewer: small     # small: 50分  medium: 150分  large: 750分

parallel_groups:
  # ---- developer フェーズ（--phase developer で抽出）----
  group-frontend:
    phase: developer       # 省略も可（developer がデフォルト）
    agent: worktree-developer
    read_only: false
    tasks: [T1, T2]
    writes: ["src/frontend/**"]
    # timeout_sec / idle_timeout_sec は phase_scales から自動解決（直書き不要）

  group-backend:
    phase: developer
    agent: worktree-developer
    read_only: false
    tasks: [T3, T4]
    writes: ["src/backend/**"]

  # ---- reviewer フェーズ（--phase reviewer で抽出）----
  code-review-group:
    phase: reviewer        # 必須（省略すると developer 扱い）
    agent: code-reviewer
    read_only: true
    tasks: [review]
    # timeout_sec は phase_scales から自動解決。idle_timeout_sec は設定禁止

  security-review-group:
    phase: reviewer
    agent: security-reviewer
    read_only: true
    tasks: [security]
---
```

### マルチラウンドの場合

reviewer で指摘が出て Round 2 が必要な場合、planner（Step 8）が**新しい plan-report ファイル**を生成する。
Round 2 の `parallel_groups` は新しいファイルに記載し、Round 1 のグループと混在させない。

```
Round 1: plan-report-20260423-100000.md → developer(並列) → reviewer(並列)
Round 2: plan-report-20260423-140000.md → developer(並列) → reviewer(並列)
```
