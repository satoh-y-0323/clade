#!/usr/bin/env node
// pre-tool.js
// Claude Code hook: PreToolUse
// Guard dangerous commands

'use strict';
const fs = require('fs');

let hookInput = {};
try {
  const stdinData = fs.readFileSync(0, 'utf8');
  hookInput = JSON.parse(stdinData);
} catch (_) {}

const tool = hookInput.tool_name || '';

// Only Bash commands need guarding
if (tool !== 'Bash') process.exit(0);

let cmd = '';
try { cmd = (hookInput.tool_input || {}).command || ''; } catch {}

// git force push: warning (do not block)
if (/git\s+push\s+(--force|-f)\b/.test(cmd)) {
  process.stderr.write('[PreToolUse WARNING] git force push detected. Please confirm with the user before executing.\n');
}

// rm -rf / or ~: block
if (/rm\s+-rf\s+[/~]/.test(cmd)) {
  process.stderr.write(`[PreToolUse BLOCK] Dangerous command blocked: ${cmd}\n`);
  process.exit(2);
}

// Destructive DB operations: warning (do not block)
if (/DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE/i.test(cmd)) {
  process.stderr.write('[PreToolUse WARNING] Destructive DB operation detected. Please confirm this is not a production environment.\n');
}
