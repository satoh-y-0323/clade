# Reviewer Common Rules

## 作業開始前の確認（共通手順）

以下を順番に確認してから作業を開始する（**存在するファイルのみ読み込む**）:
1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 存在すれば最新を Read（ユーザーの要望・完了条件を把握）
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 存在すれば最新を Read（設計の意図・インターフェース仕様を把握）
3. Glob で `.claude/reports/plan-report-*.md` を検索 → 存在すれば最新を Read（担当タスクと完了条件を確認）

## レポート出力フロー（共通）

> ⚠️ **必ず Write ツールで一時ファイルに本文を保存してから、`write-report.js --file <path>` で読み込ませること。**
> Bash のヒアドキュメント経由（`<<'CLADE_REPORT_EOF'`）は Claude Code の permissions チェッカーで拒否されることがある。`--file` 方式は Bash コマンドを 100 文字程度に保つため、この問題を回避できる。
>
> ⚠️ **必ず相対パス `node .claude/hooks/write-report.js` で呼び出すこと。絶対パス禁止。**
> 絶対パスは `permissions.allow` のパターン（`Bash(node .claude/hooks/write-report.js*)`）にマッチせず拒否される場合がある。

### Step 1: レポート本文を一時ファイルに Write
Write ツールで `.claude/tmp/<baseName>.md` にレポート全文を書き込む。
- **長さ制約なし。何文字でも書ける**（heredoc を使わないため）
- baseName 例: `code-review-report` / `security-review-report` / `test-report`
- `.claude/tmp/` は .gitignore 対象なので、作業中に作成されたファイルは git に含まれない

### Step 2: write-report.js --file で実レポートに保存
```
node .claude/hooks/write-report.js <baseName> new --file .claude/tmp/<baseName>.md
# → 例: [write-report] .claude/reports/code-review-report-20260401-143022.md
```

返却されたファイル名（`code-review-report-20260401-143022.md` の部分）を控えておく。

### 追記する場合（既存レポートに追加）
追記内容を Write ツールで `.claude/tmp/<baseName>.md` に上書き保存してから:
```
node .claude/hooks/write-report.js <baseName> append <fileName> --file .claude/tmp/<baseName>.md
```
`<fileName>` は Step 2 で控えたファイル名（タイムスタンプ付き）。

### ⚠️ Bash が権限エラーで失敗した場合（最終手段）
**単独で諦めることは禁止。** 以下の手順で親Claudeに委譲すること:
1. レポートの全内容をそのままインラインで出力する
2. 以下のメッセージを明記して終了する:
   「Bash による書き込みが失敗しました。上記の内容を `.claude/reports/<baseName>-{タイムスタンプ}.md` に Write ツールで保存してください。」
