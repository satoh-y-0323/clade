# clade-parallel マニフェスト記述ルール（v0.5 以降）

plan-report に clade-parallel 用 YAML フロントマターを記載する際のルール。

## フィールド仕様

### timeout_sec
- デフォルト: **900**（省略時）
- 合計実行時間制限（秒）
- 並列化する処理の推定所要時間に応じて設定する。デフォルトで足りる場合は省略してよい。

### idle_timeout_sec（v0.5 新フィールド）
- デフォルト: **なし**（省略可）
- stdout/stderr への出力が N 秒間まったくなければタスクを強制終了する
- **worktree-developer には必ず設定すること**（目安: 600。開発規模に合わせて調整）
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

## timeout 設定の判断基準

| エージェント | phase | read_only | timeout_sec | idle_timeout_sec |
|---|---|---|---|---|
| worktree-developer | developer（または省略） | false | 開発規模に応じて調整（デフォルト 900） | **必須**（目安 600、規模に応じて調整） |
| code-reviewer | reviewer | true | デフォルト（900）で通常十分 | **設定禁止** |
| security-reviewer | reviewer | true | デフォルト（900）で通常十分 | **設定禁止** |

## よくある誤り

| 誤り | 正しい書き方 |
|---|---|
| `read_only: "true"` | `read_only: true` |
| read_only: true + idle_timeout_sec を設定 | idle_timeout_sec を削除する |
| worktree-developer に idle_timeout_sec を設定しない | `idle_timeout_sec: 600` など設定する |
| writes に symlink 解決後の実体パスを書く | マニフェストに記述するパスをそのまま書く |
| reviewer グループで `phase:` を省略する | `phase: reviewer` と明示する（省略すると developer 扱いになり `--phase reviewer` に含まれない） |
| 複数ラウンド分のグループを同一 plan-report に記載する | ラウンドごとに planner が新しい plan-report ファイルを生成する（1ファイル = 1ラウンド分のみ） |

## フルワークフロー例（developer + reviewer 両フェーズ並列）

同一 plan-report 内に developer/reviewer 両グループを定義し、フェーズごとに分けて実行する:

```yaml
---
parallel_groups:
  # ---- developer フェーズ（--phase developer で抽出）----
  group-frontend:
    phase: developer       # 省略も可（developer がデフォルト）
    agent: worktree-developer
    read_only: false
    tasks: [T1, T2]
    writes: ["src/frontend/**"]
    timeout_sec: 1800
    idle_timeout_sec: 600

  group-backend:
    phase: developer
    agent: worktree-developer
    read_only: false
    tasks: [T3, T4]
    writes: ["src/backend/**"]
    timeout_sec: 1800
    idle_timeout_sec: 600

  # ---- reviewer フェーズ（--phase reviewer で抽出）----
  code-review-group:
    phase: reviewer        # 必須（省略すると developer 扱い）
    agent: code-reviewer
    read_only: true
    tasks: [review]
    timeout_sec: 900

  security-review-group:
    phase: reviewer
    agent: security-reviewer
    read_only: true
    tasks: [security]
    timeout_sec: 900
---
```

### マルチラウンドの場合

reviewer で指摘が出て Round 2 が必要な場合、planner（Step 8）が**新しい plan-report ファイル**を生成する。
Round 2 の `parallel_groups` は新しいファイルに記載し、Round 1 のグループと混在させない。

```
Round 1: plan-report-20260423-100000.md → developer(並列) → reviewer(並列)
Round 2: plan-report-20260423-140000.md → developer(並列) → reviewer(並列)
```
