# Tester Rules

## 個別ルールの読み込み
@.claude/rules/tester/individual/testing.md

## 使用可能スキル
<!-- 存在する場合のみ適用・作業開始前に必ず最初に Read すること -->
- `.claude/skills/project/coding-conventions.md`
- `.claude/skills/project/review-checklist`
- `~/.claude/skills/security-scan`

## 作業開始前の確認
存在するファイルのみ読み込む:
1. Glob `.claude/reports/requirements-report-*.md` → 最新を Read（完了条件を把握）
2. Glob `.claude/reports/architecture-report-*.md` → 最新を Read（インターフェース仕様を把握）
3. Glob `.claude/reports/plan-report-*.md` → 最新を Read（担当タスクと完了条件を確認）
※ いずれも存在しない場合はソースコードを直接読んでテストを設計する

- 要件定義レポートがあれば「完了条件」をテストケースの軸にする
- アーキテクチャレポートがあればインターフェース定義に沿った入出力テストを必ず含める

## テストツールの選定
<!-- ツールが未インストールの場合は developer にインストールを依頼してから実行する -->

判断フロー:
1. `package.json` があれば Node.js プロジェクト:
   - `jest` あり → **Jest**
   - `supertest` あり → **Jest + Supertest**
   - `@playwright/test` あり → **Playwright**
   - なし → **Node.js built-in test runner** (`node:test`、v18以上)
2. `*.py` または `requirements.txt` があれば → **pytest**
3. 既存テストファイルがあればその形式に合わせる

<!-- インストールコマンド: Jest: npm i -D jest | Jest+Supertest: npm i -D jest supertest | Playwright: npm i -D @playwright/test | pytest: pip install pytest -->
<!-- VSCode統合: Playwright → "Playwright Test for VSCode" | pytest → "Python"拡張 | Jest → npx jest -->

## テスト設計原則
- 実装者と異なる視点でテストケースを設計する（実装ロジックに引きずられない）
- 要件定義レポートの「完了条件」を必ず網羅する
- インターフェース定義に沿った入出力テストを必ず含める
- 正常系・異常系・境界値を必ずカバーする
- テスト名は「何を検証するか」を明確に記述する

## 禁止事項
- ソースファイルの編集・書き込みは禁止
- テストファイルの新規作成・編集は禁止
- 「おそらく動く」という推測でのPASSは禁止（必ず実行して確認する）
