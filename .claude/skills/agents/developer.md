# Developer Rules

## 使用可能スキル
- `.claude/skills/project/coding-conventions.md`（存在する場合）— **作業開始前に必ず最初に Read すること**
- `.claude/skills/project/git-workflow`（存在する場合）
- `.claude/skills/project/debug-loop`（存在する場合）
- `.claude/skills/project/refactor`（存在する場合）

## テスターとの連携
- テスト作成・実行はtesterエージェントの責務であり、developerは行わない
- 実装完了後にtesterへテスト依頼を行う（Green完了 → tester確認 → Refactor → tester再確認）
- Glob で `.claude/reports/test-report-*.md` を検索し、ファイル名降順で最新を特定して Read する
- テスターの指摘に対して推測で修正せず、必ず原因を特定してから修正する
- `.claude/reports/approvals.jsonl` を参照し、過去の承認/否認傾向を把握してから実装に反映する

## コード品質
- 関数は単一責任原則に従う（1関数 = 1つの役割）
- マジックナンバーは定数化する
- エラーハンドリングを必ず実装する
- 型アノテーションを付ける（TypeScript / Python）
- 関数の長さは50行以内を目安にする

## 命名規則
- 変数・関数: 何をするかを動詞+名詞で表現する（getUserById など）
- ブール値: is / has / can / should で始める
- 定数: UPPER_SNAKE_CASE
- 略語は使わない（tmp → temporary, btn → button）

---

# TDD Rules

## Red → Green → Refactor サイクル
1. **Red**: 失敗するテストを先に書く
2. **Green**: テストを通過する最小限のコードを書く
3. **Refactor**: テストを通しながらコードを改善する

## テスト作成原則
- テスト名は「何をテストするか」を日本語または明確な英語で記述する
  - 良い例: `test('ユーザーIDが存在しない場合は404を返す')`
  - 悪い例: `test('test1')`
- テストは独立して実行できるようにする（テスト間の依存禁止）
- モックは外部依存（DB・API・ファイルシステム）のみに使う
- 1つのテストで1つのことだけを検証する

## カバレッジ目安
- ビジネスロジック: 90%以上
- ユーティリティ関数: 80%以上
- UIコンポーネント: 主要インタラクションをカバー

## テストを書かなくていい場合
- 設定ファイル・定数定義
- 単純なgetterのみのDTO
- サードパーティライブラリのラッパー（ライブラリ自体はテスト済み）

---

# Git Workflow Rules

## ブランチ戦略
- `main` / `master`: プロダクション。直接コミット禁止
- `develop`: 開発統合ブランチ
- `feature/{ticket-id}-{description}`: 機能開発
- `fix/{ticket-id}-{description}`: バグ修正
- `chore/{description}`: 雑務（依存更新・設定変更）

## コミットメッセージ規則（Conventional Commits）
```
{type}({scope}): {summary}

{body}（任意）

{footer}（任意: BREAKING CHANGE, Closes #123）
```

### type一覧
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: フォーマット変更（動作に影響なし）
- `refactor`: リファクタ（機能追加・バグ修正なし）
- `test`: テストの追加・修正
- `chore`: ビルド・ツール・依存関係の変更

## 禁止事項
- `git push --force` はユーザー確認なしに実行しない
- `main` / `master` への直接 push は禁止
- コミットメッセージに「fix」「update」のみは不可（何をfixしたか書く）
- 巨大コミット（500行以上の変更は分割を検討）
