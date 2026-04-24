#!/usr/bin/env node
/**
 * write-report.js
 * Common script for writing timestamped report files on Windows native environments.
 * Called from tester / code-reviewer / security-reviewer.
 *
 * [Recommended] --file option: save to a temp file with the Write tool, then pass it (zero special-character issues)
 *
 *   # New output (--file recommended)
 *   node .claude/hooks/write-report.js <baseName> new --file /tmp/report.md
 *
 *   # Append output (--file recommended)
 *   node .claude/hooks/write-report.js <baseName> append <targetFileName> --file /tmp/report.md
 *
 * Heredoc (stdin) also works when --file is not available:
 *
 *   node .claude/hooks/write-report.js <baseName> new <<'CLADE_REPORT_EOF'
 *   {full report content}
 *   CLADE_REPORT_EOF
 *
 *   node .claude/hooks/write-report.js <baseName> append <targetFileName> <<'CLADE_REPORT_EOF'
 *   {content to append}
 *   CLADE_REPORT_EOF
 *
 * Output:
 *   Prints the actual file path written to stdout.
 *   Example: [write-report] .claude/reports/test-report-20260401-143022.md
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const { resolveContent, writeToFile, appendToFile } = require('./write-file');

const [, , baseName, modeOrContent, ...rest] = process.argv;

if (!baseName || (modeOrContent !== 'new' && modeOrContent !== 'append')) {
  console.error('[write-report] Usage:');
  console.error('  new (--file):    node write-report.js <baseName> new --file <path>');
  console.error('  append (--file): node write-report.js <baseName> append <targetFile> --file <path>');
  console.error('  new (stdin):     node write-report.js <baseName> new <<\'CLADE_REPORT_EOF\'');
  console.error('  append (stdin):  node write-report.js <baseName> append <targetFile> <<\'CLADE_REPORT_EOF\'');
  process.exit(1);
}

// baseName validation: only alphanumeric, hyphens, and underscores allowed
if (!/^[a-zA-Z0-9_\-]+$/.test(baseName)) {
  console.error('[write-report] baseName contains invalid characters (only alphanumeric, hyphens, and underscores are allowed).');
  process.exit(1);
}

const reportsDir = path.join(process.cwd(), '.claude', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

// Generate timestamp (YYYYMMDD-HHmmss)
function generateTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${date}-${time}`;
}

// Generate a non-conflicting file path
function resolveNewPath(baseNameArg, timestamp) {
  const base = path.join(reportsDir, `${baseNameArg}-${timestamp}.md`);
  if (!fs.existsSync(base)) return base;

  const MAX_ATTEMPTS = 100;
  for (let branch = 2; branch <= MAX_ATTEMPTS + 1; branch++) {
    const candidate = path.join(reportsDir, `${baseNameArg}-${timestamp}-${branch}.md`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`[write-report] Failed to resolve filename conflict: ${baseNameArg}-${timestamp}`);
}

// Mode determination
const isNew    = modeOrContent === 'new';
const isAppend = modeOrContent === 'append';

if (isNew) {
  // New output mode
  const content   = resolveContent(rest);
  const timestamp = generateTimestamp();
  let outputPath;
  try {
    outputPath = resolveNewPath(baseName, timestamp);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  writeToFile(outputPath, content);

  const relativePath = path.relative(process.cwd(), outputPath).replace(/\\/g, '/');
  console.log(`[write-report] ${relativePath}`);

} else if (isAppend) {
  // Append output mode: first arg is the target filename, rest is --file or inline content
  const targetFileName = rest[0];

  if (!targetFileName || targetFileName === '--file') {
    console.error('[write-report] append mode requires a target filename.');
    console.error('  Example: node write-report.js test-report append test-report-20260401-143022.md --file /tmp/report.md');
    process.exit(1);
  }

  // targetFileName path traversal guard: reject path separators and ..
  if (targetFileName.includes('/') || targetFileName.includes('\\') || targetFileName.includes('..')) {
    console.error('[write-report] targetFileName must not contain path separators or "..".');
    process.exit(1);
  }

  const content    = resolveContent(rest.slice(1));
  const targetPath = path.join(reportsDir, targetFileName);

  if (!fs.existsSync(targetPath)) {
    console.error(`[write-report] Target file not found: ${targetFileName}`);
    process.exit(1);
  }

  appendToFile(targetPath, content);

  const relativePath = path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
  console.log(`[write-report] ${relativePath} (appended)`);

}
