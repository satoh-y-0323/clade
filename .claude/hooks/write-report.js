#!/usr/bin/env node
/**
 * write-report.js
 * レポートファイルを Windows ネイティブ環境で書き出す共通スクリプト。
 * tester / code-reviewer / security-reviewer から呼び出される。
 *
 * 使い方:
 *   node .claude/hooks/write-report.js <出力ファイルパス> <レポート内容>
 *
 * 例:
 *   node .claude/hooks/write-report.js .claude/reports/test-report.md "# レポート内容..."
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const [, , outputPath, ...contentParts] = process.argv;

if (!outputPath) {
  console.error('[write-report] 使い方: node write-report.js <出力ファイルパス> <レポート内容>');
  process.exit(1);
}

const content = contentParts.join(' ');
const resolvedPath = path.resolve(process.cwd(), outputPath);
const dir = path.dirname(resolvedPath);

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(resolvedPath, content, 'utf-8');

console.log(`[write-report] レポートを出力しました: ${resolvedPath}`);
