# Clade へのコントリビュート

Clade へのコントリビュートに興味を持っていただきありがとうございます！

---

## コントリビュートの方法

- **バグ報告** — 不具合を見つけた場合は、Issue を開いてください。
- **機能リクエスト** — アイデアがあれば、PR を開く前にまず Issue で共有してください。
- **ドキュメント** — README・ルール説明・エージェントガイドの改善は歓迎します。
- **新しいエージェント・ルール** — Issue + PR を通じて新しいエージェント定義やルールファイルを提案してください。

---

## 作業を始める前に

1. 重複を避けるため、[既存の Issue](https://github.com/satoh-y-0323/clade/issues) を確認してください。
2. 大きな変更を加える場合は、先に Issue を開いてアプローチについて議論してください。
3. リポジトリをフォークし、ブランチを作成してください:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Pull Request ガイドライン

- PR は目的を絞ってください — 1 PR につき 1 機能または 1 修正。
- **何を・なぜ** 変更したのかを明確に説明する PR の説明を書いてください。
- 関連する Issue 番号を参照してください（例: `Closes #42`）。
- 変更によって既存の `.claude/` 構造が壊れないようにしてください。

### コミットメッセージの形式

[Conventional Commits](https://www.conventionalcommits.org/) に従ってください:

```
feat: add new agent rule for X
fix: correct hook path in session-start.js
docs: update README setup instructions
```

---

## リポジトリ構成

```
.claude/
  hooks/        # セッションライフサイクルフック (JS)
  rules/        # エージェントルール定義 (Markdown)
  agents/       # エージェント設定
  skills/       # 再利用可能なスキル定義
  reports/      # 生成されたレポート (git 管理外)
  memory/       # セッションメモリ (git 管理外)
setup.ps1       # Windows セットアップスクリプト
```

---

## Issue の報告

バグを報告する際は、以下の情報を含めてください:

- OS と Node.js のバージョン
- Claude Code のバージョン（`claude --version`）
- 再現手順
- 期待される動作と実際の動作

---

## ライセンス

コントリビュートすることで、あなたの貢献が [MIT ライセンス](LICENSE) の下で提供されることに同意したものとみなします。
