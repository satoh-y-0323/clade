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

/**
 * 事実オブジェクトから Markdown セクション文字列を生成する。
 * @param {{ recordedAt: string, bashCount: number, errCount: number, recentErrors: string[] }} factsObj
 * @returns {string}
 */
function buildFactsSection(factsObj) {
  const { recordedAt, bashCount, errCount, recentErrors } = factsObj;
  const lines = [
    '## 事実ログ（自動生成 / stop.js）',
    `- 記録時刻: ${recordedAt}`,
    `- Bash実行数: ${bashCount}`,
    `- エラー数: ${errCount}`,
    '- 直近のエラーコマンド:',
  ];
  if (recentErrors.length === 0) {
    lines.push('  - （なし）');
  } else {
    for (const cmd of recentErrors) {
      lines.push(`  - ${cmd}`);
    }
  }
  return lines.join('\n');
}

/**
 * tmpContent 内の「## 事実ログ（自動生成 / stop.js）」セクションを置換する。
 * 存在しない場合は末尾に追記する（冪等性を保証）。
 * @param {string} tmpContent - セッションファイルの既存テキスト
 * @param {string} factsSection - buildFactsSection で生成したセクション文字列
 * @returns {string}
 */
function upsertFactsSection(tmpContent, factsSection) {
  const HEADER = '## 事実ログ（自動生成 / stop.js）';
  const headerIndex = tmpContent.indexOf(HEADER);
  if (headerIndex === -1) {
    // 末尾に追記
    const separator = tmpContent.endsWith('\n') ? '\n' : '\n\n';
    return tmpContent + separator + factsSection + '\n';
  }
  // 既存セクションの終端を検出: 次の `## ` ヘッダーまたはファイル末尾
  const afterHeader = tmpContent.indexOf('\n## ', headerIndex + 1);
  if (afterHeader === -1) {
    // このセクションがファイル末尾まで続く
    return tmpContent.slice(0, headerIndex) + factsSection + '\n';
  }
  return tmpContent.slice(0, headerIndex) + factsSection + '\n' + tmpContent.slice(afterHeader + 1);
}

module.exports = { readHookInput, createSessionTemplate, buildFactsSection, upsertFactsSection };
