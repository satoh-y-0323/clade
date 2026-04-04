#!/usr/bin/env node
// pre-tool.js
// Claude Code hook: PreToolUse
// Guard dangerous commands + record tool execution start in observations.jsonl

'use strict';
const fs   = require('fs');
const path = require('path');

// Claude Code passes hook input via stdin (JSON)
let hookInput = {};
try {
  const stdinData = fs.readFileSync(0, 'utf8');
  hookInput = JSON.parse(stdinData);
} catch (_) {}

const tool    = hookInput.tool_name || 'unknown';
const input   = JSON.stringify(hookInput.tool_input || {});
const ts      = new Date().toISOString();
const session = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const obsDir  = path.join(process.cwd(), '.claude', 'instincts', 'raw');
const obsFile = path.join(obsDir, 'observations.jsonl');

// ===== Dangerous Command Guard =====
if (tool === 'Bash') {
  let cmd = '';
  try { cmd = JSON.parse(input).command || ''; } catch {}

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
}

// ===== Record Observation Data (Start) =====
try {
  if (!fs.existsSync(obsDir)) fs.mkdirSync(obsDir, { recursive: true });
  const inputSummary = input.slice(0, 300).replace(/\n/g, ' ');
  const record = { ts, session, event: 'pre', tool, input: inputSummary };
  fs.appendFileSync(obsFile, JSON.stringify(record) + '\n', 'utf8');
} catch (e) {
  process.stderr.write('pre-tool record error: ' + e.message + '\n');
}
