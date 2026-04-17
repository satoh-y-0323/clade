#!/usr/bin/env node
// check-group-isolation.js
// Claude Code hook: PreToolUse (worktree-developer only)
// Block writes / deletes that fall outside the parallel group's file ownership

'use strict';
const fs   = require('fs');
const path = require('path');
const { readHookInput } = require('./hook-utils');

// ===== Read input =====
const hookInput = readHookInput();

const toolName  = hookInput.tool_name || '';
const toolInput = hookInput.tool_input || {};
const cwd       = hookInput.cwd || process.cwd();

// ===== Extract the worktree group ID =====
// Read the group ID from group-config.json (for isolation: "worktree")
const normalizedCwd = cwd.replace(/\\/g, '/');
const groupConfigPath = path.join(cwd, '.claude', 'group-config.json');
let groupId;
try {
  const config = JSON.parse(fs.readFileSync(groupConfigPath, 'utf8'));
  groupId = config.groupId;
} catch (_) {}
if (!groupId) process.exit(0); // No group-config.json → skip the check

// ===== Collect file paths to check =====
let targetFiles = [];

if (toolName === 'Write' || toolName === 'Edit') {
  const fp = toolInput.file_path || '';
  if (fp) targetFiles.push(fp);

} else if (toolName === 'Bash') {
  const cmd = toolInput.command || '';
  // Lightly extract targets of rm commands (complex shell syntax is out of scope)
  const rmMatch = cmd.match(/\brm\s+(?:-[^\s]*\s+)*([^\s|&;<>]+(?:\s+[^\s|&;<>]+)*)/);
  if (!rmMatch) process.exit(0); // Not rm → skip
  // Split file paths on whitespace (drop flags)
  const args = rmMatch[1].split(/\s+/).filter(a => !a.startsWith('-'));
  targetFiles = args.filter(a => a.length > 0);
  if (targetFiles.length === 0) process.exit(0);

} else {
  process.exit(0);
}

// ===== Load allowed patterns from plan-report =====
const reportsDir = path.join(cwd, '.claude', 'reports');
let planReportContent = '';
try {
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('plan-report-') && f.endsWith('.md'))
    .sort();
  if (files.length === 0) process.exit(0);
  planReportContent = fs.readFileSync(path.join(reportsDir, files[files.length - 1]), 'utf8');
} catch (_) {
  process.exit(0); // Cannot read plan-report → skip the check
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

  // For absolute paths, convert to paths relative to the worktree root
  if (path.isAbsolute(rawPath)) {
    if (fp.startsWith(normalizedCwdSlash)) {
      fp = fp.slice(normalizedCwdSlash.length);
    } else {
      // Operations on absolute paths outside the worktree are blocked
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

    // Stop once we reach another top-level key
    if (/^\S/.test(line)) break;

    // Start of the target group
    if (line === `  ${gid}:`) {
      inTargetGroup = true;
      inFiles       = false;
      continue;
    }

    // Stop once we reach another group
    if (inTargetGroup && /^  \S/.test(line) && line !== `  ${gid}:`) break;

    if (!inTargetGroup) continue;

    // Start of the files: section
    if (line === '    files:') {
      inFiles = true;
      continue;
    }

    // Stop once we reach another key under files:
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

  // Escape regex metacharacters, then expand ** and *
  const regexStr = pat
    .replace(/[.+^${}()|[\]]/g, '\\$&')
    .replace(/\*\*/g, '\x00')   // temporarily stash **
    .replace(/\*/g, '[^/]*')    // * → single path segment
    .replace(/\x00/g, '.*');    // ** → any path

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
