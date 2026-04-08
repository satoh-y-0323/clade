#!/usr/bin/env node
// post-tool.js
// Claude Code hook: PostToolUse
// Records Bash command results to bash-log.jsonl

'use strict';
const fs   = require('fs');
const path = require('path');

let hookInput = {};
try {
  const stdinData = fs.readFileSync(0, 'utf8');
  hookInput = JSON.parse(stdinData);
} catch (_) {}

// Only record Bash tool calls
if ((hookInput.tool_name || '') !== 'Bash') process.exit(0);

const input        = hookInput.tool_input || {};
const toolResponse = hookInput.tool_response || {};
const ts           = new Date().toISOString();
const session      = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const cmd = (input.command || '').slice(0, 300);

// Determine if this is an error
const isError = toolResponse.is_error === true ||
               (typeof toolResponse.error === 'string' && toolResponse.error.length > 0);

// Get output text (max 800 chars, newlines replaced with ↵ for single-line storage)
const responseStr = typeof toolResponse === 'string'
  ? toolResponse
  : (toolResponse.output || JSON.stringify(toolResponse));
const outPreview = responseStr.slice(0, 800).replace(/\r?\n/g, '↵');

const logDir  = path.join(process.cwd(), '.claude', 'instincts', 'raw');
const logFile = path.join(logDir, 'bash-log.jsonl');

try {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const record = { ts, session, cmd, out: outPreview, err: isError };
  fs.appendFileSync(logFile, JSON.stringify(record) + '\n', 'utf8');
} catch (e) {
  process.stderr.write('post-tool record error: ' + e.message + '\n');
}
