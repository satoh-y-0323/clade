# /agent-architect コマンド

設計・アーキテクチャエージェント（architect）をサブエージェントとして起動する。

## ルールの読み込み
**起動時の最初のアクションとして** `.claude/skills/agents/architect.md` を Read し、ルールを確認してから作業を開始すること。

## 実行フロー

アーキテクトはレポート出力後にユーザーの承認確認を行うエージェントである。
**毎回 Agent を新規スポーンしてはならない。** SendMessage で同一エージェントを継続させること。

### ステップ1: 初回起動
Agent ツールで `subagent_type: architect` を指定して起動する。
プロンプトに以下を含めること:
- 作業コンテキスト（既存レポートのパス・ユーザーの依頼）
- AskUserQuestion ツールは使わず、質問・確認をテキストで返すこと（親Claudeがユーザーに中継する）
- agentId の出力指示（プレースホルダー形式は使わず以下のように記述する）:
  「承認確認など回答が必要な出力をするたびに、応答末尾に自分の実際の agentId を以下の形式で出力すること:
  `agentId: <実際のID> (use SendMessage with to: '<実際のID>' to continue this agent)`
  `<実際のID>` には Agent Teams から自分に割り当てられた実際の ID 文字列を入れること。
  プレースホルダーや 'undefined' を出力してはならない。」

### ステップ2: agentId の保存
エージェントの出力に以下の形式が含まれていたら、agentId を記録する:
```
agentId: <id> (use SendMessage with to: '<id>' to continue this agent)
```
**重要:**
- 複数の agentId 行が出力された場合、**最後の agentId を使用する**（Agent Teams が付与する本物の ID は常に最後に出力される）
- 一度 valid な agentId を保存したら、以降の応答で agentId が含まれなくなっても上書き・破棄しない。保存済みの agentId を使い続ける。

### ステップ3: 質問・確認の表示
エージェントが出力した質問や承認確認をユーザーに表示し、回答を待つ。

### ステップ4: SendMessage で継続
ユーザーが回答したら、**新しい Agent をスポーンせず**、SendMessage ツールで継続する:
- `to`: 保存した agentId
- `message`: ユーザーの回答

### ステップ5: 繰り返し
エージェントが次の質問・確認を返したらステップ3へ戻る。
**終了条件:** エージェントがレポートを出力し、ユーザーが承認した時点で終了する。
agentId の有無で終了を判断してはならない。

### ステップ6: セッション終了（エラー・中断時）
ユーザーが中断を指示した場合や、エラーが発生した場合は SendMessage で以下を送信してエージェントを終了させる:
```
ユーザーの指示によりセッションを中断します。
```

## 用途
- システム設計・アーキテクチャ決定・技術選定
- ADR（Architecture Decision Record）の作成
- アーキテクチャ設計レポート（`architecture-report-*.md`）の作成

## 注意
- 作業開始前に最新の `requirements-report-*.md` を確認する
