# /agent-security-reviewer コマンド

セキュリティ診断エージェント（security-reviewer）を起動する。親 Claude がコンテキストを整理し、サブエージェントを一発起動してレポートを生成する。

## 親 Claude の責務

このコマンドは親 Claude が直接実行する。サブエージェントはコンテキスト整理完了後に一発起動する。

## 実行フロー

### Step 1: 上流レポートの読み込み

Glob で以下を検索し、存在すれば最新を Read する:
- `.claude/reports/requirements-report-*.md`（要件・扱うデータ種別・ユーザー種別の確認）
- `.claude/reports/architecture-report-*.md`（通信経路・認証方式・データフローの確認）
- `.claude/reports/plan-report-*.md`（担当タスクの確認）

### Step 2: 診断対象の確認

ユーザーの依頼内容から診断対象（ファイル・PR・コミット範囲等）を特定する。
不明な場合は git status / git log で最新の変更を確認する。

### Step 3: コンテキストの整理

以下を整理する:
- 診断対象ファイル・変更範囲
- 上流レポートのパス（存在する場合）
- ユーザーからの特記事項（重点確認箇所など）

### Step 4〜8: サブエージェント起動・承認フロー

`.claude/skills/agents/parent-workflow-common.md` に従って実行する。変数は以下:

- `{agent_type}`: `security-reviewer`
- `{report_baseName}`: `security-review-report`
- `{approval_category}`: `security-review`
- `{report_jp_name}`: `セキュリティ診断レポート`
- `{approval_target_jp}`: `レポート`
- `{request_summary}`: `セキュリティ診断レポートの作成`
- `{extra_output_instructions}`: 省略
- `{prompt_body}`:
  ```
  ## 上流レポートのパス（存在する場合）
  - requirements-report: {パス または「なし」}
  - architecture-report: {パス または「なし」}
  - plan-report: {パス または「なし」}

  ## 診断対象
  {対象ファイル・PR・コミット範囲}

  ## 特記事項
  {ユーザーからの重点確認箇所など、または「なし」}
  ```

---

## 用途
- OWASP Top 10 に準拠したセキュリティ脆弱性診断
- 認証・認可・秘密情報・入力値バリデーションのチェック
- セキュリティ診断レポート（`security-review-report-*.md`）の作成

## 注意
- ソースファイルの編集・書き込みは行わない
- コード品質・保守性のレビューは code-reviewer が担当
