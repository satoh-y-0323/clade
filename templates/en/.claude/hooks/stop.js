#!/usr/bin/env node
// stop.js
// Claude Code hook: Stop
// Creates the session file template.

'use strict';
const fs   = require('fs');
const path = require('path');
const { createSessionTemplate, buildFactsSection, upsertFactsSection, getProjectRoot } = require('./hook-utils');

const cwd         = getProjectRoot();
const sessionDir  = path.join(cwd, '.claude', 'memory', 'sessions');
const now         = new Date();
const dateStr     = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile = path.join(sessionDir, `${dateStr}.tmp`);

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// Create session file template if it does not exist yet
if (!fs.existsSync(sessionFile)) {
  fs.writeFileSync(sessionFile, createSessionTemplate(dateStr), 'utf8');
  process.stderr.write(`[Stop] Session file created: ${sessionFile}\n`);
}

process.stderr.write('[Stop] Stop hook completed.\n');
process.stderr.write('[Stop] Run /end-session to record session details.\n');

// Record mechanical facts to session tmp
try {
  const bashLogFile = path.join(cwd, '.claude', 'instincts', 'raw', 'bash-log.jsonl');

  let bashCount    = 0;
  let errCount     = 0;
  let recentErrors = [];

  if (fs.existsSync(bashLogFile)) {
    const lines = fs.readFileSync(bashLogFile, 'utf8')
      .split('\n')
      .filter(line => line.trim() !== '');

    bashCount = lines.length;

    const errorLines = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.err === true) {
          errCount++;
          errorLines.push(entry);
        }
      } catch (_) {
        // Skip lines that fail to parse
      }
    }

    // Get up to 5 most recent error commands
    recentErrors = errorLines
      .slice(-5)
      .map(entry => entry.cmd || '(unknown)');
  }

  // Convert recorded time to local YYYY-MM-DD HH:mm:ss format
  const pad = n => String(n).padStart(2, '0');
  const recordedAt = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join('-') + ' ' + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join(':');

  const factsObj = { recordedAt, bashCount, errCount, recentErrors };
  const factsSection = buildFactsSection(factsObj);

  const currentContent = fs.readFileSync(sessionFile, 'utf8');
  const updatedContent = upsertFactsSection(currentContent, factsSection);
  fs.writeFileSync(sessionFile, updatedContent, 'utf8');

  process.stderr.write(`[Stop] Facts log recorded (Bash commands: ${bashCount}, Errors: ${errCount})\n`);
} catch (err) {
  process.stderr.write(`[Stop] Error recording facts log: ${err.message}\n`);
  process.exit(0);
}
