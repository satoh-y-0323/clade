#!/usr/bin/env node
/**
 * record-approval.js
 * レポートに対するユーザーの承認/否認を approvals.jsonl に記録する。
 * tester / code-reviewer / security-reviewer が承認確認後に呼び出す。
 *
 * 使い方:
 *   node .claude/hooks/record-approval.js <reportFile> <yes|no> <reportType> "<コメント>"
 *
 * 例:
 *   node .claude/hooks/record-approval.js test-report-20260401-143022.md yes test "全テスト合格。承認します。"
 *   node .claude/hooks/record-approval.js test-report-20260401-143022.md no test "境界値テストが不足している。"
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const [, , reportFile, approvedArg, reportType, ...commentParts] = process.argv;

if (!reportFile || !approvedArg || !reportType) {
  console.error('[record-approval] 使い方: node record-approval.js <reportFile> <yes|no> <reportType> "<コメント>"');
  process.exit(1);
}

const approved    = approvedArg.toLowerCase() === 'yes';
const comment     = commentParts.join(' ') || '';
const reportsDir  = path.join(process.cwd(), '.claude', 'reports');
const approvalsFile = path.join(reportsDir, 'approvals.jsonl');

const record = {
  timestamp:   new Date().toISOString(),
  reportFile,
  type:        reportType,
  approved,
  comment,
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.appendFileSync(approvalsFile, JSON.stringify(record) + '\n', 'utf-8');

const status = approved ? '✓ 承認' : '✗ 否認';
console.log(`[record-approval] ${status}: ${reportFile}`);
