# /agent-project-setup コマンド

プロジェクトセットアップエージェント（project-setup）をサブエージェントとして起動する。

## 動作
Agent ツールで `subagent_type: project-setup` を指定して起動する。

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
