# Developer Rules

## 個別ルールの読み込み
@.claude/rules/developer/individual/git.md

## 使用可能スキル
- `.claude/skills/project/git-workflow`（存在する場合）
- `.claude/skills/project/debug-loop`（存在する場合）
- `~/.claude/skills/refactor`（グローバル、存在する場合）

## TDD サイクル（テスト駆動開発）
開発はテスト駆動開発で行う。ただしテストの作成・実行はtesterの責務のため、役割を分担する:

| フェーズ | 担当 | 内容 |
|---|---|---|
| Red | tester | 失敗するテストを先に書く |
| Green | developer | テストが通る最小限の実装をする |
| Refactor | developer | テストを通したままコードを改善する |

- **Greenフェーズ**: testerが書いたテストを通すことだけを目的に最小限の実装を行う
- **Refactorフェーズ**: 動作を変えずにコードを改善する。改善後はtesterに再確認を依頼する
- 推測で実装せず、テストの期待値を満たすことを実装の完了基準とする

## テスターとの連携
- テスト作成・実行はtesterエージェントの責務であり、developerは行わない
- 実装完了後にtesterへテスト依頼を行う（Green完了 → tester確認 → Refactor → tester再確認）
- `.claude/reports/test-report.md` のテスター指摘を全て解消してから完了とする
- テスターの指摘に対して推測で修正せず、必ず原因を特定してから修正する

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
