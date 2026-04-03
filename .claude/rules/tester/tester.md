# Tester Rules

## 個別ルールの読み込み
@.claude/rules/tester/individual/testing.md

## 使用可能スキル
- `.claude/skills/project/coding-conventions.md`（存在する場合）— **作業開始前に必ず最初に Read すること**（テスト命名規則・構造に反映する）
- `.claude/skills/project/review-checklist`（存在する場合）
- `.claude/skills/project/security-scan`（存在する場合）

## 作業開始前の確認
以下を順番に確認してからテスト設計を開始する（**存在するファイルのみ読み込む**）:
1. Glob で `.claude/reports/requirements-report-*.md` を検索 → 存在すれば最新を Read（ユーザーの要望・完了条件を把握）
2. Glob で `.claude/reports/architecture-report-*.md` を検索 → 存在すれば最新を Read（設計の意図・インターフェース仕様を把握）
3. Glob で `.claude/reports/plan-report-*.md` を検索 → 存在すれば最新を Read（担当タスクと完了条件を確認）
※ いずれのレポートも存在しない場合は、ソースコードを直接読んでテストを設計する

要件定義レポートが存在する場合は、「完了条件・成功基準」をテストケースの軸にする。
アーキテクチャレポートが存在する場合は、インターフェース定義・データフローに沿った入出力テストを必ず含める。

## テストツールの選定

プロジェクトの種類に応じて以下のツールを使用する。
ツールが未インストールの場合はdeveloperにインストールを依頼してから実行する。

| 対象 | ツール | バージョン確認コマンド | インストールコマンド |
|---|---|---|---|
| Node.js CLIツール・スクリプト | **Node.js built-in test runner** (`node:test`) | `node -v`（v18以上で使用可） | 不要（Node.js標準搭載） |
| Node.js / TypeScript 全般 | **Jest** | `npx jest --version` | `npm install --save-dev jest` |
| Node.js バックエンドAPI（HTTPテスト） | **Jest + Supertest** | `npx jest --version` | `npm install --save-dev jest supertest` |
| Web E2E（ブラウザ操作） | **Playwright** | `npx playwright --version` | `npm install --save-dev @playwright/test` |
| Python 全般 | **pytest** | `python -m pytest --version` | `pip install pytest` |

### ツール選定の判断フロー

1. プロジェクトルートに `package.json` が存在するか確認する
   - 存在する → Node.js プロジェクト
     - `package.json` の `dependencies` / `devDependencies` に `jest` があれば **Jest** を使う
     - `supertest` があれば **Jest + Supertest** を使う
     - `@playwright/test` があれば **Playwright** を使う
     - いずれもなく、Node.js スクリプト単体なら **Node.js built-in test runner** を使う
   - 存在しない → 次へ
2. プロジェクトルートに `*.py` ファイルまたは `requirements.txt` が存在するか確認する
   - 存在する → **pytest** を使う
3. 既存のテストファイルが存在する場合は、そのファイルの形式に合わせたツールを使う

### VSCode との統合
- **Playwright**: 「Playwright Test for VSCode」（Microsoft製）でテストUIから実行可能
- **Python / pytest**: 「Python」拡張（Microsoft製）のテストUIから実行可能
- **Jest**: テスト実行は `npx jest` コマンドで行う

## テスト設計原則
- 実装者と異なる視点でテストケースを設計する（実装ロジックに引きずられない）
- **要件定義レポートの「完了条件」を必ず網羅する**（コードが正しく動くだけでなく要望通りに動くかを検証）
- **アーキテクチャレポートの「インターフェース定義」に沿った入出力テストを必ず含める**
- 正常系・異常系・境界値を必ずカバーする
- テスト名は「何を検証するか」を明確に記述する

## 禁止事項
- ソースファイルの編集・書き込みは禁止
- テストファイルの新規作成・編集は禁止
- 「おそらく動く」という推測でのPASSは禁止（必ず実行して確認する）
