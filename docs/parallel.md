# 並列開発（clade-parallel）

Clade は外部ツール **clade-parallel** と連携することで、複数の worktree-developer を同時に起動し、独立したタスクグループを並列実行できます。

## clade-parallel とは

clade-parallel は Claude Code CLI を外部から並列起動するオーケストレーションツールです。Clade の `plan-to-manifest.js` が生成したマニフェストファイルを読み取り、依存関係を考慮しながら複数のエージェントを同時実行します。

**Clade のワークフローとの関係：** Clade 本体は逐次実行のまま維持されており、並列制御はすべて clade-parallel 側で行われます。マニフェストファイルが2者の唯一の契約です。

## 前提条件

```bash
pip install clade-parallel
```

clade-parallel v1.0.0 以降が必要です。

---

## いつ並列化すべきか

clade-parallel には起動・worktree 作成の**固定オーバーヘッドが10分以上**あります。並列化が効果的な条件：

1. 独立して実装できるタスクグループが **2つ以上** ある
2. 実装ファイルが **3つ以上** あり、複雑なロジックを含む
3. 各グループが担当するファイルが**明確に分離**できる
4. 単体実行が **30分以上** かかる見込みがある

上記を満たさない場合は通常の逐次実行（`/agent-developer`）の方が速いです。

---

## Clade のワークフローでの使い方

### Step 4（developer フェーズ）

```bash
# マニフェスト生成
node .claude/hooks/plan-to-manifest.js --phase developer {plan-report の絶対パス}

# 並列実行（--report で完了後にサマリ JSON を出力）
clade-parallel run {developer-manifest パス} --report {developer-manifest パスの .md を -report.json に置換したパス}
```

### Step 6+7（reviewer フェーズ）

```bash
node .claude/hooks/plan-to-manifest.js --phase reviewer {plan-report の絶対パス}
clade-parallel run {reviewer-manifest パス} --report {reviewer-manifest パスの .md を -report.json に置換したパス}
```

### 失敗タスクの再実行

タスクが失敗した場合、`--resume` で成功済みタスクをスキップして再実行できます：

```bash
clade-parallel run --resume {manifest パス} --report {report パス}
```

---

## plan-report の YAML フロントマター

並列実行を使う場合、planner（`/agent-planner`）が plan-report の先頭に YAML フロントマターを出力します。

### 基本的な構成例

```yaml
---
phase_scales:
  developer: medium   # small | medium | large
  reviewer: small

parallel_groups:
  group-a:
    phase: developer
    agent: worktree-developer
    read_only: false
    tasks: [T1, T2]
    writes:
      - src/feature-a/**

  group-b:
    phase: developer
    agent: worktree-developer
    read_only: false
    tasks: [T3, T4]
    writes:
      - src/feature-b/**

  code-review-group:
    phase: reviewer
    agent: code-reviewer
    read_only: true
    tasks: [review]

  security-review-group:
    phase: reviewer
    agent: security-reviewer
    read_only: true
    tasks: [security]
---
```

### フィールド一覧

#### phase_scales（タイムアウト自動解決）

| scale  | developer timeout | developer idle | reviewer timeout |
|--------|-------------------|----------------|-----------------|
| small  | 50分              | 40分           | 50分             |
| medium | 100分（デフォルト）| 60分           | 150分（デフォルト）|
| large  | 200分             | 80分           | 750分            |

#### parallel_groups のグループフィールド

| フィールド | 必須 | 説明 |
|---|---|---|
| `phase` | 推奨 | `developer` または `reviewer`。省略時は `developer` 扱い |
| `agent` | ○ | `worktree-developer` / `code-reviewer` / `security-reviewer` |
| `read_only` | ○ | YAML boolean。worktree-developer は `false`、レビュアーは `true` |
| `tasks` | ○ | このグループが担当するタスク ID のリスト |
| `writes` | △ | 書き込むファイルパターン（`read_only: false` のグループでは必須）。グループ間で重複禁止 |
| `depends_on` | — | 依存グループのキー名リスト |
| `timeout_sec` | — | 個別調整時のみ。通常は `phase_scales` から自動解決 |
| `max_retries` | — | 失敗時の最大リトライ回数（デフォルト 0） |
| `retry_delay_sec` | — | リトライ前の基本待機秒数（manifest v0.5+） |
| `retry_backoff_factor` | — | リトライ遅延の倍率（manifest v0.5+） |
| `concurrency_group` | — | コンカレンシーグループ名（manifest v0.7+） |

#### concurrency_limits（v0.7+）

`--max-workers` が全タスク横断の同時実行上限であるのに対し、`concurrency_limits` はグループ別の上限です。同じ Claude API を叩くタスクが多い場合にレート制限を避けるために使います。

```yaml
---
phase_scales:
  developer: medium

# claude-api グループのタスクは同時3つまで
concurrency_limits:
  claude-api: 3

parallel_groups:
  group-a:
    phase: developer
    agent: worktree-developer
    read_only: false
    tasks: [T1, T2]
    concurrency_group: claude-api
    writes:
      - src/feature-a/**

  group-b:
    phase: developer
    agent: worktree-developer
    read_only: false
    tasks: [T3, T4]
    concurrency_group: claude-api
    writes:
      - src/feature-b/**
---
```

---

## マニフェストバージョンの自動解決

`plan-to-manifest.js` は plan-report のフィールドに応じて manifest バージョンを自動決定します：

| 条件 | manifest バージョン |
|---|---|
| `concurrency_group` を使用 | v0.7 |
| `retry_delay_sec` / `retry_backoff_factor` を使用 | v0.5 |
| それ以外 | v0.4 |

---

## よくある誤り

| 誤り | 正しい書き方 |
|---|---|
| `read_only: "true"` | `read_only: true`（YAML boolean で書く） |
| `read_only: true` のタスクに `idle_timeout_sec` を設定 | `idle_timeout_sec` を削除する |
| reviewer グループで `phase:` を省略 | `phase: reviewer` と明示する |
| 複数ラウンドのグループを同一 plan-report に記載 | ラウンドごとに planner が新しいファイルを生成する |
| `writes` にグループ間で重複するパターンを書く | グループ間で書き込みファイルが重複しないよう分離する |

---

## settings.local.json の確認

worktree-developer は `settings.json` を読まず、`settings.local.json` のみを参照します。このファイルが存在しないと並列エージェントがファイル書き込みや git コマンドの権限を取得できず失敗します。

```json
{
  "permissions": {
    "allow": [
      "Read(**)", "Write(**)", "Edit(**)",
      "Glob(**)", "Grep(**)",
      "Bash(git:*)", "Bash(node*)"
    ]
  }
}
```

セットアップスクリプト（`setup.sh` / `setup.ps1`）を実行すると自動で配置されます。
