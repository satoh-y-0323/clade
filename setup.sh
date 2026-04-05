#!/usr/bin/env bash
# setup.sh
# Clade セットアップ（Linux/Mac 用）
#
# 実行方法:
#   chmod +x setup.sh
#   ./setup.sh [プロジェクトパス]

set -euo pipefail

# ===== カラー出力 =====
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
GRAY='\033[0;90m'
RESET='\033[0m'

# ===== 引数パース =====
PROJECT_PATH=""

for arg in "$@"; do
    PROJECT_PATH="$arg"
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

# ===== gh CLI の確認 =====
if command -v gh &>/dev/null; then
    GH_VERSION=$(gh --version | head -1)
    echo -e "${GREEN}[OK] gh CLI: ${GH_VERSION}${RESET}"
    if gh auth status &>/dev/null; then
        echo -e "${GREEN}[OK] gh: 認証済み${RESET}"
    else
        echo -e "${YELLOW}[WARN] gh CLI はインストール済みですが未認証です。${RESET}"
        echo -e "${YELLOW}  セットアップ後に: gh auth login${RESET}"
    fi
else
    echo -e "${YELLOW}[WARN] gh CLI が見つかりません。${RESET}"
    echo -e "${YELLOW}  GitHub 操作（Issue/PR 等）には gh CLI が必要です。${RESET}"
    echo -e "${GRAY}  インストール: https://cli.github.com${RESET}"
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
echo "       playwright          （ブラウザ自動操作）"
echo ""
echo -e "${CYAN}  GitHub 操作（gh CLI）:${RESET}"
echo "       Issue/PR 操作は gh CLI を使用します。"
echo "       未認証の場合: gh auth login"
