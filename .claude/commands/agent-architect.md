# /agent-architect コマンド

設計・アーキテクチャエージェント（architect）をサブエージェントとして起動する。

## ルールの読み込み
**起動時の最初のアクションとして** `.claude/skills/agents/architect.md` を Read し、ルールを確認してから作業を開始すること。

## 実行フロー

アーキテクトはレポート出力後にユーザーの承認確認を行うエージェントである。
**毎回 Agent を新規スポーンしてはならない。** SendMessage で同一エージェントを継続させること。

### ステップ1: 初回起動
Agent ツールで `subagent_type: architect` を指定して起動する。
プロンプトに作業コンテキスト（既存レポートのパス・ユーザーの依頼）を含めること。

### ステップ2: agentId の保存
エージェントの出力に以下の形式が含まれていたら、agentId を記録する:
```
agentId: {id} (use SendMessage with to: '{id}' to continue this agent)
```

### ステップ3: 質問・確認の表示
エージェントが出力した質問や承認確認をユーザーに表示し、回答を待つ。

### ステップ4: SendMessage で継続
ユーザーが回答したら、**新しい Agent をスポーンせず**、SendMessage ツールで継続する:
- `to`: 保存した agentId
- `message`: ユーザーの回答

### ステップ5: 繰り返し
agentId が出力に含まれなくなった（レポート出力・承認確認が完了した）時点で終了する。

## 用途
- システム設計・アーキテクチャ決定・技術選定
- ADR（Architecture Decision Record）の作成
- アーキテクチャ設計レポート（`architecture-report-*.md`）の作成

## 注意
- 作業開始前に最新の `requirements-report-*.md` を確認する
