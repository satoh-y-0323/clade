# cleanup_en.ps1
# Cleanup script for removing legacy data from Clade v1.5 and earlier (Windows, no WSL required)
#
# Removes:
#   .claude\instincts\raw\observations.jsonl    (all-tool execution log)
#   .claude\instincts\raw\patterns_*.json       (auto-extracted patterns)
#   .claude\hooks\extract-patterns.js           (pattern extraction script)
#
# Usage:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\cleanup_en.ps1 -ProjectPath "C:\path\to\your\project"
#   .\cleanup_en.ps1                            # uses current directory if no path given

param(
    [string]$ProjectPath = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$claudeDir = Join-Path $ProjectPath ".claude"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Clade Cleanup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Target project: $ProjectPath" -ForegroundColor Yellow
Write-Host ""

# ===== Verify .claude\ exists =====
if (-not (Test-Path $claudeDir)) {
    Write-Host "[ERROR] .claude\ directory not found: $claudeDir" -ForegroundColor Red
    Write-Host "  Please specify a project that has Clade set up." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] .claude\ directory found" -ForegroundColor Green
Write-Host ""

# ===== [1/3] observations.jsonl =====
Write-Host "[1/3] Checking observations.jsonl..." -ForegroundColor Cyan
$obsFile = Join-Path $claudeDir "instincts\raw\observations.jsonl"
if (Test-Path $obsFile) {
    Remove-Item $obsFile -Force
    Write-Host "  -> Deleted: .claude\instincts\raw\observations.jsonl" -ForegroundColor Green
} else {
    Write-Host "  -> Not found (skipped)" -ForegroundColor Gray
}

# ===== [2/3] patterns_*.json =====
Write-Host ""
Write-Host "[2/3] Checking patterns_*.json..." -ForegroundColor Cyan
$rawDir = Join-Path $claudeDir "instincts\raw"
$patternCount = 0
if (Test-Path $rawDir) {
    $patternFiles = Get-ChildItem -Path $rawDir -Filter "patterns_*.json" -ErrorAction SilentlyContinue
    foreach ($f in $patternFiles) {
        Remove-Item $f.FullName -Force
        Write-Host "  -> Deleted: .claude\instincts\raw\$($f.Name)" -ForegroundColor Green
        $patternCount++
    }
}
if ($patternCount -eq 0) {
    Write-Host "  -> Not found (skipped)" -ForegroundColor Gray
}

# ===== [3/3] extract-patterns.js =====
Write-Host ""
Write-Host "[3/3] Checking extract-patterns.js..." -ForegroundColor Cyan
$extractJs = Join-Path $claudeDir "hooks\extract-patterns.js"
if (Test-Path $extractJs) {
    Remove-Item $extractJs -Force
    Write-Host "  -> Deleted: .claude\hooks\extract-patterns.js" -ForegroundColor Green
} else {
    Write-Host "  -> Not found (skipped)" -ForegroundColor Gray
}

# ===== Done =====
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Cleanup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  This script removed legacy observation data from Clade v1.5 and earlier." -ForegroundColor Cyan
Write-Host "  From v1.6 onwards, only Bash command results are recorded." -ForegroundColor Cyan
Write-Host "  (stored in .claude\instincts\raw\bash-log.jsonl)" -ForegroundColor Cyan
Write-Host ""
