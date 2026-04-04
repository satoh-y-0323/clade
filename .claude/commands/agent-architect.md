# /agent-architect コマンド

設計・アーキテクチャエージェント（architect）をサブエージェントとして起動する。

## ルールの読み込み
**起動時の最初のアクションとして** `.claude/skills/agents/architect.md` を Read し、ルールを確認してから作業を開始すること。

## 動作
Agent ツールで `subagent_type: architect` を指定して起動する。
現在の作業コンテキスト（ユーザーの依頼内容・既存レポートの有無）をプロンプトに含めること。

## 用途
- システム設計・アーキテクチャ決定・技術選定
- ADR（Architecture Decision Record）の作成
- アーキテクチャ設計レポート（`architecture-report-*.md`）の作成

## 注意
- 作業開始前に最新の `requirements-report-*.md` を確認する
