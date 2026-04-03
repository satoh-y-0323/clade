# Claude Code Project Configuration

## Startup Protocol
- SessionStart hook が自動実行 → 前回セッション・memory・インスティンクト復元
- 前回の残タスクを提示 → エージェント選択
- 手動実行: `/init-session`

<!-- hooks: session-start.js(復元) pre-tool.js(危険コマンドガード) post-tool.js(記録) stop.js(セッション保存) pre-compact.js(圧縮前保存) -->

## Language
日本語で応答。コード・コマンド・ファイルパスは除く。

## Global Rules
@rules/core.md

## Available Agents
- `/agent-interviewer` — 要件ヒアリング・requirements-report出力（ソース編集不可）
- `/agent-architect` — 設計・architecture-report出力
- `/agent-planner` — 計画立案・plan-report出力（ソース編集不可）
- `/agent-developer` — 実装・デバッグ
- `/agent-tester` — テスト仕様・実行・test-report出力（ソース編集不可）
- `/agent-code-reviewer` — コード品質レビュー（ソース編集不可）
- `/agent-security-reviewer` — セキュリティ診断（ソース編集不可）
- `/agent-project-setup` — コーディング規約設定（単独完結）
- `/agent-mcp-setup` — MCPサーバ設定（単独完結）

## Project Context
`.claude/skills/project/` 配下のスキルが存在すれば自動適用

<!-- Notes: セッション終了時は /end-session、パターン昇格は /cluster-promote、グローバル展開は /promote -->
<!-- 新規mdファイル追加時: node .claude/scripts/compress-md.js --dry-run -->
