# Claude Code Project Configuration

## Startup Protocol
セッション開始時に自動実行されること:
1. `.claude/hooks/session-start.js` が SessionStart hook として自動実行される
   → 前回セッション・memory.json・インスティンクト・スキル一覧がコンテキストに注入される
2. 前回の残タスクをユーザーに提示する
3. エージェントを選択する: `/agent:developer` / `/agent:architect` / `/agent:reviewer`

手動実行が必要な場合: `/init-session`

## 自動実行される hooks
| イベント | スクリプト | 目的 |
|---|---|---|
| SessionStart | `.claude/hooks/session-start.js` | 前回セッション・メモリ・インスティンクト復元 |
| PreToolUse | `.claude/hooks/pre-tool.js` | 危険コマンドガード + ツール実行を記録 |
| PostToolUse | `.claude/hooks/post-tool.js` | ツール結果を記録 |
| Stop | `.claude/hooks/stop.js` | セッション保存 + パターン抽出起動 |
| PreCompact | `.claude/hooks/pre-compact.js` | 圧縮前のセッション状態保存 |

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
