#!/usr/bin/env node
// post-tool.js
// Claude Code hook: PostToolUse
// ツール実行結果（成功/失敗・終了コード・出力概要）を observations.jsonl に記録

'use strict';
const fs   = require('fs');
const path = require('path');

// Claude Code はフック入力を stdin (JSON) で渡す
let hookInput = {};
try {
  const stdinData = fs.readFileSync(0, 'utf8');
  hookInput = JSON.parse(stdinData);
} catch (_) {}

const tool         = hookInput.tool_name || 'unknown';
const input        = JSON.stringify(hookInput.tool_input || {});
const toolResponse = hookInput.tool_response || {};
// tool_response は文字列の場合もオブジェクトの場合もある
const responseStr  = typeof toolResponse === 'string'
  ? toolResponse
  : JSON.stringify(toolResponse);
const ts       = new Date().toISOString();
const session  = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const obsDir  = path.join(process.cwd(), '.claude', 'instincts', 'raw');
const obsFile = path.join(obsDir, 'observations.jsonl');

// is_error フラグまたは error フィールドで失敗を判定
const isError  = toolResponse.is_error === true ||
                 (typeof toolResponse.error === 'string' && toolResponse.error.length > 0);
const output   = responseStr;
const status   = isError ? 'failure' : 'success';
// テキスト出力がある場合のみキーワード検査（JSON キー名の誤検知を避ける）
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
