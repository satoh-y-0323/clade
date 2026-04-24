#!/usr/bin/env node
// pre-tool.js
// Claude Code hook: PreToolUse
// 危険コマンドのガード

'use strict';
const { readHookInput } = require('./hook-utils');

const hookInput = readHookInput();
const tool = hookInput.tool_name || '';

// Bash 以外はガード不要
if (tool !== 'Bash') process.exit(0);

const cmd = (hookInput.tool_input || {}).command || '';

// cmd が非文字列の場合は型変換できないためスキップ（安全側フォールバック）
if (typeof cmd !== 'string') process.exit(0);

// git force push: 警告（ブロックしない）
// --force-with-lease も強制上書きの一形態であるため警告対象に含める
if (/git\s+push\s+(--force|--force-with-lease|-f)\b/.test(cmd)) {
  process.stderr.write('[PreToolUse WARNING] git force push を検出しました。実行前にユーザーに確認を取ってください。\n');
}

// rm -rf 系（危険なターゲット指定）: ブロック
// 短フラグ形式: フラグ群（-xxx）に r と f が両方含まれるか、または -r と -f が別トークンで並ぶ
// ロングオプション形式: --recursive と --force が両方含まれる
if (/\brm\b/.test(cmd)) {
  const shortFlags = (cmd.match(/-[a-zA-Z]+/g) || []).join('');
  const hasR = shortFlags.includes('r') || /\brm\b.*\s-[a-zA-Z]*r[a-zA-Z]*/.test(cmd);
  const hasF = shortFlags.includes('f') || /\brm\b.*\s-[a-zA-Z]*f[a-zA-Z]*/.test(cmd);
  const hasLongRecursive = /--recursive/.test(cmd);
  const hasLongForce = /--force/.test(cmd);
  if ((hasR && hasF) || (hasLongRecursive && hasLongForce)) {
    process.stderr.write(`[PreToolUse BLOCK] 危険なコマンドをブロックしました: ${cmd}\n`);
    process.exit(2);
  }
}

// 本番DB破壊操作: 警告（ブロックしない）
if (/DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE/i.test(cmd)) {
  process.stderr.write('[PreToolUse WARNING] 破壊的なDB操作を検出しました。本番環境での実行でないことを確認してください。\n');
}
