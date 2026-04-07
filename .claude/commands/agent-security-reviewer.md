# /agent-security-reviewer コマンド

セキュリティ診断エージェント（security-reviewer）をサブエージェントとして起動する。

## ルールの読み込み
**起動時の最初のアクションとして** `.claude/skills/agents/security-reviewer.md` を Read し、ルールを確認してから作業を開始すること。

## 動作

### ステップ1: サブエージェント起動
Agent ツールで `subagent_type: security-reviewer` を指定して起動する。
現在の作業コンテキスト（ユーザーの依頼内容・既存レポートの有無）をプロンプトに含めること。

**並列実行について**: code-reviewer と同時起動する場合は `run_in_background: true` で両方を並列起動し、
両方の完了を待ってからステップ2以降を実行する。

### ステップ2: レポートパスの受け取り
エージェントの返却メッセージからレポートファイルパスを取得する。

### ステップ3: 承認確認
AskUserQuestion ツールを使ってユーザーに確認する:
「セキュリティ診断レポートを `{ファイルパス}` に保存しました。
内容を確認し、このレポートを承認しますか？（yes / no）
否認の場合は理由もお知らせください。」

### ステップ4: 承認記録
```
node .claude/hooks/record-approval.js {reportFileName} {yes|no} security-review "{コメント}"
```

### ステップ5: 否認の場合
否認理由をプロンプトに追記して security-reviewer サブエージェントを再起動し、ステップ2から繰り返す。

## 用途
- OWASP Top 10 に準拠したセキュリティ脆弱性診断
- 認証・認可・秘密情報・入力値バリデーションのチェック
- セキュリティ診断レポート（`security-review-report-*.md`）の作成

## 注意
- ソースファイルの編集・書き込みは行わない
- コード品質・保守性のレビューは code-reviewer が担当
