#!/usr/bin/env node
// pre-compact.js
// Claude Code hook: PreCompact
// コンテキスト圧縮前にセッションファイルへチェックポイントを記録

'use strict';
const fs   = require('fs');
const path = require('path');

const cwd         = process.cwd();
const sessionDir  = path.join(cwd, '.claude', 'memory', 'sessions');
const now         = new Date();
const dateStr     = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile = path.join(sessionDir, `${dateStr}.tmp`);
const ts          = now.toISOString();

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// セッションファイルが存在しない場合は雛形を作成
if (!fs.existsSync(sessionFile)) {
  const template = [
    `SESSION: ${dateStr}`,
    'AGENT: (未設定)',
    '',
    '## うまくいったアプローチ（証拠付き）',
    '（/end-session コマンドで記入）',
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
}

// PreCompact チェックポイントを追記
const checkpoint = [
  '',
  `## [PreCompact checkpoint: ${ts}]`,
  'コンテキストウィンドウ圧縮が発生しました。',
  'このポイント以前の詳細な文脈は失われています。',
].join('\n');

fs.appendFileSync(sessionFile, checkpoint + '\n', 'utf8');
process.stderr.write(`[PreCompact] セッション状態を ${sessionFile} に保存しました\n`);
