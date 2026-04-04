#!/usr/bin/env node
// session-start.js
// Claude Code hook: SessionStart
// Injects previous session, global memory, instincts, and skills into context

'use strict';
const fs   = require('fs');
const path = require('path');

const cwd         = process.cwd();
const sessionsDir = path.join(cwd, '.claude', 'memory', 'sessions');
const memoryFile  = path.join(cwd, '.claude', 'memory', 'memory.json');
const clustersDir = path.join(cwd, '.claude', 'instincts', 'clusters');
const skillsDir   = path.join(cwd, '.claude', 'skills', 'project');

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
    lines.push(fs.readFileSync(path.join(sessionsDir, files[0]), 'utf8'));
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

process.stdout.write(lines.join('\n') + '\n');
