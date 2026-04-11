#!/usr/bin/env node
// session-start.js
// Claude Code hook: SessionStart
// 前回セッション・グローバルメモリ・インスティンクト・スキルをコンテキストに注入

'use strict';
const fs   = require('fs');
const path = require('path');

// Claude Code hook は常にプロジェクトルートを cwd として起動するため、このパスは安全
const cwd         = process.cwd();

/**
 * .tmp ファイルの内容から CLADE:SESSION:JSON ブロックを除去する。
 * JSON ブロックは cluster-promote-core.js 向けのデータであり、
 * session-start の system-reminder に含める必要はない（テキスト部分と重複）。
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

// === セットアップ未実行チェック ===
const settingsLocalPath = path.join(cwd, '.claude', 'settings.local.json');
const isSetupDone = fs.existsSync(settingsLocalPath);

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
    lines.push(stripSessionJsonBlock(fs.readFileSync(path.join(sessionsDir, files[0]), 'utf8')));
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
lines.push('  /agent-interviewer → 要件ヒアリング');
lines.push('  /agent-architect   → 設計');
lines.push('  /agent-planner     → 計画立案・タスク割り振り');
lines.push('  /agent-developer   → 実装');
lines.push('  /agent-tester      → テスト');
lines.push('  /agent-code-reviewer | /agent-security-reviewer → レビュー');
lines.push('=========================================');
lines.push('');
lines.push('⚠️ Claude への指示（セッション開始時に必ず実行すること）:');
lines.push('  上記「前回セッション」の内容を読み、以下をユーザーに必ず提示すること。');
lines.push('  1. 残タスク一覧（優先度付き）');
lines.push('  2. 前回うまくいったこと');
lines.push('  3. 前回失敗したこと（あれば）');
lines.push('  提示後、「続きから作業しますか？それとも新しいタスクを開始しますか？」と聞くこと。');
lines.push('  ※ ユーザーが /init-session を明示的に実行した場合はこの指示を無視してよい。');

if (!isSetupDone) {
  lines.push('');
  lines.push('=========================================');
  lines.push('  セットアップ未実行の警告');
  lines.push('=========================================');
  lines.push('');
  lines.push('このリポジトリはセットアップが完了していません。');
  lines.push('Claude Code を正しく利用するには、先にセットアップスクリプトを実行してください。');
  lines.push('');
  lines.push('  実行方法:');
  lines.push('    Linux / macOS : bash setup.sh');
  lines.push('    Windows       : powershell -File setup.ps1');
  lines.push('');
  lines.push('  セットアップを行わない場合の影響:');
  lines.push('    - settings.local.json が配置されず、並列エージェント（worktree）が動作しません');
  lines.push('    - テンプレートファイルが残ったままになり、意図しない設定が適用される可能性があります');
  lines.push('');
  lines.push('=========================================');
}

process.stdout.write(lines.join('\n') + '\n');
