#!/usr/bin/env node
// post-tool.js
// Claude Code hook: PostToolUse
// ツール実行結果（成功/失敗・終了コード・出力概要）を observations.jsonl に記録

'use strict';
const fs   = require('fs');
const path = require('path');

const tool     = process.env.CLAUDE_TOOL_NAME     || 'unknown';
const input    = process.env.CLAUDE_TOOL_INPUT    || '{}';
const output   = process.env.CLAUDE_TOOL_OUTPUT   || '{}';
const exitCode = parseInt(process.env.CLAUDE_TOOL_EXIT_CODE || '0', 10);
const ts       = new Date().toISOString();
const session  = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const obsDir  = path.join(process.cwd(), '.claude', 'instincts', 'raw');
const obsFile = path.join(obsDir, 'observations.jsonl');

const status   = exitCode !== 0 ? 'failure' : 'success';
const hasError = /error|exception|traceback|failed|not found/i.test(output);

try {
  if (!fs.existsSync(obsDir)) fs.mkdirSync(obsDir, { recursive: true });
  const inputSummary  = input.slice(0, 300).replace(/\n/g, ' ');
  const outputSummary = output.slice(0, 300).replace(/\n/g, ' ');
  const record = {
    ts, session, event: 'post', tool, status,
    exit_code: exitCode, has_error: hasError,
    input: inputSummary, output: outputSummary,
  };
  fs.appendFileSync(obsFile, JSON.stringify(record) + '\n', 'utf8');
} catch (e) {
  process.stderr.write('post-tool record error: ' + e.message + '\n');
}
