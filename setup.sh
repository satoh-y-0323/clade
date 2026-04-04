#!/usr/bin/env bash
# setup.sh
# Clade セットアップ（Linux/Mac 用）
#
# 実行方法:
#   chmod +x setup.sh
#   ./setup.sh [プロジェクトパス]
#   ./setup.sh --mcp [プロジェクトパス]   # MCP 認証情報もセットアップ

set -euo pipefail

# ===== カラー出力 =====
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
WHITE='\033[0;37m'
GRAY='\033[0;90m'
RESET='\033[0m'

# ===== 引数パース =====
MCP=false
PROJECT_PATH=""

for arg in "$@"; do
    case "$arg" in
        --mcp|-mcp) MCP=true ;;
        *) PROJECT_PATH="$arg" ;;
    esac
done

if [ -z "$PROJECT_PATH" ]; then
    PROJECT_PATH="$(pwd)"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}============================================${RESET}"
echo -e "${CYAN}  Clade セットアップ（プロジェクト用）${RESET}"
echo -e "${CYAN}============================================${RESET}"
echo ""
echo -e "${YELLOW}  プロジェクト: ${PROJECT_PATH}${RESET}"
echo ""

# ===== Node.js の確認 =====
if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}[OK] Node.js: ${NODE_VERSION}${RESET}"
else
    echo -e "${RED}[ERROR] Node.js が見つかりません。${RESET}"
    echo -e "${RED}  https://nodejs.org からインストールしてください。${RESET}"
    exit 1
fi

# ===== プロジェクト設定の配置 =====
echo ""
echo -e "${CYAN}[1/3] プロジェクト設定を配置中: ${PROJECT_PATH}/.claude/${RESET}"

PROJ_CLAUDE="${PROJECT_PATH}/.claude"
SOURCE_CLAUDE="${SCRIPT_DIR}/.claude"

if [ ! -d "$SOURCE_CLAUDE" ]; then
    echo -e "${RED}[ERROR] セットアップ元の .claude/ フォルダが見つかりません: ${SOURCE_CLAUDE}${RESET}"
    exit 1
fi

if [ -d "$PROJ_CLAUDE" ]; then
    printf "  既存の .claude/ を検出。上書きしますか？ [y/N]: "
    read -r OVERWRITE
    if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
        cp -r "${SOURCE_CLAUDE}/." "${PROJ_CLAUDE}/"
        echo -e "  ${GREEN}-> 上書き完了${RESET}"
    else
        echo "  -> スキップしました"
    fi
else
    cp -r "$SOURCE_CLAUDE" "$PROJECT_PATH/"
    echo -e "  ${GREEN}-> 配置完了${RESET}"
fi

# ===== 空ディレクトリを作成 =====
echo ""
echo -e "${CYAN}[2/3] 必要なディレクトリを作成中...${RESET}"

EMPTY_DIRS=(
    "skills/project"
    "memory/sessions"
    "instincts/raw"
    "instincts/clusters"
)

for d in "${EMPTY_DIRS[@]}"; do
    mkdir -p "${PROJ_CLAUDE}/${d}"
    echo "  -> .claude/${d}"
done
echo -e "  ${GREEN}-> 完了${RESET}"

# ===== .gitignore に追加 =====
echo ""
echo -e "${CYAN}[3/3] .gitignore を更新中...${RESET}"

GITIGNORE="${PROJECT_PATH}/.gitignore"
ENTRIES=(
    "# Clade - ローカル設定（機械固有パスを含む）"
    ".claude/settings.local.json"
    "# Clade - セッション記録"
    ".claude/memory/sessions/"
    "# Clade - 観察データ"
    ".claude/instincts/raw/"
    "# Clade - クラスタデータ"
    ".claude/instincts/clusters/"
)

if [ -f "$GITIGNORE" ]; then
    ADDED=0
    for entry in "${ENTRIES[@]}"; do
        if ! grep -qF "$entry" "$GITIGNORE" 2>/dev/null; then
            if [ "$ADDED" -eq 0 ]; then
                echo "" >> "$GITIGNORE"
            fi
            echo "$entry" >> "$GITIGNORE"
            echo "  -> 追加: $entry"
            ADDED=$((ADDED + 1))
        fi
    done
    if [ "$ADDED" -eq 0 ]; then
        echo "  -> 既に設定済みです"
    fi
else
    printf '%s\n' "${ENTRIES[@]}" > "$GITIGNORE"
    echo -e "  ${GREEN}-> .gitignore を作成しました${RESET}"
fi

# ===== MCP 認証情報のセットアップ =====
if [ "$MCP" = true ]; then
    echo ""
    echo -e "${CYAN}[MCP] MCP サーバの認証情報をセットアップ中...${RESET}"

    LOCAL_SETTINGS_PATH="${PROJ_CLAUDE}/settings.local.json"

    if [ ! -f "$LOCAL_SETTINGS_PATH" ]; then
        echo '{}' > "$LOCAL_SETTINGS_PATH"
    fi

    # 既存トークンの確認（Node.js で JSON 読み込み）
    EXISTING_TOKEN=$(LOCAL_SETTINGS_PATH="$LOCAL_SETTINGS_PATH" node -e "
        const fs = require('fs');
        try {
            const s = JSON.parse(fs.readFileSync(process.env.LOCAL_SETTINGS_PATH, 'utf8'));
            console.log((s.env && s.env.GITHUB_PERSONAL_ACCESS_TOKEN) || '');
        } catch { console.log(''); }
    ")

    if [ -n "$EXISTING_TOKEN" ]; then
        echo -e "${YELLOW}  [SKIP] GitHub MCP: GITHUB_PERSONAL_ACCESS_TOKEN は既に設定済みです${RESET}"
    else
        echo ""
        echo -e "${WHITE}  GitHub MCP サーバを利用するには Personal Access Token が必要です。${RESET}"
        echo -e "${GRAY}  取得方法: https://github.com/settings/tokens${RESET}"
        echo -e "${GRAY}  必要なスコープ: repo, read:org, read:user${RESET}"
        echo ""
        printf "  GITHUB_PERSONAL_ACCESS_TOKEN を入力してください（スキップは Enter）: "
        read -r GH_TOKEN
        if [ -n "$GH_TOKEN" ]; then
            # 環境変数経由でトークンを渡す（シェルインジェクション対策）
            GH_TOKEN="$GH_TOKEN" LOCAL_SETTINGS_PATH="$LOCAL_SETTINGS_PATH" node -e "
                const fs = require('fs');
                const path = process.env.LOCAL_SETTINGS_PATH;
                let s = {};
                try { s = JSON.parse(fs.readFileSync(path, 'utf8')); } catch {}
                s.env = s.env || {};
                s.env.GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GH_TOKEN;
                fs.writeFileSync(path, JSON.stringify(s, null, 2) + '\n', 'utf8');
            "
            echo -e "  ${GREEN}-> GITHUB_PERSONAL_ACCESS_TOKEN を設定しました${RESET}"
        else
            echo -e "${YELLOW}  -> スキップしました（後で .claude/settings.local.json に追記してください）${RESET}"
        fi
    fi

    echo ""
    echo -e "  ${GREEN}-> .claude/settings.local.json を更新しました${RESET}"
fi

# ===== 完了 =====
echo ""
echo -e "${GREEN}============================================${RESET}"
echo -e "${GREEN}  セットアップ完了！${RESET}"
echo -e "${GREEN}============================================${RESET}"
echo ""
echo -e "${CYAN}  次のステップ:${RESET}"
echo "  1. VSCode でプロジェクトを開く"
echo "  2. Claude Code を起動（SessionStart hook が自動実行される）"
echo "  3. エージェントを選択:"
echo "       /agent-interviewer       （要件ヒアリング）"
echo "       /agent-architect         （設計）"
echo "       /agent-planner           （計画立案）"
echo "       /agent-developer         （実装・デバッグ）"
echo "       /agent-tester            （テスト）"
echo "       /agent-code-reviewer     （コードレビュー）"
echo "       /agent-security-reviewer （セキュリティ診断）"
echo ""
echo -e "${CYAN}  利用可能なコマンド:${RESET}"
echo "       /init-session        （セッション復元）"
echo "       /end-session         （セッション保存）"
echo "       /status              （状態確認）"
echo "       /cluster-promote     （インスティンクト昇格）"
echo "       /enable-sandbox      （サンドボックス有効化）"
echo "       /clear-file-history  （ファイル履歴クリア）"
echo ""
echo -e "${CYAN}  MCP サーバ（自動有効）:${RESET}"
echo "       filesystem          （プロジェクト内ファイル操作）"
echo "       memory              （ナレッジグラフ型永続メモリ）"
echo "       sequential-thinking （段階的思考・問題解決）"
echo "       github              （GitHub 操作 ※要トークン設定）"
echo ""
echo -e "${GRAY}  GitHub トークンを後で設定する場合:${RESET}"
echo "       ./setup.sh --mcp  または"
echo "       .claude/settings.local.json の env.GITHUB_PERSONAL_ACCESS_TOKEN に直接記入"
