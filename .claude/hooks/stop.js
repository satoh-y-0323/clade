#!/usr/bin/env node
// stop.js
// Claude Code hook: Stop
// セッション雛形作成・観察データ集計・パターン抽出の非同期起動

'use strict';
const fs            = require('fs');
const path          = require('path');
const { spawn }     = require('child_process');

const cwd           = process.cwd();
const sessionDir    = path.join(cwd, '.claude', 'memory', 'sessions');
const now           = new Date();
const dateStr       = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile   = path.join(sessionDir, `${dateStr}.tmp`);
const obsFile       = path.join(cwd, '.claude', 'instincts', 'raw', 'observations.jsonl');
const extractScript = path.join(cwd, '.claude', 'hooks', 'extract-patterns.js');

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// セッションファイルが未作成なら雛形を生成
if (!fs.existsSync(sessionFile)) {
  const template = [
    `SESSION: ${dateStr}`,
    'AGENT: (未設定)',
    '',
    '## うまくいったアプローチ（証拠付き）',
    '（/end-session コマンドで記入してください）',
    '',
    '## 試みたが失敗したアプローチ',
    '（未記入）',
    '',
    '## まだ試していないアプローチ',
    '（未記入）',
    '',
    '## 残タスク',
    '（未記入）',
  ].join('\n');
  fs.writeFileSync(sessionFile, template, 'utf8');
  process.stderr.write(`[Stop] セッションファイルを作成しました: ${sessionFile}\n`);
}

// 本日の観察データ数を集計して追記
if (fs.existsSync(obsFile)) {
  const today = now.toISOString().slice(0, 10);
  const lines = fs.readFileSync(obsFile, 'utf8').split('\n').filter(Boolean);
  const toolCount = lines.filter(l => l.includes(`"${today}`)).length;
  const note = [
    '',
    `## [Stop hook: ${now.toISOString().replace('T', ' ').slice(0, 19)}]`,
    `本日の観察データ: ${toolCount}件`,
  ].join('\n');
  fs.appendFileSync(sessionFile, note + '\n', 'utf8');
}

// extract-patterns.js を非同期実行
if (fs.existsSync(extractScript)) {
  const child = spawn(process.execPath, [extractScript], {
    detached: true,
    stdio:    'ignore',
    cwd:      cwd,
  });
  child.unref();
  process.stderr.write('[Stop] パターン抽出スクリプトを起動しました\n');
}

process.stderr.write('[Stop] セッション終了処理が完了しました\n');
process.stderr.write('[Stop] /end-session コマンドで詳細を記録することをお勧めします\n');
