# Claude Code カスタム設定 — Windows / VSCode 向け

## 前提条件
- Windows 10/11
- Node.js インストール済み（`node -v` で確認）
- VSCode + Claude Code 拡張インストール済み

## この設定でできること
- `/agent:developer` などでエージェントを切り替えて作業
- セッションをまたいで作業の続きを自動復元
- ツールの成功/失敗パターンを蓄積して `/cluster-promote` でスキル/ルールに昇格

---

## ファイル構成

```
claude-code-setup-win\
├── setup.ps1                ← PowerShell セットアップスクリプト
├── README.md                ← このファイル
└── project\
    └── .claude\             ← VSCode プロジェクトにコピーする設定
        ├── CLAUDE.md
        ├── commands\        ← カスタムコマンド
        ├── agents\          ← エージェント定義
        ├── hooks\           ← フックスクリプト
        └── rules\           ← ルールファイル
```

---

## セットアップ手順

### 方法A — setup.ps1 で自動セットアップ（推奨）

PowerShell を開き、以下を実行してください:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

`-ProjectPath` を省略すると、カレントディレクトリに対して実行されます。

スクリプトは以下を自動で行います:
1. `project\.claude\` をプロジェクトにコピー
2. 必要な空フォルダを作成（`memory\sessions\` 等）
3. `.gitignore` にローカルデータの除外設定を追加

---

### 方法B — 手動セットアップ

**1. `.claude\` フォルダをコピー**
```
コピー元: claude-code-setup-win\project\.claude\
コピー先: {あなたのプロジェクト}\.claude\
```

**2. 空フォルダを手動作成**
```
{project}\.claude\skills\project\
{project}\.claude\memory\sessions\
{project}\.claude\instincts\raw\
{project}\.claude\instincts\clusters\
```

**3. `.gitignore` に追記**
```
# Claude Code - ローカル設定
.claude/settings.local.json
# Claude Code - セッション記録
.claude/memory/sessions/
# Claude Code - 観察データ
.claude/instincts/raw/
# Claude Code - クラスタデータ
.claude/instincts/clusters/
```

---

## 設定を最新版に同期する

このリポジトリを更新した後、既存プロジェクトの `.claude\` を最新版に追従させる場合は robocopy を使います。
`memory\`・`instincts\` はローカルデータなので除外します。

```powershell
robocopy "claude-code-setup-win\project\.claude" "{あなたのプロジェクト}\.claude" /MIR /XD memory instincts /XF settings.local.json
```

> **注意:** 除外するフォルダ・ファイルはプロジェクトの構成に応じて適宜変更してください。

---

## 主なコマンド

| コマンド | 説明 |
|---------|------|
| `/agent:interviewer` | 要件ヒアリングエージェントを起動 |
| `/agent:architect` | 設計・アーキテクチャエージェントを起動 |
| `/agent:planner` | 計画立案エージェントを起動 |
| `/agent:developer` | 実装・デバッグエージェントを起動 |
| `/agent:tester` | テストエージェントを起動 |
| `/agent:code-reviewer` | コードレビューエージェントを起動 |
| `/agent:security-reviewer` | セキュリティ診断エージェントを起動 |
| `/init-session` | 前回の続きから再開 |
| `/end-session` | 今日の作業・残タスクを保存 |
| `/cluster-promote` | 蓄積データをスキル/ルールに昇格 |
| `/status` | 現在の状態を確認 |

---

## よくある質問

### Q. setup.ps1 実行時に「実行ポリシー」エラーが出る
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

### Q. フックなしでも使えるか？
コマンドとルールは完全に動作します。
フックはメモリの自動保存と継続学習のためのもので、なくても手動で `/end-session` を使えば同等の機能が得られます。
