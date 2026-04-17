# setup_en.ps1
# Clade Setup (English version, no WSL required)
#
# Usage:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\setup_en.ps1 -ProjectPath "C:\path\to\your\project"

param(
    [string]$ProjectPath = (Get-Location).Path
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Clade Setup (for your project)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Project: $ProjectPath" -ForegroundColor Yellow
Write-Host ""

# ===== Check Node.js =====
try {
    $nodeVersion = node -v 2>$null
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found." -ForegroundColor Red
    Write-Host "  Please install it from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# ===== Check gh CLI =====
try {
    $ghVersion = (gh --version 2>$null | Select-Object -First 1)
    Write-Host "[OK] gh CLI: $ghVersion" -ForegroundColor Green
    $ghAuth = gh auth status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] gh: authenticated" -ForegroundColor Green
    } else {
        Write-Host "[WARN] gh CLI is installed but not authenticated." -ForegroundColor Yellow
        Write-Host "  Run after setup: gh auth login" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] gh CLI not found." -ForegroundColor Yellow
    Write-Host "  gh CLI is required for GitHub operations (Issues, PRs, etc.)." -ForegroundColor Yellow
    Write-Host "  Install: https://cli.github.com" -ForegroundColor Gray
}

# ===== Copy project configuration =====
Write-Host ""
Write-Host "[1/4] Copying project config to: $ProjectPath\.claude\" -ForegroundColor Cyan

$projClaude = Join-Path $ProjectPath ".claude"
$sourceClaude = Join-Path $ScriptDir "templates\en\.claude"

if (-not (Test-Path $sourceClaude)) {
    Write-Host "[ERROR] Source .claude\ folder not found: $sourceClaude" -ForegroundColor Red
    exit 1
}

if (Test-Path $projClaude) {
    $overwrite = Read-Host "  Existing .claude\ detected. Overwrite? [y/N]"
    if ($overwrite -notmatch "^[Yy]$") {
        Write-Host "  -> Skipped"
    } else {
        Copy-Item "$sourceClaude\*" -Destination $projClaude -Recurse -Force
        Write-Host "  -> Overwrite complete" -ForegroundColor Green
    }
} else {
    Copy-Item $sourceClaude -Destination $projClaude -Recurse
    Write-Host "  -> Copy complete" -ForegroundColor Green
}

# Overwrite rules/local.md with empty template if it was copied from the distribution repo
$localMd = Join-Path $projClaude "rules\local.md"
if (Test-Path $localMd) {
    @"
# Local Rules (Project-specific)

Add your project-specific rules here.
Write rules to customize Claude Code behavior for this project.
"@ | Set-Content $localMd -Encoding UTF8
    Write-Host "  -> rules/local.md overwritten with empty template" -ForegroundColor Yellow
}

# ===== Deploy settings.local.json =====
Write-Host ""
Write-Host "[2/4] Deploying settings.local.json..." -ForegroundColor Cyan

$localJson = Join-Path $projClaude "settings.local.json"
$exampleJson = Join-Path $projClaude "settings.local.json.example"

if (Test-Path $exampleJson) {
    if (Test-Path $localJson) {
        $overwriteLocal = Read-Host "  Existing settings.local.json detected. Overwrite? [y/N]"
        if ($overwriteLocal -match "^[Yy]$") {
            Copy-Item $exampleJson $localJson -Force
            Write-Host "  -> Overwrite complete" -ForegroundColor Green
        } else {
            Write-Host "  -> Skipped"
        }
    } else {
        Copy-Item $exampleJson $localJson
        Write-Host "  -> Deploy complete" -ForegroundColor Green
    }
} else {
    Write-Host "  -> settings.local.json.example not found. Skipped." -ForegroundColor Yellow
}

# ===== Create empty directories =====
Write-Host ""
Write-Host "[3/4] Creating required directories..." -ForegroundColor Cyan

$emptyDirs = @(
    "skills\project",
    "memory\sessions",
    "instincts\raw",
    "instincts\clusters"
)
foreach ($d in $emptyDirs) {
    New-Item -ItemType Directory -Path "$projClaude\$d" -Force | Out-Null
    Write-Host "  -> .claude\$d"
}
Write-Host "  -> Done" -ForegroundColor Green

# ===== Update .gitignore =====
Write-Host ""
Write-Host "[4/4] Updating .gitignore..." -ForegroundColor Cyan

$gitignore = Join-Path $ProjectPath ".gitignore"
$entries = @(
    "# Clade - local settings (machine-specific paths)",
    ".claude/settings.local.json",
    "# Clade - session records",
    ".claude/memory/sessions/",
    "# Clade - observation data",
    ".claude/instincts/raw/",
    "# Clade - cluster data",
    ".claude/instincts/clusters/"
)

if (Test-Path $gitignore) {
    $existing = Get-Content $gitignore -Raw -Encoding UTF8
    $toAdd = $entries | Where-Object { $existing -notmatch [regex]::Escape($_) }
    if ($toAdd.Count -gt 0) {
        Add-Content $gitignore ("`n" + ($toAdd -join "`n")) -Encoding UTF8
        foreach ($e in $toAdd) { Write-Host "  -> Added: $e" }
    } else {
        Write-Host "  -> Already configured"
    }
} else {
    $entries | Set-Content $gitignore -Encoding UTF8
    Write-Host "  -> .gitignore created" -ForegroundColor Green
}

# ===== Done =====
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open your project in VSCode"
Write-Host "  2. Launch Claude Code (SessionStart hook runs automatically)"
Write-Host "  3. Choose an agent:"
Write-Host "       /agent-interviewer       (requirements gathering)"
Write-Host "       /agent-architect         (design)"
Write-Host "       /agent-planner           (planning)"
Write-Host "       /agent-developer         (implementation & debug)"
Write-Host "       /agent-tester            (testing)"
Write-Host "       /agent-code-reviewer     (code review)"
Write-Host "       /agent-security-reviewer (security audit)"
Write-Host ""
Write-Host "  Available commands:" -ForegroundColor Cyan
Write-Host "       /init-session        (restore session)"
Write-Host "       /end-session         (save session)"
Write-Host "       /status              (check status)"
Write-Host "       /cluster-promote     (promote instincts)"
Write-Host "       /enable-sandbox      (enable sandbox)"
Write-Host "       /clear-file-history  (clear file history)"
Write-Host ""
Write-Host "  MCP servers (auto-enabled):" -ForegroundColor Cyan
Write-Host "       filesystem          (file operations in project)"
Write-Host "       memory              (knowledge graph persistent memory)"
Write-Host "       sequential-thinking (step-by-step reasoning)"
Write-Host "       playwright          (browser automation)"
Write-Host ""
Write-Host "  GitHub operations (gh CLI):" -ForegroundColor Cyan
Write-Host "       Issues/PRs are handled via the gh CLI."
Write-Host "       If not authenticated: gh auth login"
