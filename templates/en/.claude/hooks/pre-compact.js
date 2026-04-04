#!/usr/bin/env node
// pre-compact.js
// Claude Code hook: PreCompact
// Records a checkpoint in the session file before context compaction

'use strict';
const fs   = require('fs');
const path = require('path');

const cwd         = process.cwd();
const sessionDir  = path.join(cwd, '.claude', 'memory', 'sessions');
const now         = new Date();
const dateStr     = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile = path.join(sessionDir, `${dateStr}.tmp`);
const ts          = now.toISOString();

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// Create a template if the session file does not exist
if (!fs.existsSync(sessionFile)) {
  const template = [
    `SESSION: ${dateStr}`,
    'AGENT: (not set)',
    '',
    '## Approaches That Worked (with evidence)',
    '(Please fill in with the /end-session command)',
    '',
    '## Approaches That Were Tried but Failed',
    '(Not filled in)',
    '',
    '## Approaches Not Yet Tried',
    '(Not filled in)',
    '',
    '## Remaining Tasks',
    '(Not filled in)',
  ].join('\n');
  fs.writeFileSync(sessionFile, template, 'utf8');
}

// Append the PreCompact checkpoint
const checkpoint = [
  '',
  `## [PreCompact checkpoint: ${ts}]`,
  'Context window compaction occurred.',
  'Detailed context before this point has been lost.',
].join('\n');

fs.appendFileSync(sessionFile, checkpoint + '\n', 'utf8');
process.stderr.write(`[PreCompact] Session state saved to ${sessionFile}\n`);
