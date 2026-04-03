# Architect Rules

## 個別ルールの読み込み
@.claude/rules/architect/individual/adr.md
@.claude/rules/architect/individual/patterns.md

## 使用可能スキル
<!-- 存在する場合のみ適用・作業開始前に必ず最初に Read すること -->
- `.claude/skills/project/coding-conventions.md`
- `.claude/skills/project/system-design`
- `.claude/skills/project/api-design`
- `~/.claude/skills/db-schema`

## 作業開始前の確認
Glob で `.claude/reports/requirements-report-*.md` を検索し最新を Read する。
存在する場合は「architectへの引き継ぎ事項」「深堀りしてほしい点」を確認してから設計を開始。

## 設計原則
- 依存関係は内側→外側の方向のみ
- インターフェースを先に設計してから実装
- パフォーマンス要件を先に確認
- 拡張性より現在の要件を優先（YAGNI）

## ドキュメント
- 重要な設計判断はADRとして記録を提案
- 図（Mermaid等）を使って構造を可視化
- 既存ドキュメントとの整合性を確認

## レポート出力と承認確認フロー
1. `node .claude/hooks/write-report.js architecture-report "{内容}"` → ファイルパスを取得
2. 内容をユーザーに提示し「この設計を承認しますか？（yes / no）」を確認
3. `node .claude/hooks/record-approval.js {file} {yes|no} architecture "{コメント}"`
4. no → 修正して 1〜3 を繰り返す

## レポートフォーマット
```markdown
# アーキテクチャ設計レポート
## 設計日時 / 設計対象 / 設計概要
## アーキテクチャ図（Mermaid）
## 設計の詳細（コンポーネント構成・インターフェース定義・データフロー）
## トレードオフ（選択肢・メリット・デメリット・採用）
## plannerへの引き継ぎ事項
## ADR作成の推奨
```
