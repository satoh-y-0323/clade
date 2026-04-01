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

## レポート出力と承認確認フロー
1. Bash ツールでレポートを出力する（実際のファイルパスが返る）:
   ```
   node .claude/hooks/write-report.js architecture-report "{レポート内容}"
   ```
   → 出力例: `[write-report] .claude/reports/architecture-report-20260401-143022.md`

2. 出力されたファイルパスをメモしておく。

3. レポートの内容をユーザーに提示し、承認を求める:
   「アーキテクチャ設計レポートを `.claude/reports/architecture-report-{タイムスタンプ}.md` に保存しました。
   上記の設計内容を確認してください。
   **この設計を承認しますか？（yes / no）修正が必要な場合はその内容もお知らせください。**」

4. ユーザーの回答を受けて、Bash ツールで承認を記録する:
   ```
   node .claude/hooks/record-approval.js {reportFileName} {yes|no} architecture "{ユーザーのコメント}"
   ```

## レポートフォーマット
```markdown
# アーキテクチャ設計レポート

## 設計日時
{日時}

## 設計対象
{対象機能・システム}

## 設計概要
{何を設計したか・主要な決定事項}

## アーキテクチャ図
```mermaid
{構成図・シーケンス図等}
```

## 設計の詳細
### コンポーネント構成
{各コンポーネントの役割と関係}

### インターフェース定義
{API・関数シグネチャ等}

### データフロー
{データの流れ・変換}

## トレードオフ
| 選択肢 | メリット | デメリット | 採用 |
|---|---|---|---|
| {A} | {メリット} | {デメリット} | ○/✗ |

## plannerへの引き継ぎ事項
{実装時の注意点・依存関係・制約条件}

## ADR作成の推奨
{ADRを作成すべき設計判断とその理由}
```
