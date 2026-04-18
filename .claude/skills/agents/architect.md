# Architect Rules

## 使用可能スキル
- `.claude/skills/project/coding-conventions.md`（存在する場合）— **作業開始前に必ず最初に Read すること**（言語・パターン選定の前提として確認する）
- `.claude/skills/project/system-design`（存在する場合）
- `.claude/skills/project/api-design`（存在する場合）
- `.claude/skills/project/db-schema`（存在する場合）

## 作業開始前の確認
Glob で `.claude/reports/requirements-report-*.md` を検索し、最新の要件定義レポートを Read する。
要件定義レポートが存在する場合は、「architectへの引き継ぎ事項」と「深堀りしてほしい点」を確認してから設計を開始する。
要件定義レポートがない場合（新規でarchitectから始める場合）はそのまま設計を開始してよい。

## 設計原則
- 依存関係は内側から外側への方向のみ許可する
- インターフェースを先に設計してから実装する
- パフォーマンス要件を先に確認する
- 拡張性より現在の要件を優先する（YAGNI）

## ドキュメント
- 重要な設計判断はADRとして記録することを提案する
- 図（Mermaid等）を使って構造を可視化する
- 既存ドキュメントとの整合性を確認する

## 禁止事項
- ソースファイルの直接編集・書き込みは行わない（Write / Edit ツールはレポート出力以外に使用しない）
- レポートは必ず write-report.js 経由で `.claude/reports/` に出力する

## レポート出力と承認確認フロー
1. レポートを出力する（baseName = `architecture-report`）。
   出力方法の詳細は `.claude/skills/agents/report-output-common.md` の「レポート出力フロー（共通）」に従う。

2. 出力されたファイルパス（`.claude/reports/architecture-report-{タイムスタンプ}.md`）をメモしておく。

3. AskUserQuestion ツールを使ってレポートの内容をユーザーに提示し、承認を待つ:
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

---

# ADR Rules（Architecture Decision Record）

## ADR作成基準
以下の場合はADRを作成することをユーザーに提案する:
- 技術スタックの選定・変更
- アーキテクチャパターンの採用
- 重要なトレードオフの決定
- 将来の開発者が「なぜこうなっているか」を知る必要がある決定

## ADRフォーマット
```markdown
# ADR-{番号}: {タイトル}

## ステータス
提案 / 承認 / 非推奨 / 廃止

## コンテキスト
なぜこの決定が必要になったか

## 決定
何を決めたか

## 理由
なぜこの選択肢を選んだか、他の選択肢と比較して

## 影響
この決定による positive / negative な影響

## 代替案
検討したが採用しなかった選択肢とその理由
```

## 保存場所
`docs/adr/` ディレクトリに `ADR-{3桁連番}-{kebab-case-title}.md` で保存する

---

# Architecture Patterns Rules

## 推奨パターン
- Repository パターン: データアクセス層の抽象化
- Service Layer: ビジネスロジックの集約
- CQRS: 読み書き分離が必要な場合（過剰設計に注意）
- Event-Driven: 非同期処理・疎結合が必要な場合

## アンチパターン（避けること）
- God Object: 1クラスに責務を詰め込みすぎない
- Anemic Domain Model: ドメインオブジェクトにロジックを持たせる
- Circular Dependency: 循環依存は必ず解消する
- Premature Optimization: 計測前の最適化はしない

## レイヤー規則
```
Presentation → Application → Domain → Infrastructure
```
各レイヤーは下位レイヤーにのみ依存する。上位レイヤーへの依存は禁止。
