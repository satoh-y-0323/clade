# カスタマイズガイド

Clade のすべての設定は Markdown と JSON ファイルで管理されています。コードを書かずにエージェントの動作をカスタマイズできます。

## コーディング規約

`/agent-project-setup` を実行すると、使用言語とコーディング規約を対話形式で設定できます。

```
/agent-project-setup
```

TypeScript・Python・C#・Go・Java・Ruby など、あらゆる言語に対応しています。チーム独自のルールや社内コーディング規約も追加できます。

設定結果は `.claude/skills/project/coding-conventions.md` に保存され、すべてのエージェントが自動的に参照します。

---

## スキル

プロジェクト固有の手順や規約を `.claude/skills/project/` に追加できます。

```
.claude/skills/project/
├── coding-conventions.md    # /agent-project-setup で生成
├── deployment-guide.md      # デプロイ手順
└── api-conventions.md       # API 設計規約
```

ここに置いたファイルは関連するエージェントが自動的に参照します。

---

## ルール

`.claude/rules/` を編集してエージェントの動作をカスタマイズできます。

```
.claude/rules/
├── core.md          # 全エージェント共通ルール
└── developer.md     # developer エージェント固有ルール
```

例：コミットメッセージのフォーマットを統一する場合、`core.md` に以下を追加します：

```markdown
## コミットルール
- コミットメッセージは Conventional Commits 形式で書くこと
- 例: feat: ユーザー認証機能を追加
```

---

## MCP サーバ

### 同梱 MCP サーバ

Clade には以下の MCP サーバが最初から含まれています：

| サーバ | 用途 |
|---|---|
| `filesystem` | プロジェクト外のファイルの読み書き |
| `memory` | セッションをまたぐ永続的なナレッジグラフ |
| `sequential-thinking` | 複雑なタスクの段階的・構造化された推論 |
| `playwright` | ブラウザ自動操作・E2E テスト |

### Playwright の許可オリジン管理

Playwright サーバはデフォルトで `localhost` のみにアクセスを制限しています：

```
/playwright-list-origins                               # 現在の許可オリジンを確認
/playwright-add-origin https://staging.example.com    # オリジンを追加
/playwright-remove-origin https://staging.example.com # オリジンを削除
```

追加オリジンは `.claude/settings.local.json` にのみ保存されます。`settings.json` は変更されません。

### MCP サーバの追加

`/agent-mcp-setup` を実行すると、公開 MCP サーバや社内プライベート MCP サーバを追加し、スキルファイルを自動生成できます：

```
/agent-mcp-setup
```

サーバは常にプロジェクトスコープ（`.claude/settings.json`）に追加されます。複数プロジェクトで使いたい場合は `/promote` でグローバルスコープへ昇格できます。

---

## スキル・ルールのグローバル昇格

プロジェクト内で学習したスキルやルールを、複数プロジェクトで有用と判断した場合にグローバルスコープへ昇格できます。

```
/promote         # スキル・ルール・MCP サーバをグローバルに昇格
/cluster-promote # bash-log から繰り返しパターンを抽出してスキル化
/prune-rules     # 昇格済みルールの整理（重複統合・孤立クラスタ削除）
```

**昇格するかどうかは常にあなたが決めます。** Clade は自動でグローバル環境を変更しません。

---

## settings.json と settings.local.json

| ファイル | 用途 | コミット |
|---|---|---|
| `.claude/settings.json` | プロジェクト共通設定（権限・hooks・MCP） | する |
| `.claude/settings.local.json` | ユーザー固有設定（並列開発用の権限等） | しない |

`settings.local.json` はリポジトリにコミットせず、各開発者のマシンに置きます。
