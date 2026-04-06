#!/usr/bin/env node
/**
 * write-report.js
 * タイムスタンプ付きレポートファイルを Windows ネイティブ環境で書き出す共通スクリプト。
 * tester / code-reviewer / security-reviewer から呼び出される。
 *
 * 推奨: ヒアドキュメント（stdin）でコンテンツを渡す（文字数制限なし・改行保持）
 *
 *   # 新規出力（ヒアドキュメント推奨）
 *   node .claude/hooks/write-report.js <baseName> new <<'EOF'
 *   {レポート内容の全て}
 *   EOF
 *
 *   # 追記出力（ヒアドキュメント推奨）
 *   node .claude/hooks/write-report.js <baseName> append <targetFileName> <<'EOF'
 *   {追記内容}
 *   EOF
 *
 * 後方互換: コマンドライン引数でも渡せる（文字数制限・改行消失に注意）
 *   node .claude/hooks/write-report.js <baseName> new "<content>"
 *   node .claude/hooks/write-report.js <baseName> append <targetFileName> "<content>"
 *   node .claude/hooks/write-report.js <baseName> "<content>"
 *
 * 出力:
 *   実際に書き出したファイルパスを標準出力に表示する。
 *   例: [write-report] .claude/reports/test-report-20260401-143022.md
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const [, , baseName, modeOrContent, ...rest] = process.argv;

if (!baseName) {
  console.error('[write-report] 使い方:');
  console.error('  新規(stdin): node write-report.js <baseName> new <<\'EOF\'');
  console.error('  追記(stdin): node write-report.js <baseName> append <targetFile> <<\'EOF\'');
  console.error('  新規(引数): node write-report.js <baseName> new "<content>"');
  console.error('  追記(引数): node write-report.js <baseName> append <targetFile> "<content>"');
  process.exit(1);
}

// stdin からコンテンツを読み込む（ヒアドキュメントで渡された場合）
function readStdin() {
  return fs.readFileSync(0, 'utf-8');
}

const reportsDir = path.join(process.cwd(), '.claude', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

// タイムスタンプ生成（YYYYMMDD-HHmmss）
function generateTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${date}-${time}`;
}

// 衝突しないファイルパスを生成
function resolveNewPath(baseNameArg, timestamp) {
  const base = path.join(reportsDir, `${baseNameArg}-${timestamp}.md`);
  if (!fs.existsSync(base)) return base;

  let branch = 2;
  while (true) {
    const candidate = path.join(reportsDir, `${baseNameArg}-${timestamp}-${branch}.md`);
    if (!fs.existsSync(candidate)) return candidate;
    branch++;
  }
}

// モード判定
const isNew    = modeOrContent === 'new';
const isAppend = modeOrContent === 'append';

if (isNew) {
  // 新規出力モード
  // stdin（ヒアドキュメント）優先、なければコマンドライン引数を使用
  const content    = rest.length > 0 ? rest.join(' ') : readStdin();
  const timestamp  = generateTimestamp();
  const outputPath = resolveNewPath(baseName, timestamp);

  fs.writeFileSync(outputPath, content, 'utf-8');

  const relativePath = path.relative(process.cwd(), outputPath).replace(/\\/g, '/');
  console.log(`[write-report] ${relativePath}`);

} else if (isAppend) {
  // 追記出力モード
  // ファイル名は必須。コンテンツは stdin（ヒアドキュメント）優先、なければコマンドライン引数を使用
  const [targetFileName, ...contentParts] = rest;

  if (!targetFileName) {
    console.error('[write-report] append モードには追記先ファイル名が必要です。');
    console.error('  例: node write-report.js test-report append test-report-20260401-143022.md <<\'EOF\'');
    process.exit(1);
  }

  const content    = contentParts.length > 0 ? contentParts.join(' ') : readStdin();
  const targetPath = path.join(reportsDir, targetFileName);

  if (!fs.existsSync(targetPath)) {
    console.error(`[write-report] 追記先ファイルが見つかりません: ${targetFileName}`);
    process.exit(1);
  }

  fs.appendFileSync(targetPath, content, 'utf-8');

  const relativePath = path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
  console.log(`[write-report] ${relativePath} (appended)`);

} else {
  // 後方互換モード: node write-report.js <baseName> "<content>"
  // 第2引数が new/append でない場合は従来通り新規出力として扱う
  const content    = [modeOrContent, ...rest].join(' ');
  const timestamp  = generateTimestamp();
  const outputPath = resolveNewPath(baseName, timestamp);

  fs.writeFileSync(outputPath, content, 'utf-8');

  const relativePath = path.relative(process.cwd(), outputPath).replace(/\\/g, '/');
  console.log(`[write-report] ${relativePath}`);
}
