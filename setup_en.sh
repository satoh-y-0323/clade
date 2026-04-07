#!/usr/bin/env bash
# setup_en.sh
# Clade Setup - English version (Linux/Mac)
#
# Usage:
#   chmod +x setup_en.sh
#   ./setup_en.sh [project-path]

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}============================================${RESET}"
echo -e "${CYAN}  Clade Setup (for your project)${RESET}"
echo -e "${CYAN}============================================${RESET}"
echo ""
echo -e "${YELLOW}  Project: ${PROJECT_PATH}${RESET}"
echo ""

# ===== Check Node.js =====
if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}[OK] Node.js: ${NODE_VERSION}${RESET}"
else
    echo -e "${RED}[ERROR] Node.js not found.${RESET}"
    echo -e "${RED}  Please install it from https://nodejs.org${RESET}"
    exit 1
fi

# ===== Check gh CLI =====
if command -v gh &>/dev/null; then
    GH_VERSION=$(gh --version | head -1)
    echo -e "${GREEN}[OK] gh CLI: ${GH_VERSION}${RESET}"
    if gh auth status &>/dev/null; then
        echo -e "${GREEN}[OK] gh: authenticated${RESET}"
    else
        echo -e "${YELLOW}[WARN] gh CLI is installed but not authenticated.${RESET}"
        echo -e "${YELLOW}  Run after setup: gh auth login${RESET}"
    fi
else
    echo -e "${YELLOW}[WARN] gh CLI not found.${RESET}"
    echo -e "${YELLOW}  gh CLI is required for GitHub operations (Issues, PRs, etc.).${RESET}"
    echo -e "${GRAY}  Install: https://cli.github.com${RESET}"
fi

# ===== Copy project configuration =====
echo ""
echo -e "${CYAN}[1/4] Copying project config to: ${PROJECT_PATH}/.claude/${RESET}"

PROJ_CLAUDE="${PROJECT_PATH}/.claude"
SOURCE_CLAUDE="${SCRIPT_DIR}/templates/en/.claude"

if [ ! -d "$SOURCE_CLAUDE" ]; then
    echo -e "${RED}[ERROR] Source .claude/ folder not found: ${SOURCE_CLAUDE}${RESET}"
    exit 1
fi

if [ -d "$PROJ_CLAUDE" ]; then
    printf "  Existing .claude/ detected. Overwrite? [y/N]: "
    read -r OVERWRITE
    if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
        cp -r "${SOURCE_CLAUDE}/." "${PROJ_CLAUDE}/"
        echo -e "  ${GREEN}-> Overwrite complete${RESET}"
    else
        echo "  -> Skipped"
    fi
else
    cp -r "$SOURCE_CLAUDE" "$PROJECT_PATH/"
    echo -e "  ${GREEN}-> Copy complete${RESET}"
fi

# ===== Deploy settings.local.json =====
echo ""
echo -e "${CYAN}[2/4] Deploying settings.local.json...${RESET}"

LOCAL_JSON="${PROJ_CLAUDE}/settings.local.json"
EXAMPLE_JSON="${PROJ_CLAUDE}/settings.local.json.example"

if [ -f "$EXAMPLE_JSON" ]; then
    if [ -f "$LOCAL_JSON" ]; then
        printf "  Existing settings.local.json detected. Overwrite? [y/N]: "
        read -r OVERWRITE_LOCAL
        if [[ "$OVERWRITE_LOCAL" =~ ^[Yy]$ ]]; then
            cp "$EXAMPLE_JSON" "$LOCAL_JSON"
            echo -e "  ${GREEN}-> Overwrite complete${RESET}"
        else
            echo "  -> Skipped"
        fi
    else
        cp "$EXAMPLE_JSON" "$LOCAL_JSON"
        echo -e "  ${GREEN}-> Deploy complete${RESET}"
    fi
else
    echo -e "  ${YELLOW}-> settings.local.json.example not found. Skipped.${RESET}"
fi

# ===== Create empty directories =====
echo ""
echo -e "${CYAN}[3/4] Creating required directories...${RESET}"

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
echo -e "  ${GREEN}-> Done${RESET}"

# ===== Update .gitignore =====
echo ""
echo -e "${CYAN}[4/4] Updating .gitignore...${RESET}"

GITIGNORE="${PROJECT_PATH}/.gitignore"
ENTRIES=(
    "# Clade - local settings (machine-specific paths)"
    ".claude/settings.local.json"
    "# Clade - session records"
    ".claude/memory/sessions/"
    "# Clade - observation data"
    ".claude/instincts/raw/"
    "# Clade - cluster data"
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
            echo "  -> Added: $entry"
            ADDED=$((ADDED + 1))
        fi
    done
    if [ "$ADDED" -eq 0 ]; then
        echo "  -> Already configured"
    fi
else
    printf '%s\n' "${ENTRIES[@]}" > "$GITIGNORE"
    echo -e "  ${GREEN}-> .gitignore created${RESET}"
fi

# ===== Done =====
echo ""
echo -e "${GREEN}============================================${RESET}"
echo -e "${GREEN}  Setup complete!${RESET}"
echo -e "${GREEN}============================================${RESET}"
echo ""
echo -e "${CYAN}  Next steps:${RESET}"
echo "  1. Open your project in VSCode"
echo "  2. Launch Claude Code (SessionStart hook runs automatically)"
echo "  3. Choose an agent:"
echo "       /agent-interviewer       (requirements gathering)"
echo "       /agent-architect         (design)"
echo "       /agent-planner           (planning)"
echo "       /agent-developer         (implementation & debug)"
echo "       /agent-tester            (testing)"
echo "       /agent-code-reviewer     (code review)"
echo "       /agent-security-reviewer (security audit)"
echo ""
echo -e "${CYAN}  Available commands:${RESET}"
echo "       /init-session        (restore session)"
echo "       /end-session         (save session)"
echo "       /status              (check status)"
echo "       /cluster-promote     (promote instincts)"
echo "       /enable-sandbox      (enable sandbox)"
echo "       /clear-file-history  (clear file history)"
echo ""
echo -e "${CYAN}  MCP servers (auto-enabled):${RESET}"
echo "       filesystem          (file operations in project)"
echo "       memory              (knowledge graph persistent memory)"
echo "       sequential-thinking (step-by-step reasoning)"
echo "       playwright          (browser automation)"
echo ""
echo -e "${CYAN}  GitHub operations (gh CLI):${RESET}"
echo "       Issues/PRs are handled via the gh CLI."
echo "       If not authenticated: gh auth login"
