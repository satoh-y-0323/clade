#!/usr/bin/env node
/**
 * record-approval.js
 * Records the user's approval or rejection of a report in approvals.jsonl.
 * Called by tester / code-reviewer / security-reviewer after requesting approval.
 *
 * Usage:
 *   # Recommended (shell injection safe): pass comment via tmp file
 *   node .claude/hooks/clear-tmp-file.js --path .claude/tmp/approval-comment.md
 *   # → Write the comment to .claude/tmp/approval-comment.md with the Write tool, then:
 *   node .claude/hooks/record-approval.js <reportFile> <yes|no> <reportType> --comment-file .claude/tmp/approval-comment.md
 *
 *   # Legacy: pass comment as a positional argument (short, fixed comments only — watch for shell metacharacters)
 *   node .claude/hooks/record-approval.js <reportFile> <yes|no> <reportType> "<comment>"
 *
 * Examples:
 *   node .claude/hooks/record-approval.js test-report-20260401-143022.md yes test --comment-file .claude/tmp/approval-comment.md
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const args = process.argv.slice(2);

// Detect and extract --comment-file <path> option
const commentFileIdx = args.indexOf('--comment-file');
let commentFromFile = null;
let positionalArgs = args;

if (commentFileIdx !== -1) {
  const commentFilePath = args[commentFileIdx + 1];
  if (!commentFilePath) {
    console.error('[record-approval] --comment-file option requires a file path.');
    process.exit(1);
  }
  // --comment-file path guard: only allow paths within the project root
  const resolvedCommentPath = path.resolve(commentFilePath);
  const allowedRoot = path.resolve(process.cwd());
  if (!resolvedCommentPath.startsWith(allowedRoot + path.sep) && resolvedCommentPath !== allowedRoot) {
    console.error('[record-approval] --comment-file must be a path within the repository.');
    process.exit(1);
  }
  try {
    commentFromFile = fs.readFileSync(commentFilePath, 'utf-8').replace(/\r?\n$/, '');
  } catch (err) {
    console.error(`[record-approval] Failed to read comment file: ${err.message}`);
    process.exit(1);
  }
  // Remove the two tokens (--comment-file <path>) from positionalArgs
  positionalArgs = args.filter((_, i) => i !== commentFileIdx && i !== commentFileIdx + 1);
}

const [reportFile, approvedArg, reportType, ...commentParts] = positionalArgs;

if (!reportFile || !approvedArg || !reportType) {
  console.error('[record-approval] Usage:');
  console.error('  Recommended: node record-approval.js <reportFile> <yes|no> <reportType> --comment-file <commentFile>');
  console.error('  Legacy:      node record-approval.js <reportFile> <yes|no> <reportType> "<comment>"');
  process.exit(1);
}

const approved = approvedArg.toLowerCase() === 'yes';
const comment  = commentFromFile !== null ? commentFromFile : (commentParts.join(' ') || '');

// reportType validation: warn on unknown values (execution continues for backward compatibility)
const VALID_REPORT_TYPES = ['requirements', 'architecture', 'plan', 'test', 'code-review', 'security-review'];
if (!VALID_REPORT_TYPES.includes(reportType)) {
  console.warn(`[record-approval] Warning: unknown reportType: ${reportType}`);
}

const reportsDir    = path.join(process.cwd(), '.claude', 'reports');
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
