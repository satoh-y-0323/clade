#!/usr/bin/env bash
# setup_en.sh
# Clade Setup - English version (Linux/Mac)
#
# Usage:
#   chmod +x setup_en.sh
#   ./setup_en.sh [project-path]
#   ./setup_en.sh --mcp [project-path]   # Also set up MCP credentials

set -euo pipefail

# ===== Color output =====
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
WHITE='\033[0;37m'
GRAY='\033[0;90m'
RESET='\033[0m'

# ===== Parse arguments =====
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

# ===== Copy project configuration =====
echo ""
echo -e "${CYAN}[1/3] Copying project config to: ${PROJECT_PATH}/.claude/${RESET}"

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

# ===== Create empty directories =====
echo ""
echo -e "${CYAN}[2/3] Creating required directories...${RESET}"

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
echo -e "${CYAN}[3/3] Updating .gitignore...${RESET}"

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

# ===== MCP credentials setup =====
if [ "$MCP" = true ]; then
    echo ""
    echo -e "${CYAN}[MCP] Setting up MCP server credentials...${RESET}"

    LOCAL_SETTINGS_PATH="${PROJ_CLAUDE}/settings.local.json"

    if [ ! -f "$LOCAL_SETTINGS_PATH" ]; then
        echo '{}' > "$LOCAL_SETTINGS_PATH"
    fi

    # Check for existing token (read JSON via Node.js)
    EXISTING_TOKEN=$(LOCAL_SETTINGS_PATH="$LOCAL_SETTINGS_PATH" node -e "
        const fs = require('fs');
        try {
            const s = JSON.parse(fs.readFileSync(process.env.LOCAL_SETTINGS_PATH, 'utf8'));
            console.log((s.env && s.env.GITHUB_PERSONAL_ACCESS_TOKEN) || '');
        } catch { console.log(''); }
    ")

    if [ -n "$EXISTING_TOKEN" ]; then
        echo -e "${YELLOW}  [SKIP] GitHub MCP: GITHUB_PERSONAL_ACCESS_TOKEN is already set${RESET}"
    else
        echo ""
        echo -e "${WHITE}  A Personal Access Token is required to use the GitHub MCP server.${RESET}"
        echo -e "${GRAY}  How to get one: https://github.com/settings/tokens${RESET}"
        echo -e "${GRAY}  Required scopes: repo, read:org, read:user${RESET}"
        echo ""
        printf "  Enter GITHUB_PERSONAL_ACCESS_TOKEN (press Enter to skip): "
        read -r GH_TOKEN
        if [ -n "$GH_TOKEN" ]; then
            # Pass token via environment variable to avoid shell injection
            GH_TOKEN="$GH_TOKEN" LOCAL_SETTINGS_PATH="$LOCAL_SETTINGS_PATH" node -e "
                const fs = require('fs');
                const path = process.env.LOCAL_SETTINGS_PATH;
                let s = {};
                try { s = JSON.parse(fs.readFileSync(path, 'utf8')); } catch {}
                s.env = s.env || {};
                s.env.GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GH_TOKEN;
                fs.writeFileSync(path, JSON.stringify(s, null, 2) + '\n', 'utf8');
            "
            echo -e "  ${GREEN}-> GITHUB_PERSONAL_ACCESS_TOKEN set${RESET}"
        else
            echo -e "${YELLOW}  -> Skipped (add it later to .claude/settings.local.json)${RESET}"
        fi
    fi

    echo ""
    echo -e "  ${GREEN}-> .claude/settings.local.json updated${RESET}"
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
echo "       github              (GitHub operations *requires token)"
echo ""
echo -e "${GRAY}  To set up the GitHub token later:${RESET}"
echo "       ./setup_en.sh --mcp  or"
echo "       edit .claude/settings.local.json and set env.GITHUB_PERSONAL_ACCESS_TOKEN"
