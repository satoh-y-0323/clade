#!/usr/bin/env node
/**
 * write-report.js
 * タイムスタンプ付きレポートファイルを Windows ネイティブ環境で書き出す共通スクリプト。
 * tester / code-reviewer / security-reviewer から呼び出される。
 *
 * 使い方:
 *   node .claude/hooks/write-report.js <baseName> <レポート内容>
 *
 * 例:
 *   node .claude/hooks/write-report.js test-report "# テストレポート..."
 *
 * 出力:
 *   実際に書き出したファイルパスを標準出力に表示する。
 *   例: [write-report] .claude/reports/test-report-20260401-143022.md
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const [, , baseName, ...contentParts] = process.argv;

if (!baseName) {
  console.error('[write-report] 使い方: node write-report.js <baseName> <レポート内容>');
  console.error('  例: node write-report.js test-report "# レポート内容..."');
  process.exit(1);
}

const content     = contentParts.join(' ');
const reportsDir  = path.join(process.cwd(), '.claude', 'reports');

// タイムスタンプ生成（YYYYMMDD-HHmmss）
function generateTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${date}-${time}`;
}

// 衝突しないファイルパスを生成
function resolveOutputPath(baseNameArg, timestamp) {
  const base = path.join(reportsDir, `${baseNameArg}-${timestamp}.md`);
  if (!fs.existsSync(base)) return base;

  let branch = 2;
  while (true) {
    const candidate = path.join(reportsDir, `${baseNameArg}-${timestamp}-${branch}.md`);
    if (!fs.existsSync(candidate)) return candidate;
    branch++;
  }
}

fs.mkdirSync(reportsDir, { recursive: true });

const timestamp    = generateTimestamp();
const outputPath   = resolveOutputPath(baseName, timestamp);

fs.writeFileSync(outputPath, content, 'utf-8');

const relativePath = path.relative(process.cwd(), outputPath).replace(/\\/g, '/');
console.log(`[write-report] ${relativePath}`);
