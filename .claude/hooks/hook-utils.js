#!/usr/bin/env node
/**
 * hook-utils.js
 * hooks/*.js スクリプト間で共有するユーティリティ関数群
 */

'use strict';
const fs = require('fs');

/**
 * stdin から Claude Code hook の入力 JSON を読み込んで返す。
 * パースに失敗した場合は空オブジェクトを返す。
 * @returns {object}
 */
function readHookInput() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (_) {
    return {};
  }
}

/**
 * セッションファイルの雛形テキストを生成する。
 * @param {string} dateStr - YYYYMMDD 形式の日付文字列
 * @returns {string}
 */
function createSessionTemplate(dateStr) {
  return [
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
}

module.exports = { readHookInput, createSessionTemplate };
