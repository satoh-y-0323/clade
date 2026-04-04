# /agent-security-reviewer コマンド

セキュリティ診断エージェント（security-reviewer）をサブエージェントとして起動する。

## ルールの読み込み
**起動時の最初のアクションとして** `.claude/skills/agents/security-reviewer.md` を Read し、ルールを確認してから作業を開始すること。

## 動作
Agent ツールで `subagent_type: security-reviewer` を指定して起動する。
現在の作業コンテキスト（ユーザーの依頼内容・既存レポートの有無）をプロンプトに含めること。

## 用途
- OWASP Top 10 に準拠したセキュリティ脆弱性診断
- 認証・認可・秘密情報・入力値バリデーションのチェック
- セキュリティ診断レポート（`security-review-report-*.md`）の作成

## 注意
- ソースファイルの編集・書き込みは行わない
- コード品質・保守性のレビューは code-reviewer が担当
