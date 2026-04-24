#!/usr/bin/env node
/**
 * clear-file-history.js
 * Common logic for deleting all contents of the .claude/file-history/ folder.
 * Called from the custom command /clear-file-history and /init-session.
 */

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const FILE_HISTORY_DIR = path.join(os.homedir(), '.claude', 'file-history');

function clearFileHistory() {
  if (!fs.existsSync(FILE_HISTORY_DIR)) {
    console.log('[clear-file-history] file-history folder does not exist. Skipping.');
    return { deleted: 0 };
  }

  const entries = fs.readdirSync(FILE_HISTORY_DIR, { withFileTypes: true });
  let deleted = 0;

  for (const entry of entries) {
    const fullPath = path.join(FILE_HISTORY_DIR, entry.name);
    try {
      if (entry.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      deleted++;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // already gone — skip silently
      } else {
        console.warn(`[clear-file-history] Failed to delete: ${entry.name} (${err.message})`);
      }
    }
  }

  console.log(`[clear-file-history] Deleted ${deleted} item(s).`);
  return { deleted };
}

// When run directly
if (require.main === module) {
  const result = clearFileHistory();
  process.exit(result.deleted >= 0 ? 0 : 1);
}

module.exports = { clearFileHistory };
