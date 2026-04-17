#!/usr/bin/env node
// pre-tool.js
// Claude Code hook: PreToolUse
// Guard against dangerous commands

'use strict';
const { readHookInput } = require('./hook-utils');

const hookInput = readHookInput();
const tool = hookInput.tool_name || '';

// Only guard Bash
if (tool !== 'Bash') process.exit(0);

const cmd = (hookInput.tool_input || {}).command || '';

// git force push: warn (do not block)
if (/git\s+push\s+(--force|-f)\b/.test(cmd)) {
  process.stderr.write('[PreToolUse WARNING] Detected a git force push. Please confirm with the user before running it.\n');
}

// rm -rf / or ~: block
if (/rm\s+-rf\s+[/~]/.test(cmd)) {
  process.stderr.write(`[PreToolUse BLOCK] Blocked a dangerous command: ${cmd}\n`);
  process.exit(2);
}

// Destructive DB operations in production: warn (do not block)
if (/DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE/i.test(cmd)) {
  process.stderr.write('[PreToolUse WARNING] Detected a destructive DB operation. Please confirm this is not running against production.\n');
}
