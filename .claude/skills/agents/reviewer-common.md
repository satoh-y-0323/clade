# Reviewer Common Rules

## 作業開始前の確認（共通手順）

以下を順番に確認してから作業を開始する（**存在するファイルのみ読み込む**）:
1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 存在すれば最新を Read（ユーザーの要望・完了条件を把握）
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 存在すれば最新を Read（設計の意図・インターフェース仕様を把握）
3. Glob で `.claude/reports/plan-report-*.md` を検索 → 存在すれば最新を Read（担当タスクと完了条件を確認）

## レポート出力フロー（共通）

### 通常サイズ: ヒアドキュメントで一括出力
```
node .claude/hooks/write-report.js <baseName> new <<'CLADE_REPORT_EOF'
{レポート内容の全て}
CLADE_REPORT_EOF
```
> **構文の注意**: `CLADE_REPORT_EOF` は**行頭から書くこと（インデント禁止）**。本文中に同じ文字列を単独行で含めないこと。

### 大規模レポート向け: 追記モードで分割出力
レポートが大きく一度に書けない場合は、セクションごとに分けて追記する:
```
# セクション1（新規作成 → 返却されたファイル名を控える）
node .claude/hooks/write-report.js <baseName> new <<'CLADE_REPORT_EOF'
{冒頭のセクション（ヘッダー・サマリ等）}
CLADE_REPORT_EOF
# → 例: [write-report] .claude/reports/code-review-report-20260401-143022.md

# セクション2以降（append で追記、ファイル名は上で控えたもの）
node .claude/hooks/write-report.js <baseName> append code-review-report-20260401-143022.md <<'CLADE_REPORT_EOF'
{続きのセクション}
CLADE_REPORT_EOF
```

### ⚠️ Bash が権限エラーで失敗した場合（最終手段）
**単独で諦めることは禁止。** 以下の手順で親Claudeに委譲すること:
1. レポートの全内容をそのままインラインで出力する
2. 以下のメッセージを明記して終了する:
   「Bash による書き込みが失敗しました。上記の内容を `.claude/reports/<baseName>-{タイムスタンプ}.md` に Write ツールで保存してください。」
