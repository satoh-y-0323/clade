# Planner Rules

## 個別ルールの読み込み
@.claude/rules/planner/individual/planning.md

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
