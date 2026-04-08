#!/usr/bin/env bash
# cleanup_en.sh
# Cleanup script for removing legacy data from Clade v1.5 and earlier (Linux/Mac)
#
# Removes:
#   .claude/instincts/raw/observations.jsonl    (all-tool execution log)
#   .claude/instincts/raw/patterns_*.json       (auto-extracted patterns)
#   .claude/hooks/extract-patterns.js           (pattern extraction script)
#
# Usage:
#   chmod +x cleanup_en.sh
#   ./cleanup_en.sh [project-path]
#   ./cleanup_en.sh                    # uses current directory if no path given

set -euo pipefail

# ===== Color output =====
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
GRAY='\033[0;90m'
RESET='\033[0m'

# ===== Parse arguments =====
PROJECT_PATH=""
for arg in "$@"; do
    PROJECT_PATH="$arg"
done
if [ -z "$PROJECT_PATH" ]; then
    PROJECT_PATH="$(pwd)"
fi

CLAUDE_DIR="${PROJECT_PATH}/.claude"

echo -e "${CYAN}============================================${RESET}"
echo -e "${CYAN}  Clade Cleanup${RESET}"
echo -e "${CYAN}============================================${RESET}"
echo ""
echo -e "${YELLOW}  Target project: ${PROJECT_PATH}${RESET}"
echo ""

# ===== Verify .claude/ exists =====
if [ ! -d "$CLAUDE_DIR" ]; then
    echo -e "${RED}[ERROR] .claude/ directory not found: ${CLAUDE_DIR}${RESET}"
    echo -e "${RED}  Please specify a project that has Clade set up.${RESET}"
    exit 1
fi

echo -e "${GREEN}[OK] .claude/ directory found${RESET}"
echo ""

# ===== [1/3] observations.jsonl =====
echo -e "${CYAN}[1/3] Checking observations.jsonl...${RESET}"
OBS_FILE="${CLAUDE_DIR}/instincts/raw/observations.jsonl"
if [ -f "$OBS_FILE" ]; then
    rm "$OBS_FILE"
    echo -e "  ${GREEN}-> Deleted: .claude/instincts/raw/observations.jsonl${RESET}"
else
    echo -e "  ${GRAY}-> Not found (skipped)${RESET}"
fi

# ===== [2/3] patterns_*.json =====
echo ""
echo -e "${CYAN}[2/3] Checking patterns_*.json...${RESET}"
RAW_DIR="${CLAUDE_DIR}/instincts/raw"
PATTERN_COUNT=0
if [ -d "$RAW_DIR" ]; then
    for f in "${RAW_DIR}"/patterns_*.json; do
        if [ -f "$f" ]; then
            rm "$f"
            echo -e "  ${GREEN}-> Deleted: .claude/instincts/raw/$(basename "$f")${RESET}"
            PATTERN_COUNT=$((PATTERN_COUNT + 1))
        fi
    done
fi
if [ "$PATTERN_COUNT" -eq 0 ]; then
    echo -e "  ${GRAY}-> Not found (skipped)${RESET}"
fi

# ===== [3/3] extract-patterns.js =====
echo ""
echo -e "${CYAN}[3/3] Checking extract-patterns.js...${RESET}"
EXTRACT_JS="${CLAUDE_DIR}/hooks/extract-patterns.js"
if [ -f "$EXTRACT_JS" ]; then
    rm "$EXTRACT_JS"
    echo -e "  ${GREEN}-> Deleted: .claude/hooks/extract-patterns.js${RESET}"
else
    echo -e "  ${GRAY}-> Not found (skipped)${RESET}"
fi

# ===== Done =====
echo ""
echo -e "${GREEN}============================================${RESET}"
echo -e "${GREEN}  Cleanup complete!${RESET}"
echo -e "${GREEN}============================================${RESET}"
echo ""
echo -e "${CYAN}  This script removed legacy observation data from Clade v1.5 and earlier.${RESET}"
echo -e "${CYAN}  From v1.6 onwards, only Bash command results are recorded.${RESET}"
echo -e "${CYAN}  (stored in .claude/instincts/raw/bash-log.jsonl)${RESET}"
echo ""
