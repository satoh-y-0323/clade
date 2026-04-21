#!/usr/bin/env node
// check-writes-isolation.js
// Claude Code hook: PreToolUse (worktree-developer 専用)
// 担当ファイル範囲（writes）外への書き込み・削除をブロック
//
// 仕組み:
//   1. worktree-developer が起動時に .claude/tmp/worktree-writes.json を書く
//   2. このフックがそのファイルを読み、許可パターン外の Write/Edit/rm をブロック
//   3. ファイルが存在しない場合は非並列モードとみなして通過

'use strict';
const fs   = require('fs');
const path = require('path');
const { readHookInput } = require('./hook-utils');

const hookInput = readHookInput();
const toolName  = hookInput.tool_name || '';
const toolInput = hookInput.tool_input || {};
const cwd       = hookInput.cwd || process.cwd();

// worktree-writes.json を読む（なければ非並列モード → 通過）
const configPath = path.join(cwd, '.claude', 'tmp', 'worktree-writes.json');
let allowedPatterns;
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  allowedPatterns = Array.isArray(config.writes) ? config.writes : [];
} catch (_) {
  process.exit(0);
}
if (allowedPatterns.length === 0) process.exit(0);

// チェック対象ファイルパスを収集
let targetFiles = [];

if (toolName === 'Write' || toolName === 'Edit') {
  const fp = toolInput.file_path || '';
  if (fp) targetFiles.push(fp);

} else if (toolName === 'Bash') {
  const cmd = toolInput.command || '';
  // rm コマンドのターゲットを簡易抽出
  const rmMatch = cmd.match(/\brm\s+(?:-[^\s]*\s+)*([^\s|&;<>]+(?:\s+[^\s|&;<>]+)*)/);
  if (!rmMatch) process.exit(0);
  const args = rmMatch[1].split(/\s+/).filter(a => !a.startsWith('-'));
  targetFiles = args.filter(a => a.length > 0);
  if (targetFiles.length === 0) process.exit(0);

} else {
  process.exit(0);
}

// パスの正規化と照合
const normalizedCwd = cwd.replace(/\\/g, '/');
const normalizedCwdSlash = normalizedCwd.endsWith('/') ? normalizedCwd : normalizedCwd + '/';

for (const rawPath of targetFiles) {
  let fp = rawPath.replace(/\\/g, '/');

  // 絶対パスを worktree root からの相対パスに変換
  if (path.isAbsolute(rawPath)) {
    if (fp.startsWith(normalizedCwdSlash)) {
      fp = fp.slice(normalizedCwdSlash.length);
    } else {
      block(rawPath, allowedPatterns, 'PATH_OUTSIDE_WORKTREE');
    }
  }

  // .claude/ 配下は常に許可（worktree-writes.json 自身の書き込みなど）
  if (fp.startsWith('.claude/')) continue;

  if (!isAllowed(fp, allowedPatterns)) {
    block(fp, allowedPatterns, 'WRITES_ISOLATION_VIOLATION');
  }
}

process.exit(0);

// ===== ヘルパー関数 =====

function isAllowed(filePath, patterns) {
  return patterns.some(pattern => matchGlob(filePath, pattern));
}

function matchGlob(filePath, pattern) {
  const normalized = filePath.replace(/\\/g, '/');
  const pat        = pattern.replace(/\\/g, '/');
  const regexStr = pat
    .replace(/[.+^${}()|[\]]/g, '\\$&')
    .replace(/\*\*/g, '\x00')   // ** を一時プレースホルダーに
    .replace(/\*/g,   '[^/]*')  // * は単一セグメント内
    .replace(/\x00/g, '.*');    // ** は任意パス
  return new RegExp('^' + regexStr + '$').test(normalized);
}

function block(filePath, patterns, reason) {
  const msg = JSON.stringify({
    type:             reason,
    file:             filePath,
    allowed_patterns: patterns,
    action:           'BLOCKED',
  });
  process.stderr.write(msg + '\n');
  process.exit(2);
}
