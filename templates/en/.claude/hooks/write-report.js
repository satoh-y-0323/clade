#!/usr/bin/env node
/**
 * write-report.js
 * Common script for writing timestamped report files in Windows native environments.
 * Called from tester / code-reviewer / security-reviewer.
 *
 * Usage:
 *   # New output (create file)
 *   node .claude/hooks/write-report.js <baseName> new "<content>"
 *
 *   # Append output
 *   node .claude/hooks/write-report.js <baseName> append <targetFileName> "<content>"
 *
 *   # Backward compatible (treated as new if 2nd arg is not new/append)
 *   node .claude/hooks/write-report.js <baseName> "<content>"
 *
 * Output:
 *   Displays the actual written file path to stdout.
 *   Example: [write-report] .claude/reports/test-report-20260401-143022.md
 *
 * How to output a long report in chunks:
 *   1. node write-report.js test-report new "# Test Report\n## First half..."
 *      → [write-report] .claude/reports/test-report-20260401-143022.md
 *   2. node write-report.js test-report append test-report-20260401-143022.md "## Second half..."
 *      → [write-report] .claude/reports/test-report-20260401-143022.md (appended)
 *   3. Repeat 2 until all content is output
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const [, , baseName, modeOrContent, ...rest] = process.argv;

if (!baseName) {
  console.error('[write-report] Usage:');
  console.error('  New:    node write-report.js <baseName> new "<content>"');
  console.error('  Append: node write-report.js <baseName> append <targetFile> "<content>"');
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

  let branch = 2;
  while (true) {
    const candidate = path.join(reportsDir, `${baseNameArg}-${timestamp}-${branch}.md`);
    if (!fs.existsSync(candidate)) return candidate;
    branch++;
  }
}

// Determine mode
const isNew    = modeOrContent === 'new';
const isAppend = modeOrContent === 'append';

if (isNew) {
  // New output mode: node write-report.js <baseName> new "<content>"
  const content    = rest.join(' ');
  const timestamp  = generateTimestamp();
  const outputPath = resolveNewPath(baseName, timestamp);

  fs.writeFileSync(outputPath, content, 'utf-8');

  const relativePath = path.relative(process.cwd(), outputPath).replace(/\\/g, '/');
  console.log(`[write-report] ${relativePath}`);

} else if (isAppend) {
  // Append output mode: node write-report.js <baseName> append <targetFileName> "<content>"
  const [targetFileName, ...contentParts] = rest;

  if (!targetFileName) {
    console.error('[write-report] append mode requires a target file name.');
    console.error('  Example: node write-report.js test-report append test-report-20260401-143022.md "append content"');
    process.exit(1);
  }

  const content    = contentParts.join(' ');
  const targetPath = path.join(reportsDir, targetFileName);

  if (!fs.existsSync(targetPath)) {
    console.error(`[write-report] Target file not found: ${targetFileName}`);
    process.exit(1);
  }

  fs.appendFileSync(targetPath, content, 'utf-8');

  const relativePath = path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
  console.log(`[write-report] ${relativePath} (appended)`);

} else {
  // Backward compatible mode: node write-report.js <baseName> "<content>"
  // If the 2nd argument is not new/append, treat as new output (legacy behavior)
  const content    = [modeOrContent, ...rest].join(' ');
  const timestamp  = generateTimestamp();
  const outputPath = resolveNewPath(baseName, timestamp);

  fs.writeFileSync(outputPath, content, 'utf-8');

  const relativePath = path.relative(process.cwd(), outputPath).replace(/\\/g, '/');
  console.log(`[write-report] ${relativePath}`);
}
