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

// If cmd is not a string, skip (safe fallback)
if (typeof cmd !== 'string') process.exit(0);

// git force push: warn (do not block)
// --force-with-lease is also a form of force-overwrite, so include it in the warning
if (/git\s+push\s+(--force|--force-with-lease|-f)\b/.test(cmd)) {
  process.stderr.write('[PreToolUse WARNING] Detected a git force push. Please confirm with the user before running it.\n');
}

// rm -rf variants (dangerous target): block
// Short flag form: r and f both appear in flag tokens (-xxx), or as separate -r / -f tokens
// Long option form: both --recursive and --force are present
if (/\brm\b/.test(cmd)) {
  const shortFlags = (cmd.match(/-[a-zA-Z]+/g) || []).join('');
  const hasR = shortFlags.includes('r') || /\brm\b.*\s-[a-zA-Z]*r[a-zA-Z]*/.test(cmd);
  const hasF = shortFlags.includes('f') || /\brm\b.*\s-[a-zA-Z]*f[a-zA-Z]*/.test(cmd);
  const hasLongRecursive = /--recursive/.test(cmd);
  const hasLongForce = /--force/.test(cmd);
  if ((hasR && hasF) || (hasLongRecursive && hasLongForce)) {
    process.stderr.write(`[PreToolUse BLOCK] Blocked a dangerous command: ${cmd}\n`);
    process.exit(2);
  }
}

// Destructive DB operations in production: warn (do not block)
if (/DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE/i.test(cmd)) {
  process.stderr.write('[PreToolUse WARNING] Detected a destructive DB operation. Please confirm this is not running against production.\n');
}
