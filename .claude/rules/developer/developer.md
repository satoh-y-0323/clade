# Developer Rules

## 個別ルールの読み込み
@.claude/rules/developer/individual/tdd.md
@.claude/rules/developer/individual/git.md

## 使用可能スキル
- `.claude/skills/project/git-workflow`（存在する場合）
- `.claude/skills/project/debug-loop`（存在する場合）
- `~/.claude/skills/tdd`（グローバル、存在する場合）
- `~/.claude/skills/refactor`（グローバル、存在する場合）

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
