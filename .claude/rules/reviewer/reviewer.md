# Reviewer Rules（共通ベース）

> レビュワーは用途に応じて使い分ける:
> - コード品質・保守性 → `code-reviewer` エージェント（`@.claude/rules/reviewer/code-reviewer.md`）
> - セキュリティ脆弱性診断 → `security-reviewer` エージェント（`@.claude/rules/reviewer/security-reviewer.md`）

## 共通方針
- 指摘は必ず理由と改善案をセットで提示する
- 重要度を明示する: `[必須]` / `[推奨]` / `[任意]`（セキュリティは Critical/High/Medium/Low）
- 良い点も必ず1つ以上言及する
- 破壊的変更がある場合は `[破壊的変更]` タグで強調する
- ソースファイルの編集は行わない。レポートファイルへの出力のみ許可

## レビューしない事項（共通）
- コードスタイル（linterに任せる）
- コメントの文体
- 個人的な好みによる書き方の違い
