#!/usr/bin/env node
/**
 * clear-tmp-file.js
 * Utility script that removes a specified file under .claude/tmp/.
 *
 * In the report output flow (Step 1: Write → Step 2: write-report.js --file),
 * calling this script before Step 1 deletes any leftover tmp file and prevents
 * Claude Code from asking for the "overwrite existing file" confirmation prompt.
 *
 * CLI usage:
 *
 *   node .claude/hooks/clear-tmp-file.js --path .claude/tmp/requirements-report.md
 *
 * Security guards:
 *   - --path must point under .claude/tmp/ only
 *   - Absolute paths and parent-directory traversal (..) are rejected
 *   - Anything else exits with code 1
 *
 * Output:
 *   When the file exists: [clear-tmp-file] .claude/tmp/<file> (removed)
 *   When it does not:     [clear-tmp-file] .claude/tmp/<file> (not exist)
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const TMP_PREFIX = '.claude/tmp/';

const args = process.argv.slice(2);
const pathIdx = args.indexOf('--path');

if (pathIdx === -1 || !args[pathIdx + 1]) {
  console.error('[clear-tmp-file] Usage:');
  console.error('  node clear-tmp-file.js --path .claude/tmp/<filename>');
  process.exit(1);
}

const rawPath = args[pathIdx + 1];

// Normalize path separators (convert Windows backslashes to forward slashes)
const normalizedPath = rawPath.replace(/\\/g, '/');

// Security guard: allow only files under .claude/tmp/
if (!normalizedPath.startsWith(TMP_PREFIX)) {
  console.error(`[clear-tmp-file] Error: only files under .claude/tmp/ can be removed (given: ${rawPath})`);
  process.exit(1);
}

// Security guard: reject parent-directory traversal
if (normalizedPath.includes('..')) {
  console.error(`[clear-tmp-file] Error: the path must not contain .. (given: ${rawPath})`);
  process.exit(1);
}

// Security guard: reject absolute paths (both Windows C:/... and Unix /...)
if (path.isAbsolute(normalizedPath) || /^[A-Za-z]:[\\/]/.test(normalizedPath)) {
  console.error(`[clear-tmp-file] Error: absolute paths are not allowed (given: ${rawPath})`);
  process.exit(1);
}

const targetPath = path.resolve(process.cwd(), normalizedPath);
const relativePath = path.relative(process.cwd(), targetPath).replace(/\\/g, '/');

if (fs.existsSync(targetPath)) {
  fs.unlinkSync(targetPath);
  console.log(`[clear-tmp-file] ${relativePath} (removed)`);
} else {
  console.log(`[clear-tmp-file] ${relativePath} (not exist)`);
}
