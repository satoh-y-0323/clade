# Claude Code Project Configuration

## Startup Protocol
セッション開始時に必ず以下を実行する:
1. `~/.claude/hooks/session-start.sh` が自動実行される（SessionStart hook）
2. 前回セッションの残タスクをユーザーに提示する
3. プロジェクト固有インスティンクトを読み込む

## Global Rules
@rules/core.md

## Available Agents
エージェントはカスタムコマンドで選択する:
- `/agent:architect` → 設計・アーキテクチャ担当
- `/agent:developer` → 実装・テスト・デバッグ担当
- `/agent:reviewer`  → コードレビュー・品質確認担当

## Project Context
プロジェクト固有スキルが存在する場合は自動適用される:
- `.claude/skills/project/` 配下のファイル

## Notes
- セッション終了時は必ず `/end-session` を実行すること
- パターン昇格は `/cluster-promote` で行う
- グローバル展開は `/promote` で行う
