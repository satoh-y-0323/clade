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

## timeout 設定の判断基準

| エージェント | read_only | timeout_sec | idle_timeout_sec |
|---|---|---|---|
| worktree-developer | false | 開発規模に応じて調整（デフォルト 900 で足りない場合は増やす） | **必須**（目安 600、規模に応じて調整） |
| code-reviewer | true | デフォルト（900）で通常十分 | **設定禁止** |
| security-reviewer | true | デフォルト（900）で通常十分 | **設定禁止** |

## よくある誤り

| 誤り | 正しい書き方 |
|---|---|
| `read_only: "true"` | `read_only: true` |
| read_only: true + idle_timeout_sec を設定 | idle_timeout_sec を削除する |
| worktree-developer に idle_timeout_sec を設定しない | `idle_timeout_sec: 600` など設定する |
| writes に symlink 解決後の実体パスを書く | マニフェストに記述するパスをそのまま書く |
