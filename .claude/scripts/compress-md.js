#!/usr/bin/env node
/**
 * compress-md.js
 * .claude/**\/*.md ファイルに6つのトークン効率化テクニックを適用する再実行可能スクリプト
 *
 * 使い方:
 *   node .claude/scripts/compress-md.js              # .claude/**\/*.md を全処理
 *   node .claude/scripts/compress-md.js path/to/file.md  # 特定ファイルのみ
 *   node .claude/scripts/compress-md.js --dry-run    # 変更をファイルに書き込まず表示のみ
 *
 * 適用する変換:
 *   T3: チェックボックス圧縮  "- [ ] " → "- "
 *   T4: テーブル検出・警告    (自動変換は複雑なため警告のみ)
 *   T5: HTMLコメント提案      長い連続散文段落を検出して警告
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const dryRun  = args.includes('--dry-run');
const targets = args.filter(a => !a.startsWith('--'));

// ========== ファイル収集 ==========
function collectFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...collectFiles(full));
    else if (entry.name.endsWith('.md')) result.push(full);
  }
  return result;
}

const root       = process.cwd();
const claudeDir  = path.join(root, '.claude');
const files      = targets.length > 0
  ? targets.map(t => path.resolve(t))
  : collectFiles(claudeDir);

// ========== 変換ルール ==========
/**
 * T3: "- [ ] " → "- "（チェックボックス圧縮）
 * ルールファイルのチェックリストは対話的に使われないため [ ] は不要
 * コードブロック内は変換しない
 */
function compressCheckboxes(src) {
  const lines   = src.split('\n');
  let inCode    = false;
  let changed   = false;
  const result  = lines.map(line => {
    if (line.startsWith('```')) { inCode = !inCode; return line; }
    if (inCode) return line;
    const replaced = line.replace(/^(\s*)- \[ \] /, '$1- ');
    if (replaced !== line) changed = true;
    return replaced;
  });
  return changed ? result.join('\n') : src;
}

/**
 * T4: Markdownテーブルを検出して警告
 * 自動変換は文脈依存なため警告にとどめる
 */
function detectTables(src) {
  const lines   = src.split('\n');
  const inCode  = { state: false };
  const tableLines = [];
  lines.forEach((line, i) => {
    if (line.startsWith('```')) inCode.state = !inCode.state;
    if (!inCode.state && /^\|.+\|/.test(line)) tableLines.push(i + 1);
  });
  if (tableLines.length > 0) {
    console.warn(`  [T4-警告] テーブル検出 (行 ${tableLines.join(', ')}): リスト形式への変換を検討`);
  }
}

/**
 * T5: 長い散文段落を検出して警告（HTMLコメント化の候補）
 * コードブロック外で80文字超の行が3行以上続く場合
 */
function detectVerboseProse(src) {
  const lines  = src.split('\n');
  const inCode = { state: false };
  let streak   = 0;
  let warnLine = -1;
  lines.forEach((line, i) => {
    if (line.startsWith('```')) { inCode.state = !inCode.state; streak = 0; return; }
    if (inCode.state) { streak = 0; return; }
    if (!line.startsWith('#') && !line.startsWith('-') && !line.startsWith('*') && line.length > 80) {
      streak++;
      if (streak === 3 && warnLine === -1) warnLine = i + 1;
    } else {
      streak = 0;
    }
  });
  if (warnLine !== -1) {
    console.warn(`  [T5-警告] 長い散文段落 (行 ${warnLine}〜): HTMLコメント化を検討`);
  }
}

// ========== メイン処理 ==========
let totalChanged = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`[エラー] ファイルが見つかりません: ${file}`);
    continue;
  }
  const rel = path.relative(root, file);
  const src  = fs.readFileSync(file, 'utf8');

  // T3: チェックボックス圧縮
  const after = compressCheckboxes(src);
  const changed = after !== src;

  // T4, T5: 警告のみ
  if (changed || true) {  // always check warnings
    const checkWarnings = after !== src || true;
    if (checkWarnings) {
      process.stdout.write(`${rel}\n`);
      detectTables(after);
      detectVerboseProse(after);
    }
  }

  if (changed) {
    totalChanged++;
    const checkboxCount = (src.match(/^(\s*)- \[ \] /gm) || []).length;
    console.log(`  [T3] チェックボックス ${checkboxCount} 件を圧縮`);
    if (!dryRun) {
      fs.writeFileSync(file, after, 'utf8');
      console.log(`  → 書き込み完了`);
    } else {
      console.log(`  → (dry-run) 書き込みをスキップ`);
    }
  }
}

console.log(`\n完了: ${files.length} ファイル検査、${totalChanged} ファイル変更${dryRun ? ' (dry-run)' : ''}`);
console.log('\n手動対応が必要なテクニック:');
console.log('  T1: @import 分割    — 大きなセクションを docs/ に移動し、必要なエージェントのみ @import');
console.log('  T2: パス指定ルール  — .claude/agents/*.md でのみ読み込まれるルールを確認');
console.log('  T4: テーブル回避    — 上記の [T4-警告] 箇所をリスト形式に書き直す');
console.log('  T5: HTMLコメント    — 上記の [T5-警告] 箇所を <!-- --> で囲む');
console.log('  T6: フック最適化    — session-start.js の出力を最小化する');
