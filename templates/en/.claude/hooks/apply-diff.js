#!/usr/bin/env node
/**
 * apply-diff.js
 * Apply a staged .new file to its target file (for interactive update entries
 * such as settings.json / settings.local.json), then delete the .new file.
 *
 * Example:
 *   node .claude/hooks/apply-diff.js --target .claude/settings.json \
 *                                    --new    .claude/settings.json.new
 *
 * Behavior:
 *   1. If --new does not exist, exit with error.
 *   2. Overwrite --target with the contents of --new (create if missing).
 *   3. Delete --new.
 *   4. Print a short result line on stdout.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function usageAndExit() {
  console.error('Usage: node apply-diff.js --target <targetPath> --new <newPath>');
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  const targetIdx = args.indexOf('--target');
  const newIdx = args.indexOf('--new');

  if (targetIdx === -1 || newIdx === -1 ||
      !args[targetIdx + 1] || args[targetIdx + 1].startsWith('--') ||
      !args[newIdx + 1]    || args[newIdx + 1].startsWith('--')) {
    usageAndExit();
  }

  const targetPath = args[targetIdx + 1];
  const newPath = args[newIdx + 1];

  // Path traversal guard: only allow paths within the project root
  const allowedRoot = path.resolve(process.cwd());

  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(allowedRoot + path.sep) && resolvedTarget !== allowedRoot) {
    console.error('[apply-diff] Path outside repository is not allowed (--target).');
    process.exit(1);
  }

  const resolvedNew = path.resolve(newPath);
  if (!resolvedNew.startsWith(allowedRoot + path.sep) && resolvedNew !== allowedRoot) {
    console.error('[apply-diff] Path outside repository is not allowed (--new).');
    process.exit(1);
  }

  if (!fs.existsSync(newPath)) {
    console.error(`[apply-diff] .new file not found: ${newPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(newPath, 'utf8');
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');

  try {
    fs.unlinkSync(newPath);
  } catch (error) {
    console.error(`[apply-diff] Failed to delete .new file: ${newPath} (${error.message})`);
    process.exit(1);
  }

  const relative = path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
  console.log(`[apply-diff] Applied: ${relative}`);
}

main();
