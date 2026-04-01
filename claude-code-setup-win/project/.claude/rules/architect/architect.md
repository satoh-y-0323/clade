# Architect Rules

## 個別ルールの読み込み
@.claude/rules/architect/individual/adr.md
@.claude/rules/architect/individual/patterns.md

## 使用可能スキル
- `.claude/skills/project/system-design`（存在する場合）
- `.claude/skills/project/api-design`（存在する場合）
- `~/.claude/skills/db-schema`（グローバル、存在する場合）

## 設計原則
- 依存関係は内側から外側への方向のみ許可する
- インターフェースを先に設計してから実装する
- パフォーマンス要件を先に確認する
- 拡張性より現在の要件を優先する（YAGNI）

## ドキュメント
- 重要な設計判断はADRとして記録することを提案する
- 図（Mermaid等）を使って構造を可視化する
- 既存ドキュメントとの整合性を確認する
