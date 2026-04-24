#!/usr/bin/env node
// post-tool.js
// Claude Code hook: PostToolUse
// Record Bash command execution results to bash-log.jsonl

'use strict';
const fs   = require('fs');
const path = require('path');
const { readHookInput } = require('./hook-utils');

const hookInput = readHookInput();

// Only record Bash
if ((hookInput.tool_name || '') !== 'Bash') process.exit(0);

const input        = hookInput.tool_input || {};
const toolResponse = hookInput.tool_response || {};
const now          = new Date();
const ts           = now.toISOString();
// Derive session from ts to avoid drift if the ts calculation is ever changed
const session      = ts.slice(0, 10).replace(/-/g, '');

const cmd = (input.command || '').slice(0, 300);

// Determine is_error
const isError = toolResponse.is_error === true ||
               (typeof toolResponse.error === 'string' && toolResponse.error.length > 0);

// Extract output text (up to 800 chars, collapse newlines to ↵ so it fits on one line)
const responseStr = typeof toolResponse === 'string'
  ? toolResponse
  : (toolResponse.output || JSON.stringify(toolResponse));
const outPreview = responseStr.slice(0, 800).replace(/\r?\n/g, '↵');

// bash-log.jsonl records the first 300 chars of each Bash command in plain text.
// If a command contains API keys, tokens, etc., they will appear in the log.
// Keep .claude/instincts/raw/ in .gitignore so it is never tracked by git (already configured).
const logDir  = path.join(process.cwd(), '.claude', 'instincts', 'raw');
const logFile = path.join(logDir, 'bash-log.jsonl');

try {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const record = { ts, session, cmd, out: outPreview, err: isError };
  fs.appendFileSync(logFile, JSON.stringify(record) + '\n', 'utf8');
} catch (e) {
  process.stderr.write('post-tool record error: ' + e.message + '\n');
}
