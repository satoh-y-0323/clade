#!/usr/bin/env node
/**
 * record-approval.js
 * Records the user's approval or rejection of a report in approvals.jsonl.
 * Called by tester / code-reviewer / security-reviewer after requesting approval.
 *
 * Usage:
 *   node .claude/hooks/record-approval.js <reportFile> <yes|no> <reportType> "<comment>"
 *
 * Examples:
 *   node .claude/hooks/record-approval.js test-report-20260401-143022.md yes test "All tests passed. Approved."
 *   node .claude/hooks/record-approval.js test-report-20260401-143022.md no test "Boundary value tests are insufficient."
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const [, , reportFile, approvedArg, reportType, ...commentParts] = process.argv;

if (!reportFile || !approvedArg || !reportType) {
  console.error('[record-approval] Usage: node record-approval.js <reportFile> <yes|no> <reportType> "<comment>"');
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

const status = approved ? 'Approved' : 'Rejected';
console.log(`[record-approval] ${status}: ${reportFile}`);
