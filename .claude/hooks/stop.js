#!/usr/bin/env node
// stop.js
// Claude Code hook: Stop
// セッション雛形を作成する

'use strict';
const fs   = require('fs');
const path = require('path');

const cwd         = process.cwd();
const sessionDir  = path.join(cwd, '.claude', 'memory', 'sessions');
const now         = new Date();
const dateStr     = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile = path.join(sessionDir, `${dateStr}.tmp`);

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

process.stderr.write('[Stop] セッション終了処理が完了しました\n');
process.stderr.write('[Stop] /end-session コマンドで詳細を記録することをお勧めします\n');
