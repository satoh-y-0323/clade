# Reviewer Common Rules

## 作業開始前の確認（共通手順）

以下を順番に確認してから作業を開始する（**存在するファイルのみ読み込む**）:
1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 存在すれば最新を Read（ユーザーの要望・完了条件を把握）
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 存在すれば最新を Read（設計の意図・インターフェース仕様を把握）
3. Glob で `.claude/reports/plan-report-*.md` を検索 → 存在すれば最新を Read（担当タスクと完了条件を確認）

## レポート出力の注意事項

**推奨: --file 方式**（特殊文字・改行・文字数制限をすべて回避）

1. Write ツールでレポート内容を一時ファイルに保存する（例: `/tmp/clade-report.md`）
2. Bash ツールで write-report.js に渡す:
   ```
   node .claude/hooks/write-report.js <baseName> new --file /tmp/clade-report.md
   ```
   → 出力例: `[write-report] .claude/reports/<baseName>-20260401-143022.md`

一時ファイルのパスは `/tmp/clade-report-{yyyymmdd}.md` など衝突しない名前にすること。
