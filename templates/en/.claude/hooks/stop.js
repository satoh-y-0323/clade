#!/usr/bin/env node
// stop.js
// Claude Code hook: Stop
// Creates a session template file

'use strict';
const fs   = require('fs');
const path = require('path');

const cwd         = process.cwd();
const sessionDir  = path.join(cwd, '.claude', 'memory', 'sessions');
const now         = new Date();
const dateStr     = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile = path.join(sessionDir, `${dateStr}.tmp`);

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// Create a template if the session file does not exist yet
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
  process.stderr.write(`[Stop] Session file created: ${sessionFile}\n`);
}

process.stderr.write('[Stop] Session end processing complete\n');
process.stderr.write('[Stop] It is recommended to record details with the /end-session command\n');
