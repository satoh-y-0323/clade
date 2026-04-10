# Reviewer Common Rules

## 作業開始前の確認（共通手順）

以下を順番に確認してから作業を開始する（**存在するファイルのみ読み込む**）:
1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 存在すれば最新を Read（ユーザーの要望・完了条件を把握）
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 存在すれば最新を Read（設計の意図・インターフェース仕様を把握）
3. Glob で `.claude/reports/plan-report-*.md` を検索 → 存在すれば最新を Read（担当タスクと完了条件を確認）

## レポート出力の注意事項

ヒアドキュメント（`<<'CLADE_REPORT_EOF'`）で渡すことで改行が保持され、コマンドライン引数の文字数制限も回避できる。シングルクォート・バッククォートなどの特殊文字も verbatim に扱われる。レポート内容を分割する必要はない。

```
node .claude/hooks/write-report.js <baseName> new <<'CLADE_REPORT_EOF'
{レポート内容の全て}
CLADE_REPORT_EOF
```

> **構文の注意**: `CLADE_REPORT_EOF` は**行頭から書くこと（インデント禁止）**。
> 本文中に `CLADE_REPORT_EOF` が単独行で現れると途中終了するため、terminator と同じ文字列を本文に含めないこと。
> シングルクォート付き `<<'CLADE_REPORT_EOF'` のため、本文中の特殊文字（`` ` ``・`$`・`'` 等）はそのまま書いて問題ない。
