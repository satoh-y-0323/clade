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
phase_scales:
  developer: medium   # developer フェーズ全体のデフォルト scale（small | medium | large）
  reviewer: small     # reviewer フェーズ全体のデフォルト scale（small | medium | large）

parallel_groups:
  pre_implementation:          # 先行着手グループ（不要な場合はキーごと省略）
    tasks: [T0]
    agent: worktree-developer
    read_only: false
    writes:
      - src/types/shared.ts
  group-a:
    name: {グループ名}
    tasks: [T1, T2]
    agent: worktree-developer
    depends_on: [pre_implementation]   # pre_implementation がある場合のみ
    read_only: false
    writes:
      - src/user/**
  group-b:
    name: {グループ名}
    tasks: [T3, T4]
    agent: worktree-developer
    depends_on: [pre_implementation]
    read_only: false
    writes:
      - src/auth/**
---
```

## scale の指定（phase_scales）

plan-report のフロントマター冒頭（`parallel_groups` より上）に `phase_scales` を記述する。
各 phase に対して small / medium / large のいずれかを指定する。

### scale の判断基準
タスクの規模感・複雑度から質的に判断する。以下は目安:

| scale  | 担当タスク数の目安 | 想定シナリオ |
|--------|-----|-------------|
| small  | 1〜2 | 小さな修正・単一ファイルの追加 |
| medium | 3〜5 | 通常の機能追加（デフォルト） |
| large  | 6以上 | 大規模リファクタ・複数サブシステムの同時更新 |

タスク数は目安であり、1タスクでも I/O が多い・ビルドが重い場合は large を選んでよい。

### 個別調整が必要なグループ
原則は `phase_scales` のみ書くこと。特定グループだけ timeout を変えたい場合のみ、そのグループに `timeout_sec` を直書きする（グループ直書きが phase_scales より優先される）。

```yaml
  group-heavy:
    tasks: [T5]
    agent: worktree-developer
    timeout_sec: 3600  # このグループだけ延長（phase_scales より優先される）
    read_only: false
    writes:
      - src/heavy/**
```

**フィールド説明:**

| フィールド | 内容 |
|---|---|
| `phase_scales` | フェーズ単位の scale マップ。キーは phase 名（`developer` / `reviewer`）、値は `small` / `medium` / `large` |
| `parallel_groups` | グループのマップ。キーは `pre_implementation` / `group-a` / `group-b` / ... |
| `group-*.name` | グループの表示名 |
| `group-*.tasks` | そのグループが担当するタスクID のリスト（インライン記法 `[T1, T2]` を使用）|
| `group-*.agent` | 実行エージェント。並列実装は `worktree-developer`、並列レビューは `code-reviewer` / `security-reviewer` |
| `group-*.timeout_sec` | 合計実行時間制限（秒）。通常は `phase_scales` から自動解決されるため省略可。個別調整時のみ直書きする |
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
phase_scales:
  reviewer: small     # reviewer フェーズ全体のデフォルト scale

parallel_groups:
  code-reviewer:
    phase: reviewer          # clade-parallel が reviewer フェーズで拾う
    tasks: [review]
    agent: code-reviewer
    read_only: true
    # cwd は plan-to-manifest.js が自動で ../.. を付与（設定不要）
    # idle_timeout_sec は runner.py が read_only で強制 None にするため設定不要
  security-reviewer:
    phase: reviewer
    tasks: [security]
    agent: security-reviewer
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

### Step 5: レポートパスの受け取り

サブエージェントの最終出力から正規表現 `.claude/reports/plan-report-\d{8}-\d{6}\.md` でレポートファイルパスを抽出する。

### Step 6: 承認確認

ユーザーに以下をテキストで提示する:

```
作業計画レポートを `{ファイルパス}` に保存しました。内容を確認して、この計画を承認しますか？（yes / no）
修正が必要な場合はその内容もお知らせください。
```

### Step 7: 承認記録

シェルインジェクション対策としてコメントは tmp ファイル経由で渡す:

1. `node .claude/hooks/clear-tmp-file.js --path .claude/tmp/approval-comment.md` を実行
2. Write ツールで `.claude/tmp/approval-comment.md` にユーザーの承認コメントを書き込む（コメントなしの場合は空文字列）
3. 以下を実行:

```bash
node .claude/hooks/record-approval.js {ファイル名} {yes|no} plan --comment-file .claude/tmp/approval-comment.md
```

### Step 8: 否認時の再起動

否認の場合、修正指示と前レポートパスを含めた新プロンプトで Step 4 から繰り返す。

---

## 用途
- 要件定義・アーキテクチャレポートを基にした作業計画の立案
- 各エージェントへのタスク割り振り
- 作業計画レポート（`plan-report-*.md`）の作成

## 注意
- ソースファイルの編集・書き込みは行わない
- 初回呼び出し時は `requirements-report`・`architecture-report` のみ参照（test/review レポートは未存在のためスキップ）
- 更新呼び出し時は全レポートを参照して差分を反映する（planner スキルファイルの実行モード判定ロジックに従う）
