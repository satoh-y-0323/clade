#!/usr/bin/env node
// stop.js
// Claude Code hook: Stop
// Creates session template, aggregates observation data, and asynchronously launches pattern extraction

'use strict';
const fs            = require('fs');
const path          = require('path');
const { spawn }     = require('child_process');

const cwd           = process.cwd();
const sessionDir    = path.join(cwd, '.claude', 'memory', 'sessions');
const now           = new Date();
const dateStr       = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile   = path.join(sessionDir, `${dateStr}.tmp`);
const obsFile       = path.join(cwd, '.claude', 'instincts', 'raw', 'observations.jsonl');
const extractScript = path.join(cwd, '.claude', 'hooks', 'extract-patterns.js');

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

// Aggregate today's observation data count and append
if (fs.existsSync(obsFile)) {
  const today = now.toISOString().slice(0, 10);
  const lines = fs.readFileSync(obsFile, 'utf8').split('\n').filter(Boolean);
  const toolCount = lines.filter(l => l.includes(`"${today}`)).length;
  const note = [
    '',
    `## [Stop hook: ${now.toISOString().replace('T', ' ').slice(0, 19)}]`,
    `Today's observation data: ${toolCount} records`,
  ].join('\n');
  fs.appendFileSync(sessionFile, note + '\n', 'utf8');
}

// Asynchronously run extract-patterns.js
if (fs.existsSync(extractScript)) {
  const child = spawn(process.execPath, [extractScript], {
    detached: true,
    stdio:    'ignore',
    cwd:      cwd,
  });
  child.unref();
  process.stderr.write('[Stop] Pattern extraction script launched\n');
}

process.stderr.write('[Stop] Session end processing complete\n');
process.stderr.write('[Stop] It is recommended to record details with the /end-session command\n');
