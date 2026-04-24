# /agent-planner コマンド

計画立案エージェント（planner）を起動する。親 Claude がユーザーとの Q&A を担当し、完了後にサブエージェントを一発起動して plan-report を生成する。

## 親 Claude の責務

このコマンドは親 Claude が直接実行する。サブエージェントは Q&A 完了後に一発起動する。

## 実行フロー

### Step 1: 上流レポートの読み込み

以下の順で最新レポートを検索・Read する:

1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 存在すれば最新を Read
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 存在すれば最新を Read

### Step 2: Q&A の実施

上流レポート（requirements-report / architecture-report）・既存 plan-report の有無に関わらず**必ず Q&A を実施する**（Q1 のスキップ条件は下記の通り）。

マイルストーンモード・優先度・各エージェントへの特記事項はユーザーの判断事項であり、既存レポートからは読み取れない。上流レポートが揃っていても Q&A をスキップしてはならない。

以下の質問を順番にテキストで出力してユーザーの回答を待つ（1問ずつ出力し、回答を受けてから次へ進む）。

**Q1: マイルストーンモードの確認**

（タスク数が多い・複数フェーズにまたがる大規模開発の場合のみ質問する。小規模な計画の場合はスキップ）

```
マイルストーン完了後の挙動を選択してください:
  [confirm] 各マイルストーン完了・コミット後に「続きを処理しますか？」の確認ダイアログを表示する
            （途中で作業を止めたい場合はこちら）
  [auto]    各マイルストーン完了・コミット後に確認なしで自動的に次のマイルストーンへ進む
            （今日中に全体を完了させたい場合はこちら）
```

**Q2: 優先度・着手順序の確認**

```
今回の計画で特に優先してほしい点はありますか？

・最初に着手してほしい機能・タスクはありますか？
・後回しにしてよいタスクはありますか？
・今回のサイクルでスコープ外にしてよい項目はありますか？
```

**Q3: 担当エージェントへの特記事項**

```
各エージェントへ特記事項はありますか？

・developer への注意点（実装で気をつけてほしいこと）
・tester への注意点（重点的にテストしてほしいこと）
・reviewer への注意点（重点的にレビューしてほしいこと）

特になければ「なし」と答えてください。
```

### Step 3: Q&A 結果の整理

ユーザーの回答を以下の構造に整理する:
- milestone_mode（confirm / auto / なし）
- 優先タスク・後回し可能なタスク
- 各エージェントへの特記事項

### Step 4: サブエージェントの一発起動

Agent ツールで `subagent_type: planner` を指定して起動する。プロンプトに以下を含める:

```
## 作業依頼
作業計画レポート（plan-report）の作成

## 上流レポートのパス
- requirements-report: {パス または「なし」}
- architecture-report: {パス または「なし」}

## ユーザーとの Q&A 結果

### Q1: マイルストーンモード
A: {confirm / auto / 小規模のため該当なし}

### Q2: 優先度・着手順序
A: {回答}

### Q3: 担当エージェントへの特記事項
A: {回答}

## 出力指示
- 出力先: `.claude/reports/plan-report-*.md`（write-report.js 経由）
- マイルストーンが存在する場合は plan-report 冒頭に `milestone_mode: {confirm|auto}` を必ず記載すること
- 最終メッセージにレポートファイルパスを必ず含めること（形式: `ファイル: .claude/reports/plan-report-YYYYMMDD-HHmmss.md`）
- AskUserQuestion / SendMessage は使わないこと
- レポート生成後は終了すること（承認確認は親 Claude が担当）

## YAML フロントマターの出力ルール

以下の3条件を**全て満たす**場合のみ、plan-report の**冒頭**（Markdown 本文より前）に
YAML フロントマターを出力する。満たさない場合はフロントマター自体を省略する。

**条件:**
1. 独立して実装できるタスクグループが 2つ以上存在する（互いに依存しない）
2. 各グループが担当するファイルが明確に分離できる
3. 共有インターフェース・型定義が事前に確定できる

**フォーマット:**

```yaml
---
parallel_groups:
  pre_implementation:          # 先行着手グループ（不要な場合はキーごと省略）
    tasks: [T0]
    agent: worktree-developer
    timeout_sec: 900           # 小規模:900 / 中規模:1800 / 大規模:3600
    idle_timeout_sec: 600      # 小規模:600 / 中規模:900 / 大規模:1200（worktree 起動60〜120秒+読み込み時間を考慮）
    read_only: false
    writes:
      - src/types/shared.ts
  group-a:
    name: {グループ名}
    tasks: [T1, T2]
    agent: worktree-developer
    depends_on: [pre_implementation]   # pre_implementation がある場合のみ
    timeout_sec: 1200
    idle_timeout_sec: 600
    read_only: false
    writes:
      - src/user/**
  group-b:
    name: {グループ名}
    tasks: [T3, T4]
    agent: worktree-developer
    depends_on: [pre_implementation]
    timeout_sec: 1200
    idle_timeout_sec: 600
    read_only: false
    writes:
      - src/auth/**
---
```

**フィールド説明:**

| フィールド | 内容 |
|---|---|
| `parallel_groups` | グループのマップ。キーは `pre_implementation` / `group-a` / `group-b` / ... |
| `group-*.name` | グループの表示名 |
| `group-*.tasks` | そのグループが担当するタスクID のリスト（インライン記法 `[T1, T2]` を使用）|
| `group-*.agent` | 実行エージェント。並列実装は `worktree-developer`、並列レビューは `code-reviewer` / `security-reviewer` |
| `group-*.timeout_sec` | 合計実行時間制限（秒）。省略時デフォルト 900。並列化箇所の推定時間に応じて調整する |
| `group-*.idle_timeout_sec` | 無音時間制限（秒）。**worktree-developer には必須**（小規模:600 / 中規模:900 / 大規模:1200）。`read_only: true` のグループには**設定禁止**（runner.py が強制 None にする） |
| `group-*.read_only` | YAML boolean で指定（`true` / `false`）。`worktree-developer` は `false`、`code-reviewer` / `security-reviewer` は `true` |
| `group-*.writes` | そのグループが書き込むファイルパターン（**グループ間で重複禁止**。`read_only: true` のグループでは省略）|
| `group-*.depends_on` | 依存グループのキー名リスト（インライン記法 `[pre_implementation]` を使用）|

**ファイルパターンの記法:**
- `src/user/**` — `src/user/` 配下の全ファイル
- `src/types/user.ts` — 特定の1ファイル
- `src/**/*.ts` — `src/` 配下の全 `.ts` ファイル

**`read_only: true` を使う場合（並列レビュー）の例:**
```yaml
---
parallel_groups:
  code-reviewer:
    phase: reviewer          # clade-parallel が reviewer フェーズで拾う
    tasks: [review]
    agent: code-reviewer
    timeout_sec: 600         # 小規模:600 / 中規模:1800 / 大規模:9000
    read_only: true
    # cwd は plan-to-manifest.js が自動で ../.. を付与（設定不要）
  security-reviewer:
    phase: reviewer
    tasks: [security]
    agent: security-reviewer
    timeout_sec: 600         # 小規模:600 / 中規模:1800 / 大規模:9000
    read_only: true
    # cwd は plan-to-manifest.js が自動で ../.. を付与（設定不要）
---
```
```

否認後の再生成時はプロンプトに以下を追加する:
```
## 再生成モード
- 前回レポート: {前回レポートパス}
- ユーザーからの修正指示: {指示内容}
```

### Step 5〜8: 承認フロー

`.claude/skills/agents/parent-workflow-common.md` の Step 5〜8 に従って実行する。変数は以下:

- `{report_baseName}`: `plan-report`
- `{approval_category}`: `plan`
- `{report_jp_name}`: `作業計画レポート`
- `{approval_target_jp}`: `計画`

---

## 用途
- 要件定義・アーキテクチャレポートを基にした作業計画の立案
- 各エージェントへのタスク割り振り
- 作業計画レポート（`plan-report-*.md`）の作成

## 注意
- ソースファイルの編集・書き込みは行わない
- 初回呼び出し時は `requirements-report`・`architecture-report` のみ参照（test/review レポートは未存在のためスキップ）
- 更新呼び出し時は全レポートを参照して差分を反映する（planner スキルファイルの実行モード判定ロジックに従う）
