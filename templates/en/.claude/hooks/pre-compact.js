#!/usr/bin/env node
// pre-compact.js
// Claude Code hook: PreCompact
// Records a checkpoint to the session file before context compaction.

'use strict';
const fs   = require('fs');
const path = require('path');
const { createSessionTemplate, getProjectRoot } = require('./hook-utils');

const cwd         = getProjectRoot();
const sessionDir  = path.join(cwd, '.claude', 'memory', 'sessions');
const now         = new Date();
const dateStr     = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile = path.join(sessionDir, `${dateStr}.tmp`);
const ts          = now.toISOString();

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// Create session file template if it does not exist
if (!fs.existsSync(sessionFile)) {
  fs.writeFileSync(sessionFile, createSessionTemplate(dateStr), 'utf8');
}

// Append PreCompact checkpoint
const checkpoint = [
  '',
  `## [PreCompact checkpoint: ${ts}]`,
  'Context window compaction occurred.',
  'Detailed context before this point has been lost.',
].join('\n');

fs.appendFileSync(sessionFile, checkpoint + '\n', 'utf8');
process.stderr.write(`[PreCompact] Session state saved to ${sessionFile}\n`);
