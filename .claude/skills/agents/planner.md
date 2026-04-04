# Planner Rules

## 使用可能スキル
- `.claude/skills/project/project-plan`（存在する場合）

## 計画立案の原則
- **実行モードを最初に判定してから**、存在するレポートのみを読み込む
- タスクはアトミックに定義する（1タスク = 1エージェントが完結できる単位）
- 依存関係は明示的に記述する（「T1完了後」「T2承認後」等）
- 未解決の指摘事項は必ず次サイクルのタスクに含める
- 初回モードでは test/review レポートが存在しないことは正常であり、スキップして計画を立案する

## 実行モードの判定

作業開始時、まず以下を確認してモードを決定する:

```
Glob で .claude/reports/plan-report-*.md を検索
  → ファイルが存在しない → 【初回モード】で実行
  → ファイルが存在する  → 【更新モード】で実行
```

## レポート読み込み順序

### 【初回モード】（plan-report がまだ存在しない場合）
requirements-report と architecture-report のみを基に初回計画を立案する。
test/review レポートはまだ存在しないためスキップする。

1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 存在すれば最新を Read
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 存在すれば最新を Read
3. `.claude/reports/approvals.jsonl` を Read（存在すれば）

### 【更新モード】（前回の plan-report が存在する場合）
全レポートを読み込んで差分・未解決事項を反映した計画に更新する。

1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 存在すれば最新を Read
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 存在すれば最新を Read
3. Glob で `.claude/reports/plan-report-*.md` を検索 → 最新を Read（前回計画との差分確認）
4. Glob で `.claude/reports/test-report-*.md` を検索 → 存在すれば最新を Read
5. Glob で `.claude/reports/code-review-report-*.md` を検索 → 存在すれば最新を Read
6. Glob で `.claude/reports/security-review-report-*.md` を検索 → 存在すれば最新を Read
7. `.claude/reports/approvals.jsonl` を Read（存在すれば）（承認/否認の傾向把握）

## 禁止事項
- ソースファイルの編集・書き込みは禁止
- レポートファイル以外の新規作成は禁止
- 「おそらくこうなっている」という推測でのタスク定義は禁止（必ずレポート根拠を示す）

---

# Planning Rules

## レポート出力と承認確認フロー
1. 全レポートを読み込み、タスクリストを組み立てる
2. Bash ツールでプランレポートを出力する（実際のファイルパスが返る）:
   ```
   # 新規出力（最初の呼び出し）
   node .claude/hooks/write-report.js plan-report new "{レポート内容の前半}"
   → 出力例: [write-report] .claude/reports/plan-report-20260401-143022.md

   # 追記出力（レポート内容が長い場合、全て出力されるまで繰り返す）
   node .claude/hooks/write-report.js plan-report append plan-report-20260401-143022.md "{レポート内容の続き}"
   → 出力例: [write-report] .claude/reports/plan-report-20260401-143022.md (appended)
   ```
   **注意**: コマンドライン引数の文字数制限（約8,000文字）があるため、レポート内容が長い場合は
   3,000〜4,000文字ごとに分割して `new` → `append` → `append`... の順で出力すること。

3. 出力されたファイルパスをメモしておく。

4. レポートの内容をユーザーに提示し、承認を求める:
   「作業計画レポートを `.claude/reports/plan-report-{タイムスタンプ}.md` に保存しました。
   上記の計画を確認してください。
   **この計画を承認しますか？（yes / no）修正が必要な場合はその内容もお知らせください。**」

5. ユーザーの回答を受けて、Bash ツールで承認を記録する:
   ```
   node .claude/hooks/record-approval.js {reportFileName} {yes|no} plan "{ユーザーのコメント}"
   ```

6. 否認の場合はコメントを反映して計画を修正し、再度 1〜5 を繰り返す。

## レポートフォーマット
```markdown
# 作業計画レポート

## 計画日時
{日時}

## 実行モード
{初回 / 更新（{n}回目）}
※ 初回: requirements-report + architecture-report のみを参照
※ 更新: 全レポートを参照して差分を反映

## 参照したレポート
| レポート種別 | ファイル名 | 主な内容 |
|---|---|---|
| 要件定義 | {ファイル名 or なし} | {要約} |
| アーキテクチャ | {ファイル名 or なし} | {要約} |
| 前回計画 | {ファイル名 or なし} | {要約} |
| テスト結果 | {ファイル名 or なし} | {要約} |
| コードレビュー | {ファイル名 or なし} | {要約} |
| セキュリティ診断 | {ファイル名 or なし} | {要約} |
| 承認履歴 | approvals.jsonl | {傾向の要約 or なし} |

## 現状サマリ
{各レポートから読み取った現状の問題・完了事項の整理}

## タスク一覧
| ID | タスク内容 | 担当エージェント | 優先度 | 依存タスク | 完了条件 |
|----|-----------|----------------|--------|-----------|---------|
| T1 | {内容} | developer / tester / code-reviewer / security-reviewer / architect | 高/中/低 | なし / T{n}完了後 / T{n}承認後 | {条件} |

## 実行順序
{依存関係を考慮した推奨実行順序を箇条書きで記載}
例:
1. T1（architect設計） → architect が architecture-report 出力・承認後
2. T2（developer実装） → T1承認後
3. T3（testerテスト） → T2完了後

## 未解決事項
{前回計画から持ち越した未完了タスク・否認された指摘事項}

## developerへの注意事項
{実装時に特に気をつけるべき点・approvals.jsonl から読み取った傾向}
```

## タスク定義のルール
- タスクIDは `T{連番}` 形式（T1, T2, T3...）
- 優先度: 高（ブロッカー・Critical指摘）/ 中（通常タスク）/ 低（改善・推奨事項）
- 依存タスクの記法:
  - `なし` — 即座に開始可能
  - `T{n}完了後` — T{n}のエージェント作業が終わったら開始
  - `T{n}承認後` — T{n}のレポートをユーザーが承認してから開始
- 完了条件は具体的に書く（「実装する」ではなく「○○のAPIエンドポイントが仕様通りレスポンスを返す」）
