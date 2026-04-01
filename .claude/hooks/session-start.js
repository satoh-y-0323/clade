#!/usr/bin/env node
// session-start.js
// Claude Code hook: SessionStart
// 前回セッション・グローバルメモリ・インスティンクト・スキルをコンテキストに注入

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
lines.push('  Claude Code セッション開始');
lines.push(`  ${new Date().toLocaleString('ja-JP')}`);
lines.push('=========================================');

// 最新セッションファイルを読み込む
if (fs.existsSync(sessionsDir)) {
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.tmp'))
    .sort()
    .reverse();
  if (files.length > 0) {
    lines.push('');
    lines.push(`--- 前回セッション: ${files[0]} ---`);
    lines.push(fs.readFileSync(path.join(sessionsDir, files[0]), 'utf8'));
  } else {
    lines.push('');
    lines.push('（前回セッションなし — 初回起動）');
  }
} else {
  lines.push('');
  lines.push('（前回セッションなし — 初回起動）');
}

// memory.json を読み込む
if (fs.existsSync(memoryFile)) {
  lines.push('');
  lines.push('--- グローバルメモリ ---');
  lines.push(fs.readFileSync(memoryFile, 'utf8'));
}

// プロジェクト固有インスティンクト（クラスタ）を読み込む
if (fs.existsSync(clustersDir)) {
  const clusterFiles = fs.readdirSync(clustersDir).filter(f => f.endsWith('.json'));
  if (clusterFiles.length > 0) {
    lines.push('');
    lines.push(`--- プロジェクト固有インスティンクト: ${clusterFiles.length}件 ---`);
    for (const f of clusterFiles) {
      lines.push(`  [${f}]`);
      try {
        const d = JSON.parse(fs.readFileSync(path.join(clustersDir, f), 'utf8'));
        lines.push(`  種別: ${d.type || '?'}`);
        lines.push(`  名称: ${d.name || '?'}`);
        lines.push(`  概要: ${d.summary || '?'}`);
      } catch {
        lines.push('  （読み込みエラー）');
      }
      lines.push('');
    }
  }
}

// プロジェクト固有スキルを一覧表示
if (fs.existsSync(skillsDir)) {
  const skillFiles = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md'));
  if (skillFiles.length > 0) {
    lines.push('--- プロジェクト固有スキル ---');
    for (const f of skillFiles) lines.push(`  - ${f.replace('.md', '')}`);
    lines.push('');
  }
}

lines.push('=========================================');
lines.push('  /agent:developer | /agent:architect');
lines.push('  /agent:tester');
lines.push('  /agent:code-reviewer | /agent:security-reviewer');
lines.push('  でエージェントを選択してください');
lines.push('=========================================');

process.stdout.write(lines.join('\n') + '\n');
