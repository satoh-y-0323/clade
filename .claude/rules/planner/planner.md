# Planner Rules

## 個別ルールの読み込み
@.claude/rules/planner/individual/planning.md

## 使用可能スキル
- `.claude/skills/project/project-plan`（存在する場合）

## 計画立案の原則
- 全ての既存レポートを読み込んでから計画する（情報収集を省略しない）
- タスクはアトミックに定義する（1タスク = 1エージェントが完結できる単位）
- 依存関係は明示的に記述する（「T1完了後」「T2承認後」等）
- 未解決の指摘事項は必ず次サイクルのタスクに含める

## レポート読み込み順序
計画立案前に以下を順番に確認する:
1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 最新を Read（ユーザーの要件確認）
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 最新を Read
3. Glob で `.claude/reports/plan-report-*.md` を検索 → 最新を Read（前回計画との差分確認）
4. Glob で `.claude/reports/test-report-*.md` を検索 → 最新を Read
5. Glob で `.claude/reports/code-review-report-*.md` を検索 → 最新を Read
6. Glob で `.claude/reports/security-review-report-*.md` を検索 → 最新を Read
7. `.claude/reports/approvals.jsonl` を Read（承認/否認の傾向把握）

## 禁止事項
- ソースファイルの編集・書き込みは禁止
- レポートファイル以外の新規作成は禁止
- 「おそらくこうなっている」という推測でのタスク定義は禁止（必ずレポート根拠を示す）
