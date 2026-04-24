#!/usr/bin/env node
// stop.js
// Claude Code hook: Stop
// セッション雛形を作成する

'use strict';
const fs   = require('fs');
const path = require('path');
const { createSessionTemplate, buildFactsSection, upsertFactsSection, getProjectRoot, isWorktree } = require('./hook-utils');

if (isWorktree()) process.exit(0);

const cwd         = getProjectRoot();
const sessionDir  = path.join(cwd, '.claude', 'memory', 'sessions');
const now         = new Date();
const dateStr     = now.toISOString().slice(0, 10).replace(/-/g, '');
const sessionFile = path.join(sessionDir, `${dateStr}.tmp`);

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// セッションファイルが未作成なら雛形を生成
// wx フラグ（排他的作成）を使うことで existsSync と writeFileSync の間の
// TOCTOU（Time-of-check Time-of-use）競合を防ぐ
try {
  fs.writeFileSync(sessionFile, createSessionTemplate(dateStr), { encoding: 'utf8', flag: 'wx' });
  process.stderr.write(`[Stop] セッションファイルを作成しました: ${sessionFile}\n`);
} catch (e) {
  if (e.code !== 'EEXIST') throw e;
  // 既存ファイルの場合はスキップ（正常）
}

process.stderr.write('[Stop] セッション終了処理が完了しました\n');
process.stderr.write('[Stop] /end-session コマンドで詳細を記録することをお勧めします\n');

// 機械的事実をセッション tmp に記録する
try {
  const bashLogFile = path.join(cwd, '.claude', 'instincts', 'raw', 'bash-log.jsonl');

  let bashCount   = 0;
  let errCount    = 0;
  let recentErrors = [];

  if (fs.existsSync(bashLogFile)) {
    const lines = fs.readFileSync(bashLogFile, 'utf8')
      .split('\n')
      .filter(line => line.trim() !== '');

    bashCount = lines.length;

    const errorLines = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.err === true) {
          errCount++;
          errorLines.push(entry);
        }
      } catch (_) {
        // パース失敗行はスキップ（ファイル破損の可能性があるためエラーカウントに計上）
        errCount++;
        recentErrors.push('(JSONL parse error)');
      }
    }

    // 直近5件のエラーコマンドを取得
    // cmd が Markdown 見出し記号（#）で始まる場合、セッションファイルの構造を壊す可能性があるため
    // 行頭の # をエスケープする（upsertFactsSection が ## を次セクション開始として誤検出する問題を防ぐ）
    recentErrors = errorLines
      .slice(-5)
      .map(entry => (entry.cmd || '(不明)').replace(/^#/gm, '\\#'));
  }

  // 記録時刻を JST で YYYY-MM-DD HH:mm:ss 形式に変換
  const pad = n => String(n).padStart(2, '0');
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const recordedAt = [
    jst.getUTCFullYear(),
    pad(jst.getUTCMonth() + 1),
    pad(jst.getUTCDate()),
  ].join('-') + ' ' + [
    pad(jst.getUTCHours()),
    pad(jst.getUTCMinutes()),
    pad(jst.getUTCSeconds()),
  ].join(':');

  const factsObj = { recordedAt, bashCount, errCount, recentErrors };
  const factsSection = buildFactsSection(factsObj);

  const currentContent = fs.readFileSync(sessionFile, 'utf8');
  const updatedContent = upsertFactsSection(currentContent, factsSection);
  fs.writeFileSync(sessionFile, updatedContent, 'utf8');

  process.stderr.write(`[Stop] 事実ログを記録しました (Bash実行数: ${bashCount}, エラー数: ${errCount})\n`);
} catch (err) {
  process.stderr.write(`[Stop] 事実ログの記録中にエラーが発生しました: ${err.message}\n`);
  process.exit(0);
}
