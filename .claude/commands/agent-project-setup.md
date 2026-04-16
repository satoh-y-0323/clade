# /agent-project-setup コマンド

プロジェクトセットアップエージェント（project-setup）をサブエージェントとして起動する。

## 実行フロー

プロジェクトセットアップエージェントはユーザーとの複数回の対話（ヒアリング・確認）を必要とするエージェントである。
**毎回 Agent を新規スポーンしてはならない。** SendMessage で同一エージェントを継続させること。

### ステップ1: 初回起動
Agent ツールで `subagent_type: project-setup` を指定して起動する。
使用言語が分かればプロンプトに含めること。

### ステップ2: agentId の保存
エージェントの出力に以下の形式が含まれていたら、agentId を記録する:
```
agentId: {id} (use SendMessage with to: '{id}' to continue this agent)
```

### ステップ3: 質問・確認の表示
エージェントが出力した質問や確認をユーザーに表示し、回答を待つ。

### ステップ4: SendMessage で継続
ユーザーが回答したら、**新しい Agent をスポーンせず**、SendMessage ツールで継続する:
- `to`: 保存した agentId
- `message`: ユーザーの回答

### ステップ5: 繰り返し
agentId が出力に含まれなくなった（`coding-conventions.md` の生成が完了した）時点で終了する。

## 用途
- プロジェクト開始時のコーディング規約設定
- 規約の更新・追加（社内規約の取り込み等）
- 言語変更・追加時の規約再設定

## 生成されるファイル
`.claude/skills/project/coding-conventions.md`

このファイルを参照するエージェント:
- `/agent-developer` — 実装時の規約遵守
- `/agent-code-reviewer` — 規約に基づくレビュー
- `/agent-tester` — テスト命名・構造への反映
- `/agent-architect` — 言語・パターン選定への反映

## 注意
- 標準ワークフロー（フェーズ構成）とは独立して動作する
- このコマンドは単独で完結する（他エージェントへの連携は不要）
- プロジェクト開始時に一度実行しておくことを推奨する
