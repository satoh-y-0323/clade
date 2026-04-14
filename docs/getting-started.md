# はじめ方

## 方法A: AIアシストセットアップ（非エンジニアにおすすめ）

[Claude Code](https://claude.ai/code) がすでにインストールされていれば、プロンプトを1つ貼り付けるだけでセットアップが完了します。ターミナル操作は不要です。

セットアップしたいプロジェクトのディレクトリで Claude Code を開き、以下をそのまま貼り付けてください：

::: code-group

```text [日本語版]
このプロジェクトにClade（日本語版）をセットアップしてください。

リポジトリ: https://github.com/satoh-y-0323/clade

手順:
1. 現在のOSを確認する（Windows / macOS / Linux）
2. リポジトリを一時ディレクトリにクローンする
3. セットアップスクリプト（setup.ps1 または setup.sh）の内容を確認してから実行する
4. 現在の作業ディレクトリをプロジェクトパスとしてスクリプトを実行する
5. 一時ディレクトリを削除する
6. セットアップ完了を確認し、次のステップを案内する
```

```text [英語版]
Set up Clade (English version) in this project.

Repository: https://github.com/satoh-y-0323/clade

Steps:
1. Detect the current OS (Windows / macOS / Linux)
2. Clone the repository to a temporary directory
3. Review the setup script before running it (setup_en.ps1 for Windows, setup_en.sh for macOS/Linux)
4. Run the setup script targeting the current working directory as the project path
5. Delete the temporary directory
6. Confirm setup is complete and show next steps
```

:::

あとは Claude Code が自動でOS判定・スクリプト確認・実行・後片付けまで行います。

---

## 方法B: 手動セットアップ

### 1. リポジトリをクローンする

```bash
git clone https://github.com/satoh-y-0323/clade.git clade
cd clade
```

### 2. セットアップスクリプトを実行する

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

### 3. コーディング規約を設定する（推奨）

セットアップしたプロジェクトで Claude Code を開き、以下を実行します：

```
/agent-project-setup
```

使用言語とコーディング規約についてヒアリングし、`.claude/skills/project/coding-conventions.md` を自動生成します。TypeScript・Python・C#・Go・Java・Ruby など、あらゆる言語に対応しています。

### 4. 作業を開始する

```
/agent-interviewer    # 要件ヒアリングから始める（推奨）
```

または、任意のエージェントから直接始めることもできます：

```
/agent-developer      # 実装から始める
/agent-architect      # 設計から始める
```

---

## どのワークフローを使うか

作業の規模に応じて使い分けると効率的です。

### ✅ 直接指示でOK（エージェント不要）

Claude Code に直接話しかけるだけで完了する作業です。

- バッジのバージョン番号を変えたい
- Google Analytics を埋め込みたい
- 文字化けを直したい
- ドキュメントを修正したい
- 設定値を変更したい
- 何かを調査・質問したい

### 🤖 `/agent-developer` から始める

実装やデバッグが中心で、設計の検討が不要な作業です。

- ログイン機能を追加したい
- バグを調査・修正したい
- 既存コードをリファクタリングしたい
- API を呼び出す処理を追加したい

### 📋 フルワークフローを使う

設計・要件定義から始めるべき、規模の大きな作業です。

- 新しいモジュールを設計・実装したい
- 既存の設計を大きく変えたい
- 複数の機能にまたがる変更をしたい

::: tip 迷ったら `/init-session` で確認
セッション開始時に `/init-session` を実行すると、タスクの規模を選ぶだけで適切なワークフローを案内してくれます。
:::

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
