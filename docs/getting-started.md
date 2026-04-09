# はじめ方

## 1. リポジトリをクローンする

```bash
git clone https://github.com/satoh-y-0323/clade.git clade
cd clade
```

## 2. セットアップスクリプトを実行する

::: warning セットアップは必ず実行してください
クローンしただけでは動作しません。セットアップスクリプトを実行することで、Clade の設定ファイルがあなたのプロジェクトにコピーされます。
:::

使用する言語に合わせてスクリプトを選んでください。

### 日本語版

::: code-group

```powershell [Windows（PowerShell）]
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

```bash [macOS / Linux]
chmod +x setup.sh
./setup.sh /path/to/your/project
```

:::

### 英語版

::: code-group

```powershell [Windows（PowerShell）]
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

```bash [macOS / Linux]
chmod +x setup_en.sh
./setup_en.sh /path/to/your/project
```

:::

セットアップスクリプトは以下を実行します：
- `.claude/` ディレクトリをプロジェクトにコピー
- セッション管理フックを初期化
- 必要なディレクトリ構造を作成

## 3. コーディング規約を設定する（推奨）

セットアップしたプロジェクトで Claude Code を開き、以下を実行します：

```
/agent-project-setup
```

使用言語とコーディング規約についてヒアリングし、`.claude/skills/project/coding-conventions.md` を自動生成します。TypeScript・Python・C#・Go・Java・Ruby など、あらゆる言語に対応しています。

## 4. 作業を開始する

```
/agent-interviewer    # 要件ヒアリングから始める（推奨）
```

または、任意のエージェントから直接始めることもできます：

```
/agent-developer      # 実装から始める
/agent-architect      # 設計から始める
```

---

## CLI と VS Code 拡張の違い

**CLI での実行を推奨します。**

| | CLI | VS Code 拡張 |
|---|---|---|
| `permissions.allow`（プロジェクトレベル） | 正常動作 | 認識されない（既知のバグ） |
| 並列バックグラウンドエージェント | 完全対応 | 利用不可 |
| 複数行入力 | `/terminal-setup` で有効化 | ネイティブ対応 |

VS Code 拡張には現在既知のバグがあり、プロジェクトレベルの `.claude/settings.json` に記載した `permissions.allow` が反映されません。その結果、フック実行のたびに確認ダイアログが表示され、エージェントの並列バックグラウンド実行が正常に完了しません。

### VS Code 拡張で実行する場合

Clade はセッション開始時に VS Code 拡張を検出し、以下のどちらかを選択できます：

- **逐次実行で続ける** — エージェントを1つずつ順番に実行します。並列実行以外の機能は正常に動作します。
- **CLI に切り替える** — VS Code の統合ターミナルを開き（`Ctrl+\`` / `Cmd+\``）、`claude` を実行後、`/terminal-setup` で `Shift+Enter` による複数行入力を設定し、`/init-session` で前回のセッションを復元します。

### CLI のセットアップ

```bash
# Claude Code CLI をインストール
npm install -g @anthropic-ai/claude-code

# 複数行入力（Shift+Enter）を有効化
/terminal-setup
```

---

## プロジェクト構成

セットアップ後のディレクトリ構成は以下の通りです：

```
your-project/
└── .claude/
    ├── commands/         # カスタムスラッシュコマンド（/agent-xxx）
    ├── hooks/            # ライフサイクルフック
    ├── rules/            # エージェントの行動ルール
    ├── skills/
    │   └── project/      # プロジェクト固有スキル（コーディング規約等）
    ├── reports/          # 生成されたレポート（自動作成）
    ├── memory/           # セッションメモリ（自動管理）
    └── CLAUDE.md         # Claude Code のエントリポイント
```
