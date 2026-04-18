# Reviewer Common Rules

## 作業開始前の確認（共通手順）

以下を順番に確認してから作業を開始する（**存在するファイルのみ読み込む**）:
1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 存在すれば最新を Read（ユーザーの要望・完了条件を把握）
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 存在すれば最新を Read（設計の意図・インターフェース仕様を把握）
3. Glob で `.claude/reports/plan-report-*.md` を検索 → 存在すれば最新を Read（担当タスクと完了条件を確認）

## レポート出力フロー（共通）

> ⚠️ **必ず分割出力すること。1回の Bash コマンド（ヒアドキュメント含む）は 2000 文字以内に収めること。**
> これは Claude Code の権限チェックの制約であり、超過すると Bash が無条件に拒否される。
>
> ⚠️ **必ず相対パス `node .claude/hooks/write-report.js` で呼び出すこと。絶対パス禁止。**
> 絶対パスは `permissions.allow` のパターン（`Bash(node .claude/hooks/write-report.js*)`）にマッチせず、短いコマンドでも拒否される場合がある。

### Step 1: ヘッダー部分を `new` モードで出力（返却されたファイル名を控える）
```
node .claude/hooks/write-report.js <baseName> new <<'CLADE_REPORT_EOF'
{ヘッダー・サマリ等（タイトル・日時・参照レポート・対象・サマリテーブル）}
CLADE_REPORT_EOF
# → 例: [write-report] .claude/reports/code-review-report-20260401-143022.md
```

### Step 2 以降: 詳細セクションを `append` モードで追記（1回 2000 文字以内）
```
node .claude/hooks/write-report.js <baseName> append code-review-report-20260401-143022.md <<'CLADE_REPORT_EOF'
{詳細セクション（指摘事項・修正依頼・総評など）}
CLADE_REPORT_EOF
```
2000 文字を超えるセクションはさらに分割して複数回 append する。

> **構文の注意**: `CLADE_REPORT_EOF` は**行頭から書くこと（インデント禁止）**。本文中に同じ文字列を単独行で含めないこと。

### ⚠️ Bash が権限エラーで失敗した場合（最終手段）
**単独で諦めることは禁止。** 以下の手順で親Claudeに委譲すること:
1. レポートの全内容をそのままインラインで出力する
2. 以下のメッセージを明記して終了する:
   「Bash による書き込みが失敗しました。上記の内容を `.claude/reports/<baseName>-{タイムスタンプ}.md` に Write ツールで保存してください。」
