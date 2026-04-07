#!/usr/bin/env node
// check-group-isolation.js
// Claude Code hook: PreToolUse (worktree-developer 専用)
// 並列グループのファイルオーナーシップ範囲外への書き込み・削除をブロック

'use strict';
const fs   = require('fs');
const path = require('path');

// ===== 入力読み込み =====
let hookInput = {};
try {
  const stdinData = fs.readFileSync(0, 'utf8');
  hookInput = JSON.parse(stdinData);
} catch (_) {}

const toolName  = hookInput.tool_name || '';
const toolInput = hookInput.tool_input || {};
const cwd       = hookInput.cwd || process.cwd();

// ===== worktree グループID の抽出 =====
const normalizedCwd = cwd.replace(/\\/g, '/');
const worktreeMatch = normalizedCwd.match(/\/\.claude\/worktrees\/([^/]+)\/?$/);
if (!worktreeMatch) process.exit(0); // worktree 外はチェックしない

const groupId = worktreeMatch[1];

// ===== チェック対象のファイルパスを取得 =====
let targetFiles = [];

if (toolName === 'Write' || toolName === 'Edit') {
  const fp = toolInput.file_path || '';
  if (fp) targetFiles.push(fp);

} else if (toolName === 'Bash') {
  const cmd = toolInput.command || '';
  // rm コマンドのターゲットを簡易抽出（複雑なシェル構文は対象外）
  const rmMatch = cmd.match(/\brm\s+(?:-[^\s]*\s+)*([^\s|&;<>]+(?:\s+[^\s|&;<>]+)*)/);
  if (!rmMatch) process.exit(0); // rm でなければスキップ
  // スペース区切りでファイルパスを分割（フラグ除外）
  const args = rmMatch[1].split(/\s+/).filter(a => !a.startsWith('-'));
  targetFiles = args.filter(a => a.length > 0);
  if (targetFiles.length === 0) process.exit(0);

} else {
  process.exit(0);
}

// ===== plan-report から許可パターンを取得 =====
const reportsDir = path.join(cwd, '.claude', 'reports');
let planReportContent = '';
try {
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('plan-report-') && f.endsWith('.md'))
    .sort();
  if (files.length === 0) process.exit(0);
  planReportContent = fs.readFileSync(path.join(reportsDir, files[files.length - 1]), 'utf8');
} catch (_) {
  process.exit(0); // plan-report が読めなければチェックしない
}

// YAML フロントマターを抽出
const fmMatch = planReportContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!fmMatch) process.exit(0);

const allowedPatterns = getGroupFiles(fmMatch[1], groupId);
if (!allowedPatterns || allowedPatterns.length === 0) process.exit(0);

// ===== 各ファイルパスをチェック =====
const normalizedCwdSlash = normalizedCwd.endsWith('/') ? normalizedCwd : normalizedCwd + '/';

for (const rawPath of targetFiles) {
  let fp = rawPath.replace(/\\/g, '/');

  // 絶対パスの場合は worktree root からの相対パスに変換
  if (path.isAbsolute(rawPath)) {
    if (fp.startsWith(normalizedCwdSlash)) {
      fp = fp.slice(normalizedCwdSlash.length);
    } else {
      // worktree 外の絶対パスへの操作はブロック
      block(rawPath, groupId, allowedPatterns, 'PATH_OUTSIDE_WORKTREE');
    }
  }

  if (!isAllowed(fp, allowedPatterns)) {
    block(fp, groupId, allowedPatterns, 'GROUP_ISOLATION_VIOLATION');
  }
}

process.exit(0);

// ===== ヘルパー関数 =====

function getGroupFiles(frontmatterText, gid) {
  const lines = frontmatterText.split(/\r?\n/);
  let inParallelGroups = false;
  let inTargetGroup   = false;
  let inFiles         = false;
  const files = [];

  for (const line of lines) {
    if (line === 'parallel_groups:') {
      inParallelGroups = true;
      continue;
    }
    if (!inParallelGroups) continue;

    // 別のトップレベルキーに到達したら終了
    if (/^\S/.test(line)) break;

    // 対象グループの開始
    if (line === `  ${gid}:`) {
      inTargetGroup = true;
      inFiles       = false;
      continue;
    }

    // 別のグループに到達したら終了
    if (inTargetGroup && /^  \S/.test(line) && line !== `  ${gid}:`) break;

    if (!inTargetGroup) continue;

    // files: セクションの開始
    if (line === '    files:') {
      inFiles = true;
      continue;
    }

    // files: 配下の別キーに到達したら終了
    if (inFiles && /^    \S/.test(line) && !line.startsWith('      -')) break;

    // ファイルパターンを収集
    if (inFiles && line.startsWith('      - ')) {
      files.push(line.slice(8).trim());
    }
  }

  return files.length > 0 ? files : null;
}

function isAllowed(filePath, patterns) {
  return patterns.some(pattern => matchGlob(filePath, pattern));
}

function matchGlob(filePath, pattern) {
  const normalized = filePath.replace(/\\/g, '/');
  const pat        = pattern.replace(/\\/g, '/');

  // 特殊文字をエスケープしてから ** と * を変換
  const regexStr = pat
    .replace(/[.+^${}()|[\]]/g, '\\$&')
    .replace(/\*\*/g, '\x00')   // ** を一時プレースホルダーに
    .replace(/\*/g, '[^/]*')    // * は単一セグメント
    .replace(/\x00/g, '.*');    // ** は任意パス

  return new RegExp('^' + regexStr + '$').test(normalized);
}

function block(filePath, gid, patterns, reason) {
  const msg = JSON.stringify({
    type:             reason,
    file:             filePath,
    group:            gid,
    allowed_patterns: patterns,
    action:           'BLOCKED',
  });
  process.stderr.write(msg + '\n');
  process.exit(2);
}
