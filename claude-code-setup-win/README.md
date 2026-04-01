# Claude Code カスタム設定 — Windows / VSCode 向け

## この設定でできること
- `/agent:developer` などでエージェントを切り替えて作業
- セッションをまたいで作業の続きを自動復元
- ツールの成功/失敗パターンを蓄積して `/cluster-promote` でスキル/ルールに昇格

---

## ファイル構成

```
claude-code-setup-win\
├── setup.ps1                ← PowerShell用セットアップ（試してみてください）
├── README.md                ← このファイル
├── project\
│   └── .claude\             ← VSCodeプロジェクトにコピーする設定
│       ├── CLAUDE.md
│       ├── commands\        ← カスタムコマンド
│       ├── agents\          ← エージェント定義
│       └── rules\           ← ルールファイル
└── global\
    └── .claude\             ← WSLホーム(~/.claude/)にコピーする設定
        ├── settings.json    ← フック登録
        ├── hooks\           ← フックスクリプト
        └── memory\
```

---

## セットアップ手順

### STEP 1 — プロジェクト設定をVSCodeにコピー（必須・簡単）

エクスプローラーで以下をコピーするだけです：

```
コピー元: claude-code-setup-win\project\.claude\
コピー先: {あなたのVSCodeプロジェクト}\.claude\
```

**コピー後、以下の空フォルダを手動作成してください:**
```
{project}\.claude\skills\project\        （空でOK）
{project}\.claude\memory\sessions\       （空でOK）
{project}\.claude\instincts\raw\         （空でOK）
{project}\.claude\instincts\clusters\    （空でOK）
```

これだけでコマンド（`/agent:developer` 等）とルールが使えるようになります。

---

### STEP 2 — グローバルフックをWSLに配置（メモリ永続化・継続学習に必要）

#### 2-1. WSLターミナルを開く

VSCodeで **Ctrl+`** → ターミナルのドロップダウンから **Ubuntu（WSL）** を選択。
または Windowsスタートメニューから「Ubuntu」を検索して起動。

#### 2-2. WSLターミナルで以下を実行

```bash
# ディレクトリ作成
mkdir -p ~/.claude/hooks
mkdir -p ~/.claude/memory

# Windowsのダウンロードフォルダからコピー（パスは実際の場所に合わせる）
# ※ WSLからWindowsのCドライブは /mnt/c/ でアクセスできます
cp /mnt/c/Users/あなたのユーザー名/Downloads/claude-code-setup-win/global/.claude/hooks/* ~/.claude/hooks/
cp /mnt/c/Users/あなたのユーザー名/Downloads/claude-code-setup-win/global/.claude/settings.json ~/.claude/settings.json
cp /mnt/c/Users/あなたのユーザー名/Downloads/claude-code-setup-win/global/.claude/memory/memory.json ~/.claude/memory/memory.json

# 実行権限を付与
chmod +x ~/.claude/hooks/*.sh
chmod +x ~/.claude/hooks/*.js

# 確認
ls -la ~/.claude/hooks/
cat ~/.claude/settings.json
```

#### 2-3. Node.jsがWSLに入っているか確認

```bash
node --version
# v16以上であればOK

# 入っていない場合:
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

### STEP 3 — VSCodeでClaude Codeを起動して確認

1. VSCodeでプロジェクトを開く
2. **Ctrl+Shift+P** → 「Claude Code」を検索して起動
   または左サイドバーのClaudeアイコンをクリック
3. 以下を入力してエージェントを起動:
   ```
   /agent:developer
   ```

---

## 主なコマンド

| コマンド | 説明 |
|---------|------|
| `/agent:developer` | 実装・テストエージェントを起動 |
| `/agent:architect` | 設計・アーキテクチャエージェントを起動 |
| `/agent:reviewer` | コードレビューエージェントを起動 |
| `/init-session` | 前回の続きから再開 |
| `/end-session` | 今日の作業・残タスクを保存 |
| `/cluster-promote` | 蓄積データをスキル/ルールに昇格 |
| `/promote` | プロジェクト固有→グローバルに展開 |
| `/status` | 現在の状態を確認 |

---

## よくある質問

### Q. setup.ps1 実行時に「実行ポリシー」エラーが出る
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

### Q. WSLターミナルがVSCodeに表示されない
VSCode設定（settings.json）に追加:
```json
"terminal.integrated.defaultProfile.windows": "Ubuntu (WSL)"
```

### Q. `/mnt/c/Users/...` のパスがわからない
WSLターミナルで以下を実行すると現在のWindowsユーザー名がわかります:
```bash
echo $(/mnt/c/Windows/System32/cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r')
```

### Q. フックなしでも使えるか？
STEP 1（プロジェクト設定のコピー）だけでも、コマンドとルールは完全に動作します。
フックはメモリの自動保存と継続学習のためのもので、なくても手動で `/end-session` を使えば同等の機能が得られます。

---

## .gitignore に追加する内容

プロジェクトの `.gitignore` に以下を追記してください（ルール・コマンドはgit管理、メモリ・学習データはローカルのみ）:
```
.claude/memory/
.claude/instincts/raw/
.claude/instincts/clusters/
```
