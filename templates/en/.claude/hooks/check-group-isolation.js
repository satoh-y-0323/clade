#!/usr/bin/env node
// check-group-isolation.js
// Claude Code hook: PreToolUse (worktree-developer only)
// Blocks writes and deletes outside the parallel group's file ownership scope

'use strict';
const fs   = require('fs');
const path = require('path');

// ===== Read input =====
let hookInput = {};
try {
  const stdinData = fs.readFileSync(0, 'utf8');
  hookInput = JSON.parse(stdinData);
} catch (_) {}

const toolName  = hookInput.tool_name || '';
const toolInput = hookInput.tool_input || {};
const cwd       = hookInput.cwd || process.cwd();

// ===== Extract worktree group ID =====
// Read from group-config.json (supports isolation: "worktree")
const normalizedCwd   = cwd.replace(/\\/g, '/');
const groupConfigPath = path.join(cwd, '.claude', 'group-config.json');
let groupId;
try {
  const config = JSON.parse(fs.readFileSync(groupConfigPath, 'utf8'));
  groupId = config.groupId;
} catch (_) {}
if (!groupId) process.exit(0); // no group-config.json = not in a worktree, skip check

// ===== Get target file paths to check =====
let targetFiles = [];

if (toolName === 'Write' || toolName === 'Edit') {
  const fp = toolInput.file_path || '';
  if (fp) targetFiles.push(fp);

} else if (toolName === 'Bash') {
  const cmd = toolInput.command || '';
  // Simple extraction of rm command targets (complex shell syntax excluded)
  const rmMatch = cmd.match(/\brm\s+(?:-[^\s]*\s+)*([^\s|&;<>]+(?:\s+[^\s|&;<>]+)*)/);
  if (!rmMatch) process.exit(0); // not an rm command, skip
  // Split paths by spaces, excluding flags
  const args = rmMatch[1].split(/\s+/).filter(a => !a.startsWith('-'));
  targetFiles = args.filter(a => a.length > 0);
  if (targetFiles.length === 0) process.exit(0);

} else {
  process.exit(0);
}

// ===== Get allowed patterns from plan-report =====
const reportsDir = path.join(cwd, '.claude', 'reports');
let planReportContent = '';
try {
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('plan-report-') && f.endsWith('.md'))
    .sort();
  if (files.length === 0) process.exit(0);
  planReportContent = fs.readFileSync(path.join(reportsDir, files[files.length - 1]), 'utf8');
} catch (_) {
  process.exit(0); // if plan-report is unreadable, skip check
}

// Extract YAML frontmatter
const fmMatch = planReportContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!fmMatch) process.exit(0);

const allowedPatterns = getGroupFiles(fmMatch[1], groupId);
if (!allowedPatterns || allowedPatterns.length === 0) process.exit(0);

// ===== Check each file path =====
const normalizedCwdSlash = normalizedCwd.endsWith('/') ? normalizedCwd : normalizedCwd + '/';

for (const rawPath of targetFiles) {
  let fp = rawPath.replace(/\\/g, '/');

  // Convert absolute paths to relative paths from worktree root
  if (path.isAbsolute(rawPath)) {
    if (fp.startsWith(normalizedCwdSlash)) {
      fp = fp.slice(normalizedCwdSlash.length);
    } else {
      // Block operations on absolute paths outside the worktree
      block(rawPath, groupId, allowedPatterns, 'PATH_OUTSIDE_WORKTREE');
    }
  }

  if (!isAllowed(fp, allowedPatterns)) {
    block(fp, groupId, allowedPatterns, 'GROUP_ISOLATION_VIOLATION');
  }
}

process.exit(0);

// ===== Helper functions =====

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

    // Stop at another top-level key
    if (/^\S/.test(line)) break;

    // Start of target group
    if (line === `  ${gid}:`) {
      inTargetGroup = true;
      inFiles       = false;
      continue;
    }

    // Stop when reaching another group
    if (inTargetGroup && /^  \S/.test(line) && line !== `  ${gid}:`) break;

    if (!inTargetGroup) continue;

    // Start of files: section
    if (line === '    files:') {
      inFiles = true;
      continue;
    }

    // Stop at another key under files:
    if (inFiles && /^    \S/.test(line) && !line.startsWith('      -')) break;

    // Collect file patterns
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

  // Escape special characters, then convert ** and *
  const regexStr = pat
    .replace(/[.+^${}()|[\]]/g, '\\$&')
    .replace(/\*\*/g, '\x00')   // ** to placeholder
    .replace(/\*/g, '[^/]*')    // * matches single segment
    .replace(/\x00/g, '.*');    // ** matches any path

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
