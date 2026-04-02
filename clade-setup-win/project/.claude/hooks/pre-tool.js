#!/usr/bin/env node
// pre-tool.js
// Claude Code hook: PreToolUse
// 危険コマンドのガード + ツール実行開始を observations.jsonl に記録

'use strict';
const fs   = require('fs');
const path = require('path');

const tool    = process.env.CLAUDE_TOOL_NAME  || 'unknown';
const input   = process.env.CLAUDE_TOOL_INPUT || '{}';
const ts      = new Date().toISOString();
const session = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const obsDir  = path.join(process.cwd(), '.claude', 'instincts', 'raw');
const obsFile = path.join(obsDir, 'observations.jsonl');

// ===== 危険コマンドのガード =====
if (tool === 'Bash') {
  let cmd = '';
  try { cmd = JSON.parse(input).command || ''; } catch {}

  // git force push: 警告（ブロックしない）
  if (/git\s+push\s+(--force|-f)\b/.test(cmd)) {
    process.stderr.write('[PreToolUse WARNING] git force push を検出しました。実行前にユーザーに確認を取ってください。\n');
  }

  // rm -rf / または ~: ブロック
  if (/rm\s+-rf\s+[/~]/.test(cmd)) {
    process.stderr.write(`[PreToolUse BLOCK] 危険なコマンドをブロックしました: ${cmd}\n`);
    process.exit(2);
  }

  // 本番DB破壊操作: 警告（ブロックしない）
  if (/DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE/i.test(cmd)) {
    process.stderr.write('[PreToolUse WARNING] 破壊的なDB操作を検出しました。本番環境での実行でないことを確認してください。\n');
  }
}

// ===== 観察データの記録（開始）=====
try {
  if (!fs.existsSync(obsDir)) fs.mkdirSync(obsDir, { recursive: true });
  const inputSummary = input.slice(0, 300).replace(/\n/g, ' ');
  const record = { ts, session, event: 'pre', tool, input: inputSummary };
  fs.appendFileSync(obsFile, JSON.stringify(record) + '\n', 'utf8');
} catch (e) {
  process.stderr.write('pre-tool record error: ' + e.message + '\n');
}
