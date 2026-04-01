# setup.ps1
# Claude Code プロジェクトセットアップ（WSL不要版）
#
# 実行方法:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\setup.ps1
#   .\setup.ps1 -ProjectPath "C:\path\to\your\project"

param(
    [string]$ProjectPath = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Claude Code セットアップ（プロジェクト用）" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  プロジェクト: $ProjectPath" -ForegroundColor Yellow
Write-Host ""

# ===== Node.js の確認 =====
try {
    $nodeVersion = node -v 2>$null
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js が見つかりません。" -ForegroundColor Red
    Write-Host "  https://nodejs.org からインストールしてください。" -ForegroundColor Red
    exit 1
}

# ===== プロジェクト設定の配置 =====
Write-Host ""
Write-Host "[1/3] プロジェクト設定を配置中: $ProjectPath\.claude\" -ForegroundColor Cyan

$projClaude = Join-Path $ProjectPath ".claude"
$sourceClaude = Join-Path $ScriptDir "project\.claude"

if (-not (Test-Path $sourceClaude)) {
    Write-Host "[ERROR] セットアップ元の .claude\ フォルダが見つかりません: $sourceClaude" -ForegroundColor Red
    exit 1
}

if (Test-Path $projClaude) {
    $overwrite = Read-Host "  既存の .claude\ を検出。上書きしますか？ [y/N]"
    if ($overwrite -notmatch "^[Yy]$") {
        Write-Host "  -> スキップしました"
    } else {
        Copy-Item "$sourceClaude\*" -Destination $projClaude -Recurse -Force
        Write-Host "  -> 上書き完了" -ForegroundColor Green
    }
} else {
    Copy-Item $sourceClaude -Destination $projClaude -Recurse
    Write-Host "  -> 配置完了" -ForegroundColor Green
}

# ===== 空ディレクトリを作成 =====
Write-Host ""
Write-Host "[2/3] 必要なディレクトリを作成中..." -ForegroundColor Cyan

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
Write-Host "  -> 完了" -ForegroundColor Green

# ===== .gitignore に追加 =====
Write-Host ""
Write-Host "[3/3] .gitignore を更新中..." -ForegroundColor Cyan

$gitignore = Join-Path $ProjectPath ".gitignore"
$entries = @(
    "# Claude Code - ローカル設定（機械固有パスを含む）",
    ".claude/settings.local.json",
    "# Claude Code - セッション記録",
    ".claude/memory/sessions/",
    "# Claude Code - 観察データ",
    ".claude/instincts/raw/",
    "# Claude Code - クラスタデータ",
    ".claude/instincts/clusters/"
)

if (Test-Path $gitignore) {
    $existing = Get-Content $gitignore -Raw -Encoding UTF8
    $toAdd = $entries | Where-Object { $existing -notmatch [regex]::Escape($_) }
    if ($toAdd.Count -gt 0) {
        Add-Content $gitignore ("`n" + ($toAdd -join "`n")) -Encoding UTF8
        foreach ($e in $toAdd) { Write-Host "  -> 追加: $e" }
    } else {
        Write-Host "  -> 既に設定済みです"
    }
} else {
    $entries | Set-Content $gitignore -Encoding UTF8
    Write-Host "  -> .gitignore を作成しました" -ForegroundColor Green
}

# ===== 完了 =====
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  セットアップ完了！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  次のステップ:" -ForegroundColor Cyan
Write-Host "  1. VSCode でプロジェクトを開く"
Write-Host "  2. Claude Code を起動（SessionStart hook が自動実行される）"
Write-Host "  3. エージェントを選択:"
Write-Host "       /agent:interviewer       （要件ヒアリング）"
Write-Host "       /agent:architect         （設計）"
Write-Host "       /agent:planner           （計画立案）"
Write-Host "       /agent:developer         （実装・デバッグ）"
Write-Host "       /agent:tester            （テスト）"
Write-Host "       /agent:code-reviewer     （コードレビュー）"
Write-Host "       /agent:security-reviewer （セキュリティ診断）"
Write-Host ""
Write-Host "  利用可能なコマンド:" -ForegroundColor Cyan
Write-Host "       /init-session        （セッション復元）"
Write-Host "       /end-session         （セッション保存）"
Write-Host "       /status              （状態確認）"
Write-Host "       /cluster-promote     （インスティンクト昇格）"
Write-Host "       /enable-sandbox      （サンドボックス有効化）"
Write-Host "       /clear-file-history  （ファイル履歴クリア）"
