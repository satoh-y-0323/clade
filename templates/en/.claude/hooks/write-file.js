#!/usr/bin/env node
/**
 * write-file.js
 * Common script for writing files to arbitrary paths.
 * Called via Bash by subagents (e.g., doc-writer) that cannot use the Write tool.
 * write-report.js also delegates its write operations to this module.
 *
 * CLI usage:
 *
 *   # New file (stdin)
 *   node .claude/hooks/write-file.js --path <targetPath> <<'CLADE_DOC_EOF'
 *   {content}
 *   CLADE_DOC_EOF
 *
 *   # New file (--file)
 *   node .claude/hooks/write-file.js --path <targetPath> --file <contentFile>
 *
 *   # Append (stdin)
 *   node .claude/hooks/write-file.js --path <targetPath> --append <<'CLADE_DOC_EOF'
 *   {content}
 *   CLADE_DOC_EOF
 *
 * Output:
 *   Prints the actual file path written to stdout.
 *   Example: [write-file] .claude/reports/doc-README-add.md
 */

'use strict';
const fs   = require('fs');
const path = require('path');

/**
 * Read content from stdin
 * @returns {string}
 */
function readStdin() {
  return fs.readFileSync(0, 'utf-8');
}

/**
 * Resolve content (priority: --file > stdin)
 * @param {string[]} args - parsed arguments from argv
 * @returns {string}
 */
function resolveContent(args) {
  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1) {
    const filePath = args[fileIdx + 1];
    if (!filePath) {
      console.error('[write-file] --file option requires a file path.');
      process.exit(1);
    }
    // Path traversal protection: restrict --file to files within the project root
    const resolvedFilePath = path.resolve(filePath);
    const allowedRoot = path.resolve(process.cwd());
    if (!resolvedFilePath.startsWith(allowedRoot + path.sep) && resolvedFilePath !== allowedRoot) {
      console.error('[write-file] --file must point to a path inside the repository.');
      process.exit(1);
    }
    return fs.readFileSync(resolvedFilePath, 'utf-8');
  }
  return readStdin();
}

/**
 * Write content to a file (auto-creates parent directories)
 * @param {string} filePath - absolute or relative path to write to
 * @param {string} content  - content to write
 */
function writeToFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Append content to a file (auto-creates parent directories)
 * @param {string} filePath - absolute or relative path to append to
 * @param {string} content  - content to append
 */
function appendToFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, content, 'utf-8');
}

module.exports = { resolveContent, writeToFile, appendToFile };

// When executed directly as CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  const pathIdx = args.indexOf('--path');
  const rawTargetPath = args[pathIdx + 1];
  if (pathIdx === -1 || !rawTargetPath || rawTargetPath.startsWith('--')) {
    console.error('[write-file] Usage:');
    console.error('  new:    node write-file.js --path <targetPath> [--file <contentFile>]');
    console.error('  append: node write-file.js --path <targetPath> --append [--file <contentFile>]');
    process.exit(1);
  }

  // Path traversal protection: restrict write destination to within the project root
  const targetPath = path.resolve(rawTargetPath);
  const allowedRoot = path.resolve(process.cwd());
  if (!targetPath.startsWith(allowedRoot + path.sep) && targetPath !== allowedRoot) {
    console.error('[write-file] Paths outside the repository are not allowed.');
    process.exit(1);
  }
  const isAppend   = args.includes('--append');
  const content    = resolveContent(args);

  if (isAppend) {
    appendToFile(targetPath, content);
  } else {
    writeToFile(targetPath, content);
  }

  const relativePath = path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
  console.log(`[write-file] ${relativePath}${isAppend ? ' (appended)' : ''}`);
}
