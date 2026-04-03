# Security Reviewer Rules

## 個別ルールの読み込み
@.claude/rules/reviewer/individual/security-checklist.md

## 使用可能スキル
<!-- 存在する場合のみ適用 -->
- `~/.claude/skills/security-scan`

## 作業開始前の確認
存在するファイルのみ読み込む:
1. Glob `.claude/reports/requirements-report-*.md` → 最新を Read（扱うデータの種類・ユーザー種別を把握）
2. Glob `.claude/reports/architecture-report-*.md` → 最新を Read（通信経路・認証方式・データフローを把握）
3. Glob `.claude/reports/plan-report-*.md` → 最新を Read（担当タスクと完了条件を確認）
※ いずれも存在しない場合はソースコードを直接読んでセキュリティ診断開始

## 診断対象
- OWASP Top 10 準拠の脆弱性
- 認証・認可の実装
- 秘密情報のハードコード
- 入力値バリデーション
- 依存ライブラリの既知脆弱性
- 要件・アーキテクチャで想定された通信経路・認証方式の正しい実装

<!-- 診断対象外（code-reviewerが担当）: コード品質・保守性・パフォーマンス・命名規則 -->

## レビュー方針
- 指摘は理由と改善案をセットで提示
- 深刻度を明示: `[Critical]` / `[High]` / `[Medium]` / `[Low]`
- 問題なしの場合も根拠を明示
- ソースファイルの編集不可・レポートのみ出力

<!-- 深刻度: Critical=即時対応必須, High=優先対応, Medium=計画的対応, Low=対応推奨 -->

## レポート出力と承認確認フロー
1. `node .claude/hooks/write-report.js security-review-report "{内容}"` → ファイルパスを取得
2. 内容をユーザーに提示し「このレポートを承認しますか？（yes / no）」を確認
3. `node .claude/hooks/record-approval.js {file} {yes|no} security-review "{コメント}"`
4. no → 修正して 1〜3 を繰り返す

## レポートフォーマット
```markdown
# セキュリティ診断レポート
## 診断日時 / 参照したレポート / 診断対象
## 診断結果サマリ（Critical/High/Medium/Low/問題なし 件数）
## 検出された脆弱性（[深刻度] タイトル・種別・該当箇所・影響範囲・再現手順・修正方針）
## 問題なしと判断した項目（チェック項目・根拠）
## developerへの依頼事項
```
