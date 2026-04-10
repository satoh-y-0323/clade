# トラブルシューティング

詰まったときに参考にしてください。症状に合わせて該当セクションを確認してください。

---

## セットアップのやり方がわからない

Clade のセットアップ手順は **[はじめ方](/getting-started)** に詳しく記載されています。

おおまかな流れは次の通りです：

1. Clade リポジトリをクローンする
2. セットアップスクリプト（`setup.ps1` / `setup.sh`）を実行する
3. `/agent-project-setup` でコーディング規約を設定する（推奨）
4. `/agent-interviewer` で最初の作業を始める

::: tip
セットアップの具体的なコマンドや手順は、[はじめ方](/getting-started) をご参照ください。
:::

---

## セットアップがうまくいかない

### PowerShell の実行ポリシーエラー（Windows）

::: danger このエラーが出た場合
「このシステムではスクリプトの実行が無効になっています」というエラーが表示される
:::

::: tip 解決方法
PowerShell で以下のコマンドを実行してから、セットアップスクリプトを再実行してください。

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

このコマンドは現在開いている PowerShell ウィンドウのみに適用されます。パソコン全体の設定は変更されないので安心してください。
:::

---

### setup.sh に実行権限がない（macOS / Linux）

::: danger このエラーが出た場合
`Permission denied` と表示されて `setup.sh` が実行できない
:::

::: tip 解決方法
以下のコマンドでスクリプトに実行権限を付与してから再実行してください。

```bash
chmod +x setup.sh
./setup.sh /path/to/your/project
```
:::

---

### セットアップスクリプトが見つからない

::: danger このエラーが出た場合
`No such file or directory` と表示される
:::

::: tip 解決方法
セットアップスクリプトは Clade リポジトリのルートフォルダにあります。`cd` コマンドで Clade フォルダ（`setup.ps1` や `setup.sh` が見えるフォルダ）に移動してから実行してください。

```bash
cd /path/to/clade   # Cladeのフォルダに移動
./setup.sh /path/to/your/project
```
:::

---

### セットアップしたのに動かない

::: danger こういう状態の場合
フックが動かない・`/agent-xxx` コマンドが認識されないなど、セットアップ後も正常に動作しない
:::

::: tip 解決方法
以下の順番で確認してください。

**1. `settings.local.json` の存在確認**

プロジェクトの `.claude/settings.local.json` が存在するか確認してください。このファイルがないと並列エージェントが正常に動きません。存在しない場合は、セットアップスクリプトを再実行するか、[はじめ方](/getting-started) の手順に従って手動作成してください。

**2. Node.js のバージョン確認**

Node.js のバージョンが 18 以上であることを確認してください。

```bash
node --version   # v18.0.0 以上であることを確認
```

バージョンが古い場合は [Node.js 公式サイト](https://nodejs.org/) から最新版をインストールしてください。
:::

---

## Clade を入れたけど何をしたらいいかわからない

まずは次のコマンドを Claude Code に入力してみてください。

```
/agent-interviewer
```

何を作りたいか・何をしたいかをヒアリングしてくれます。アイデアが漠然としていても大丈夫です。会話しながら要件をまとめてくれます。

### 主なカスタムコマンド一覧

| コマンド | 説明 |
|---|---|
| `/agent-interviewer` | 要件ヒアリング（最初はここから） |
| `/agent-architect` | 設計・アーキテクチャ検討 |
| `/agent-developer` | 実装・デバッグ |
| `/agent-tester` | テスト仕様設計・実行 |
| `/agent-code-reviewer` | コード品質レビュー |
| `/agent-security-reviewer` | セキュリティ診断 |
| `/agent-workflow-builder` | 業務フロー専用エージェントの自動生成 |

全体的なワークフローの流れは **[ワークフロー](/workflow)** をご参照ください。

---

## カスタムコマンドが動かない

### 「Unknown command」と表示される

::: danger このエラーが出た場合
`/agent-xxx` を入力しても「Unknown command」と表示される
:::

::: tip 解決方法
`.claude/commands/` ディレクトリが存在するか確認してください。存在しない場合、セットアップが完了していない可能性があります。

セットアップを再実行してください（[はじめ方](/getting-started) 参照）。
:::

---

### コマンドは認識されるがエラーになる

::: danger こういう状態の場合
`/agent-xxx` は認識されるが、実行中にエラーが発生する
:::

::: tip 解決方法
**1. Node.js のバージョンを確認する**

```bash
node --version   # v18.0.0 以上であることを確認
```

**2. `settings.local.json` を確認する**

`.claude/settings.local.json` が存在し、適切な権限設定が記述されているか確認してください。ファイルがない場合は [はじめ方](/getting-started) の手順で作成してください。
:::

---

### VS Code 拡張で権限確認ダイアログが毎回出る

::: danger こういう状態の場合
VS Code 拡張で Clade を使用しているとき、操作のたびに権限の許可を求めるダイアログが表示される
:::

::: tip 解決方法
これは VS Code 拡張の既知のバグです。以下の2つの方法で対処できます。

**方法1: CLI に切り替える（推奨）**

VS Code の統合ターミナルを開き（`Ctrl+\`` / `Cmd+\``）、以下を実行してください。

```bash
claude
/terminal-setup   # Shift+Enter で複数行入力を有効化
/init-session     # 前回のセッション状態を復元
```

**方法2: VS Code 拡張の逐次実行モードで続ける**

セッション開始時に「逐次実行で続ける」を選択すると、確認ダイアログなしで作業を続けられます（並列実行以外の機能は正常動作します）。
:::

---

## エラーメッセージが出たけどどうしたらいいかわからない

エラーメッセージが表示されたとき、まず **Claude Code にそのままエラーメッセージを貼り付けて**聞いてみてください。

### エラーメッセージを Claude Code に聞く方法

1. エラーメッセージをコピーする（`Ctrl+C` / `Cmd+C`）
2. Claude Code のチャット欄に貼り付ける
3. 以下のように聞く：

```
このエラーメッセージの意味と対処方法を教えてください：
（エラーメッセージをここに貼り付け）
```

Claude Code が原因と解決方法を教えてくれます。

---

### Claude Code 自体が起動しない場合

::: danger こういう状態の場合
`claude` コマンドが見つからない・起動しない
:::

::: tip 解決方法
以下の手順で Claude Code を再インストールしてください。

```bash
npm install -g @anthropic-ai/claude-code
```

npm コマンドが使えない場合は、[Node.js 公式サイト](https://nodejs.org/) から Node.js をインストールしてから上記を実行してください。
:::

---

解決しない場合は [GitHub Issues](https://github.com/satoh-y-0323/clade/issues) からご報告ください。
