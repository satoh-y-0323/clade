# cleanup.ps1
# Clade v1.5 以前の不要データを削除するクリーンアップスクリプト（WSL不要版）
#
# 削除対象:
#   .claude\instincts\raw\observations.jsonl    （全ツール実行ログ）
#   .claude\instincts\raw\patterns_*.json       （自動抽出パターン）
#   .claude\hooks\extract-patterns.js           （パターン抽出スクリプト）
#
# 実行方法:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\cleanup.ps1 -ProjectPath "C:\path\to\your\project"
#   .\cleanup.ps1                               # カレントディレクトリを対象にする場合

param(
    [string]$ProjectPath = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$claudeDir = Join-Path $ProjectPath ".claude"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Clade クリーンアップ" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  対象プロジェクト: $ProjectPath" -ForegroundColor Yellow
Write-Host ""

# ===== .claude\ の存在確認 =====
if (-not (Test-Path $claudeDir)) {
    Write-Host "[ERROR] .claude\ フォルダが見つかりません: $claudeDir" -ForegroundColor Red
    Write-Host "  Clade がセットアップされているプロジェクトを指定してください。" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] .claude\ フォルダを確認しました" -ForegroundColor Green
Write-Host ""

# ===== [1/3] observations.jsonl =====
Write-Host "[1/3] observations.jsonl を確認中..." -ForegroundColor Cyan
$obsFile = Join-Path $claudeDir "instincts\raw\observations.jsonl"
if (Test-Path $obsFile) {
    Remove-Item $obsFile -Force
    Write-Host "  -> 削除しました: .claude\instincts\raw\observations.jsonl" -ForegroundColor Green
} else {
    Write-Host "  -> 存在しません（スキップ）" -ForegroundColor Gray
}

# ===== [2/3] patterns_*.json =====
Write-Host ""
Write-Host "[2/3] patterns_*.json を確認中..." -ForegroundColor Cyan
$rawDir = Join-Path $claudeDir "instincts\raw"
$patternCount = 0
if (Test-Path $rawDir) {
    $patternFiles = Get-ChildItem -Path $rawDir -Filter "patterns_*.json" -ErrorAction SilentlyContinue
    foreach ($f in $patternFiles) {
        Remove-Item $f.FullName -Force
        Write-Host "  -> 削除しました: .claude\instincts\raw\$($f.Name)" -ForegroundColor Green
        $patternCount++
    }
}
if ($patternCount -eq 0) {
    Write-Host "  -> 存在しません（スキップ）" -ForegroundColor Gray
}

# ===== [3/3] extract-patterns.js =====
Write-Host ""
Write-Host "[3/3] extract-patterns.js を確認中..." -ForegroundColor Cyan
$extractJs = Join-Path $claudeDir "hooks\extract-patterns.js"
if (Test-Path $extractJs) {
    Remove-Item $extractJs -Force
    Write-Host "  -> 削除しました: .claude\hooks\extract-patterns.js" -ForegroundColor Green
} else {
    Write-Host "  -> 存在しません（スキップ）" -ForegroundColor Gray
}

# ===== 完了 =====
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  クリーンアップ完了！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  このスクリプトは Clade v1.5 以前の観察データを削除しました。" -ForegroundColor Cyan
Write-Host "  v1.6 以降では Bash コマンドの実行結果のみを記録します。" -ForegroundColor Cyan
Write-Host "  （.claude\instincts\raw\bash-log.jsonl）" -ForegroundColor Cyan
Write-Host ""
