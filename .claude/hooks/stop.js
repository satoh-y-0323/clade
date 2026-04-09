#!/usr/bin/env node
// stop.js
// Claude Code hook: Stop
// セッション雛形を作成する

'use strict';
const fs   = require('fs');
const path = require('path');
const { createSessionTemplate } = require('./hook-utils');

const cwd         = process.cwd();
const sessionDir  = path.join(cwd, '.claude', 'memory', 'sessions');
const now         = new Date();
const dateStr     = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile = path.join(sessionDir, `${dateStr}.tmp`);

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// セッションファイルが未作成なら雛形を生成
if (!fs.existsSync(sessionFile)) {
  fs.writeFileSync(sessionFile, createSessionTemplate(dateStr), 'utf8');
  process.stderr.write(`[Stop] セッションファイルを作成しました: ${sessionFile}\n`);
}

process.stderr.write('[Stop] セッション終了処理が完了しました\n');
process.stderr.write('[Stop] /end-session コマンドで詳細を記録することをお勧めします\n');
