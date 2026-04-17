# 並列開発

Clade はプランナーが作業をグループに分割し、複数のエージェントが独立した git worktree で並列実行する仕組みを持っています。

## 仕組み

```
/agent-planner
  ↓
plan-report（並列グループ定義を含む）
  ↓
/agent-developer（並列モードを選択）
  ↓
グループA: worktree-developer-A  ┐
グループB: worktree-developer-B  ├── 並列実行
グループC: worktree-developer-C  ┘
  ↓
全グループ完了後 → merger が自動マージ
```

各 worktree-developer は独立したブランチで動作するため、互いの作業が干渉しません。

---

## 並列開発の前提条件

並列開発を正常に動作させるには **CLI での実行** と **`settings.local.json` の設定** が必要です。

### settings.local.json の設定

`isolation: "worktree"` エージェントは `settings.json` を読まず、`settings.local.json` のみを参照します。このファイルがないと、並列エージェントはファイル書き込みや git コマンドの権限を持てません。

セットアップスクリプト実行時に自動的に配置されますが、手動で作成する場合は以下の内容で `.claude/settings.local.json` を作成してください：

```json
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Write(**)",
      "Edit(**)",
      "Glob(**)",
      "Grep(**)",
      "Bash(cd * && git*)",
      "Bash(git add*)",
      "Bash(git restore*)",
      "Bash(git commit*)",
      "Bash(git merge*)",
      "Bash(git branch*)",
      "Bash(git rev-parse*)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git worktree*)",
      "Write(.claude/**)",
      "Edit(.claude/**)",
      "Bash(node*)"
    ]
  }
}
```

::: warning
`settings.local.json` はリポジトリにコミットしないよう `.gitignore` に追加してください。
:::

---

## グループ分割のルール

プランナーは以下の基準でグループを分割します：

- **依存関係のないタスク**をそれぞれ別グループに分類
- 同じファイルを編集するタスクは同じグループにまとめる
- グループ間の干渉を最小化する

`plan-report` の YAML フロントマターに並列グループが定義されます：

```yaml
---
parallel_groups:
  group-a:
    files:
      - src/auth/**
      - src/models/user.ts
  group-b:
    files:
      - src/api/routes/**
      - tests/api/**
---
```

---

## ファイルオーナーシップガード

並列開発中、各 worktree-developer は自分のグループに割り当てられたファイル以外への書き込みをブロックされます。これにより、エージェント間のファイル競合を防ぎます。

---

## マージ

全グループの実装が完了すると、`merger` エージェントが自動的にベースブランチへのマージを試みます。コンフリクトが発生した場合は、内容をユーザーに報告して解決の確認を求めます。
