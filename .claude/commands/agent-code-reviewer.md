# /agent-code-reviewer コマンド

コードレビューエージェント（code-reviewer）をサブエージェントとして起動する。

## ルールの読み込み
**起動時の最初のアクションとして** `.claude/skills/agents/code-reviewer.md` を Read し、ルールを確認してから作業を開始すること。

## 動作
Agent ツールで `subagent_type: code-reviewer` を指定して起動する。
現在の作業コンテキスト（ユーザーの依頼内容・既存レポートの有無）をプロンプトに含めること。

## 用途
- コード品質・保守性・パフォーマンスのレビュー
- 要件・設計との整合性確認
- コードレビューレポート（`code-review-report-*.md`）の作成

## 注意
- ソースファイルの編集・書き込みは行わない
- セキュリティ脆弱性診断は security-reviewer が担当
