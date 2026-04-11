#!/usr/bin/env node
// session-start.js
// Claude Code hook: SessionStart
// Injects previous session, global memory, instincts, and skills into context

'use strict';
const fs   = require('fs');
const path = require('path');

const cwd         = process.cwd();

/**
 * Strip the CLADE:SESSION:JSON block from .tmp file content.
 * The JSON block is intended for cluster-promote-core.js parsing and
 * does not need to appear in the session-start system-reminder (it duplicates the text sections).
 * @param {string} content
 * @returns {string}
 */
function stripSessionJsonBlock(content) {
  const start = content.indexOf('<!-- CLADE:SESSION:JSON');
  if (start === -1) return content;
  const end = content.indexOf('-->', start);
  if (end === -1) return content;
  return content.slice(0, start).trimEnd();
}

const sessionsDir = path.join(cwd, '.claude', 'memory', 'sessions');
const memoryFile  = path.join(cwd, '.claude', 'memory', 'memory.json');
const clustersDir = path.join(cwd, '.claude', 'instincts', 'clusters');
const skillsDir   = path.join(cwd, '.claude', 'skills', 'project');

// === Setup detection check ===
const settingsLocalPath = path.join(cwd, '.claude', 'settings.local.json');
const isSetupDone = fs.existsSync(settingsLocalPath);

const lines = [];
lines.push('=========================================');
lines.push('  Claude Code Session Start');
lines.push(`  ${new Date().toLocaleString('en-US')}`);
lines.push('=========================================');

// Load the latest session file
if (fs.existsSync(sessionsDir)) {
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.tmp'))
    .sort()
    .reverse();
  if (files.length > 0) {
    lines.push('');
    lines.push(`--- Previous Session: ${files[0]} ---`);
    lines.push(stripSessionJsonBlock(fs.readFileSync(path.join(sessionsDir, files[0]), 'utf8')));
  } else {
    lines.push('');
    lines.push('(No previous session — first launch)');
  }
} else {
  lines.push('');
  lines.push('(No previous session — first launch)');
}

// Load memory.json
if (fs.existsSync(memoryFile)) {
  lines.push('');
  lines.push('--- Global Memory ---');
  lines.push(fs.readFileSync(memoryFile, 'utf8'));
}

// Load project-specific instincts (clusters)
if (fs.existsSync(clustersDir)) {
  const clusterFiles = fs.readdirSync(clustersDir).filter(f => f.endsWith('.json'));
  if (clusterFiles.length > 0) {
    lines.push('');
    lines.push(`--- Project-Specific Instincts: ${clusterFiles.length} ---`);
    for (const f of clusterFiles) {
      lines.push(`  [${f}]`);
      try {
        const d = JSON.parse(fs.readFileSync(path.join(clustersDir, f), 'utf8'));
        lines.push(`  Type: ${d.type || '?'}`);
        lines.push(`  Name: ${d.name || '?'}`);
        lines.push(`  Summary: ${d.summary || '?'}`);
      } catch {
        lines.push('  (Read error)');
      }
      lines.push('');
    }
  }
}

// List project-specific skills
if (fs.existsSync(skillsDir)) {
  const skillFiles = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md'));
  if (skillFiles.length > 0) {
    lines.push('--- Project-Specific Skills ---');
    for (const f of skillFiles) lines.push(`  - ${f.replace('.md', '')}`);
    lines.push('');
  }
}

lines.push('=========================================');
lines.push('  /agent-interviewer → Requirements Gathering');
lines.push('  /agent-architect   → Architecture & Design');
lines.push('  /agent-planner     → Planning & Task Assignment');
lines.push('  /agent-developer   → Implementation');
lines.push('  /agent-tester      → Testing');
lines.push('  /agent-code-reviewer | /agent-security-reviewer → Review');
lines.push('=========================================');

if (!isSetupDone) {
  lines.push('');
  lines.push('=========================================');
  lines.push('  Setup Not Run — Warning');
  lines.push('=========================================');
  lines.push('');
  lines.push('This repository has not been set up yet.');
  lines.push('Please run the setup script before using Claude Code.');
  lines.push('');
  lines.push('  How to run:');
  lines.push('    Linux / macOS : bash setup_en.sh');
  lines.push('    Windows       : powershell -File setup_en.ps1');
  lines.push('');
  lines.push('  Without setup:');
  lines.push('    - settings.local.json will not be created, and parallel agents (worktree) will not work');
  lines.push('    - Template files will remain, potentially applying unintended settings');
  lines.push('');
  lines.push('=========================================');
}

lines.push('');
lines.push('⚠️ Instruction for Claude (must execute at session start):');
lines.push('  Read the "Previous Session" content above and present the following to the user.');
lines.push('  1. Remaining tasks (with priority)');
lines.push('  2. What went well last session');
lines.push('  3. What failed last session (if any)');
lines.push('  After presenting, ask: "Would you like to continue from where you left off, or start a new task?"');
lines.push('  * If the user explicitly ran /init-session, this instruction may be ignored.');

process.stdout.write(lines.join('\n') + '\n');
