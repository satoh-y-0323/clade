#!/usr/bin/env node
// post-tool.js
// Claude Code hook: PostToolUse
// Records tool execution results (success/failure, exit code, output summary) in observations.jsonl

'use strict';
const fs   = require('fs');
const path = require('path');

// Claude Code passes hook input via stdin (JSON)
let hookInput = {};
try {
  const stdinData = fs.readFileSync(0, 'utf8');
  hookInput = JSON.parse(stdinData);
} catch (_) {}

const tool         = hookInput.tool_name || 'unknown';
const input        = JSON.stringify(hookInput.tool_input || {});
const toolResponse = hookInput.tool_response || {};
// tool_response can be a string or an object
const responseStr  = typeof toolResponse === 'string'
  ? toolResponse
  : JSON.stringify(toolResponse);
const ts       = new Date().toISOString();
const session  = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const obsDir  = path.join(process.cwd(), '.claude', 'instincts', 'raw');
const obsFile = path.join(obsDir, 'observations.jsonl');

// Determine failure by is_error flag or error field
const isError  = toolResponse.is_error === true ||
                 (typeof toolResponse.error === 'string' && toolResponse.error.length > 0);
const output   = responseStr;
const status   = isError ? 'failure' : 'success';
// Only inspect keywords when text output is present (to avoid false positives from JSON key names)
const outputText = typeof toolResponse === 'string' ? toolResponse : (toolResponse.output || '');
const hasError = isError || /exception|traceback/i.test(outputText);

try {
  if (!fs.existsSync(obsDir)) fs.mkdirSync(obsDir, { recursive: true });
  const inputSummary  = input.slice(0, 300).replace(/\n/g, ' ');
  const outputSummary = output.slice(0, 300).replace(/\n/g, ' ');
  const record = {
    ts, session, event: 'post', tool, status,
    has_error: hasError,
    input: inputSummary, output: outputSummary,
  };
  fs.appendFileSync(obsFile, JSON.stringify(record) + '\n', 'utf8');
} catch (e) {
  process.stderr.write('post-tool record error: ' + e.message + '\n');
}
