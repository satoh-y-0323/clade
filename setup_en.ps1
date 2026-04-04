# setup_en.ps1
# Clade Setup (English version, no WSL required)
#
# Usage:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\setup_en.ps1 -ProjectPath "C:\path\to\your\project"

param(
    [string]$ProjectPath = (Get-Location).Path,
    [switch]$MCP
)

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

# ===== Copy project configuration =====
Write-Host ""
Write-Host "[1/3] Copying project config to: $ProjectPath\.claude\" -ForegroundColor Cyan

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

# ===== Create empty directories =====
Write-Host ""
Write-Host "[2/3] Creating required directories..." -ForegroundColor Cyan

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
Write-Host "[3/3] Updating .gitignore..." -ForegroundColor Cyan

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

# ===== MCP credentials setup =====
if ($MCP) {
    Write-Host ""
    Write-Host "[MCP] Setting up MCP server credentials..." -ForegroundColor Cyan

    $localSettingsPath = Join-Path $projClaude "settings.local.json"

    if (Test-Path $localSettingsPath) {
        $localSettings = Get-Content $localSettingsPath -Raw -Encoding UTF8 | ConvertFrom-Json
    } else {
        $localSettings = [PSCustomObject]@{}
    }

    if (-not ($localSettings.PSObject.Properties.Name -contains "env")) {
        $localSettings | Add-Member -MemberType NoteProperty -Name "env" -Value ([PSCustomObject]@{})
    }

    # --- GitHub MCP server ---
    $existingToken = $localSettings.env.PSObject.Properties["GITHUB_PERSONAL_ACCESS_TOKEN"]
    if ($existingToken -and $existingToken.Value -ne "") {
        Write-Host "  [SKIP] GitHub MCP: GITHUB_PERSONAL_ACCESS_TOKEN is already set" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "  A Personal Access Token is required to use the GitHub MCP server." -ForegroundColor White
        Write-Host "  How to get one: https://github.com/settings/tokens" -ForegroundColor Gray
        Write-Host "  Required scopes: repo, read:org, read:user" -ForegroundColor Gray
        Write-Host ""
        $ghToken = Read-Host "  Enter GITHUB_PERSONAL_ACCESS_TOKEN (press Enter to skip)"
        if ($ghToken -ne "") {
            if ($localSettings.env.PSObject.Properties.Name -contains "GITHUB_PERSONAL_ACCESS_TOKEN") {
                $localSettings.env.GITHUB_PERSONAL_ACCESS_TOKEN = $ghToken
            } else {
                $localSettings.env | Add-Member -MemberType NoteProperty -Name "GITHUB_PERSONAL_ACCESS_TOKEN" -Value $ghToken
            }
            Write-Host "  -> GITHUB_PERSONAL_ACCESS_TOKEN set" -ForegroundColor Green
        } else {
            Write-Host "  -> Skipped (add it later to .claude\settings.local.json)" -ForegroundColor Yellow
        }
    }

    $localSettings | ConvertTo-Json -Depth 10 | Set-Content $localSettingsPath -Encoding UTF8
    Write-Host ""
    Write-Host "  -> .claude\settings.local.json updated" -ForegroundColor Green
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
Write-Host "       github              (GitHub operations *requires token)"
Write-Host ""
Write-Host "  To set up the GitHub token later:" -ForegroundColor Gray
Write-Host "       .\setup_en.ps1 -MCP  or"
Write-Host "       edit .claude\settings.local.json and set env.GITHUB_PERSONAL_ACCESS_TOKEN"
