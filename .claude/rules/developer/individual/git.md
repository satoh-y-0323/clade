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
