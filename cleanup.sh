#!/usr/bin/env bash
# cleanup.sh
# Clade v1.5 以前の不要データを削除するクリーンアップスクリプト（Linux/Mac 用）
#
# 削除対象:
#   .claude/instincts/raw/observations.jsonl    （全ツール実行ログ）
#   .claude/instincts/raw/patterns_*.json       （自動抽出パターン）
#   .claude/hooks/extract-patterns.js           （パターン抽出スクリプト）
#
# 実行方法:
#   chmod +x cleanup.sh
#   ./cleanup.sh [プロジェクトパス]
#   ./cleanup.sh                    # カレントディレクトリを対象にする場合

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

CLAUDE_DIR="${PROJECT_PATH}/.claude"

echo -e "${CYAN}============================================${RESET}"
echo -e "${CYAN}  Clade クリーンアップ${RESET}"
echo -e "${CYAN}============================================${RESET}"
echo ""
echo -e "${YELLOW}  対象プロジェクト: ${PROJECT_PATH}${RESET}"
echo ""

# ===== .claude/ の存在確認 =====
if [ ! -d "$CLAUDE_DIR" ]; then
    echo -e "${RED}[ERROR] .claude/ フォルダが見つかりません: ${CLAUDE_DIR}${RESET}"
    echo -e "${RED}  Clade がセットアップされているプロジェクトを指定してください。${RESET}"
    exit 1
fi

echo -e "${GREEN}[OK] .claude/ フォルダを確認しました${RESET}"
echo ""

# ===== クリーンアップ対象の確認と削除 =====
echo -e "${CYAN}[1/3] observations.jsonl を確認中...${RESET}"
OBS_FILE="${CLAUDE_DIR}/instincts/raw/observations.jsonl"
if [ -f "$OBS_FILE" ]; then
    rm "$OBS_FILE"
    echo -e "  ${GREEN}-> 削除しました: .claude/instincts/raw/observations.jsonl${RESET}"
else
    echo -e "  ${GRAY}-> 存在しません（スキップ）${RESET}"
fi

echo ""
echo -e "${CYAN}[2/3] patterns_*.json を確認中...${RESET}"
RAW_DIR="${CLAUDE_DIR}/instincts/raw"
PATTERN_COUNT=0
if [ -d "$RAW_DIR" ]; then
    for f in "${RAW_DIR}"/patterns_*.json; do
        if [ -f "$f" ]; then
            rm "$f"
            echo -e "  ${GREEN}-> 削除しました: .claude/instincts/raw/$(basename "$f")${RESET}"
            PATTERN_COUNT=$((PATTERN_COUNT + 1))
        fi
    done
fi
if [ "$PATTERN_COUNT" -eq 0 ]; then
    echo -e "  ${GRAY}-> 存在しません（スキップ）${RESET}"
fi

echo ""
echo -e "${CYAN}[3/3] extract-patterns.js を確認中...${RESET}"
EXTRACT_JS="${CLAUDE_DIR}/hooks/extract-patterns.js"
if [ -f "$EXTRACT_JS" ]; then
    rm "$EXTRACT_JS"
    echo -e "  ${GREEN}-> 削除しました: .claude/hooks/extract-patterns.js${RESET}"
else
    echo -e "  ${GRAY}-> 存在しません（スキップ）${RESET}"
fi

# ===== 完了 =====
echo ""
echo -e "${GREEN}============================================${RESET}"
echo -e "${GREEN}  クリーンアップ完了！${RESET}"
echo -e "${GREEN}============================================${RESET}"
echo ""
echo -e "${CYAN}  このスクリプトは Clade v1.5 以前の観察データを削除しました。${RESET}"
echo -e "${CYAN}  v1.6 以降では Bash コマンドの実行結果のみを記録します。${RESET}"
echo -e "${CYAN}  （.claude/instincts/raw/bash-log.jsonl）${RESET}"
echo ""
