'use strict';

/**
 * update-clade-section.js
 *
 * CLAUDE.md の <!-- CLADE:START --> ~ <!-- CLADE:END --> 区間内の
 * "## Global Rules (Clade 管理)" サブセクションに @rules/NAME.md を冪等追記する。
 *
 * Usage:
 *   node .claude/hooks/update-clade-section.js add-rule NAME [--dry-run]
 *
 * Exit codes:
 *   0 - 正常終了 (追記済み or CLADEマーカーが見つからない場合も0)
 *   2 - no-op (既に同一エントリが存在するため追記不要)
 *   1 - エラー (ファイル読み書き失敗など)
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------
const CLADE_START_MARKER = '<!-- CLADE:START -->';
const CLADE_END_MARKER = '<!-- CLADE:END -->';
const GLOBAL_RULES_HEADING = '## Global Rules (Clade 管理)';

// ---------------------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------------------

/**
 * stderr にログを出力する
 * @param {string} message
 */
function log(message) {
  process.stderr.write('[update-clade-section] ' + message + '\n');
}

/**
 * プロジェクトルートを返す（このスクリプトが .claude/hooks/ に置かれている前提）
 * @returns {string}
 */
function getProjectRoot() {
  return path.resolve(__dirname, '..', '..');
}

/**
 * CLAUDE.md のパスを返す
 * @returns {string}
 */
function getClaudeMdPath() {
  return path.join(getProjectRoot(), '.claude', 'CLAUDE.md');
}

// ---------------------------------------------------------------------------
// コア処理
// ---------------------------------------------------------------------------

/**
 * CLADE:START ~ CLADE:END 区間の開始・終了インデックスを検出する。
 * CRLF / LF 両対応。
 *
 * @param {string} content - ファイル全文
 * @returns {{ startIdx: number, endIdx: number } | null}
 *   startIdx: CLADE:START マーカー行の先頭インデックス
 *   endIdx:   CLADE:END マーカー行の末尾インデックス（\n含む）
 *   null:     マーカーが見つからない場合
 */
function findCladeSection(content) {
  const startIdx = content.indexOf(CLADE_START_MARKER);
  if (startIdx === -1) return null;

  const endIdx = content.indexOf(CLADE_END_MARKER, startIdx);
  if (endIdx === -1) return null;

  // CLADE:END マーカー行の末尾まで含める（改行文字も含む）
  const afterEnd = endIdx + CLADE_END_MARKER.length;
  const nextNewline = content.indexOf('\n', afterEnd);
  const sectionEnd = nextNewline === -1 ? content.length : nextNewline + 1;

  return { startIdx, sectionEnd, innerStart: startIdx + CLADE_START_MARKER.length, innerEnd: endIdx };
}

/**
 * CLADE 区間内の "## Global Rules (Clade 管理)" サブセクションを検出し、
 * @rules/NAME.md を冪等追記する。
 *
 * @param {string} content    - CLAUDE.md 全文
 * @param {string} ruleName   - 追記するルール名（拡張子なし）
 * @returns {{ newContent: string, alreadyExists: boolean, markerNotFound: boolean }}
 */
function addRuleToContent(content, ruleName) {
  const section = findCladeSection(content);
  if (!section) {
    return { newContent: content, alreadyExists: false, markerNotFound: true };
  }

  const cladeInner = content.slice(section.innerStart, section.innerEnd);
  const ruleEntry = '@rules/' + ruleName + '.md';

  // 既存エントリチェック（CLADE区間内のみを対象）
  if (cladeInner.includes(ruleEntry)) {
    return { newContent: content, alreadyExists: true, markerNotFound: false };
  }

  // "## Global Rules (Clade 管理)" 見出しを CLADE 区間内から探す
  const headingIdx = cladeInner.indexOf(GLOBAL_RULES_HEADING);
  if (headingIdx === -1) {
    log('Warning: "' + GLOBAL_RULES_HEADING + '" not found inside CLADE section. Appending before CLADE:END.');
    // 見出しが見つからない場合はCLADE:END直前に挿入
    const insertPos = section.innerEnd;
    const before = content.slice(0, insertPos);
    const after = content.slice(insertPos);
    // 末尾の改行を考慮してエントリを挿入
    const prefix = before.endsWith('\n') ? '' : '\n';
    const newContent = before + prefix + ruleEntry + '\n' + after;
    return { newContent, alreadyExists: false, markerNotFound: false };
  }

  // 見出し行の末尾を見つけ、その次の行以降にエントリを追加
  const headingAbsIdx = section.innerStart + headingIdx;
  const headingLineEnd = content.indexOf('\n', headingAbsIdx);

  if (headingLineEnd === -1) {
    // 見出しがファイル末尾にある（異常ケース）
    const newContent = content + '\n' + ruleEntry + '\n';
    return { newContent, alreadyExists: false, markerNotFound: false };
  }

  // 見出し直後のブロック（次の ## 見出しまで or CLADE:END まで）を特定し、
  // そのブロックの末尾に追記する
  // 簡易実装: 見出し行の直後に挿入する
  const insertPos = headingLineEnd + 1;
  const before = content.slice(0, insertPos);
  const after = content.slice(insertPos);
  const newContent = before + ruleEntry + '\n' + after;

  return { newContent, alreadyExists: false, markerNotFound: false };
}

// ---------------------------------------------------------------------------
// サブコマンド: add-rule
// ---------------------------------------------------------------------------

/**
 * add-rule サブコマンドのエントリポイント
 * @param {string[]} args - サブコマンド以降の引数
 */
function commandAddRule(args) {
  const dryRunIdx = args.indexOf('--dry-run');
  const isDryRun = dryRunIdx !== -1;

  // --dry-run フラグを除いた引数リスト
  const positional = args.filter((a, i) => i !== dryRunIdx);
  const ruleName = positional[0];

  if (!ruleName) {
    log('Error: rule name is required. Usage: add-rule NAME [--dry-run]');
    process.exit(1);
  }

  // ルール名のバリデーション（パストラバーサル防止）
  if (ruleName.includes('/') || ruleName.includes('\\') || ruleName.includes('..')) {
    log('Error: invalid rule name "' + ruleName + '"');
    process.exit(1);
  }

  const claudeMdPath = getClaudeMdPath();

  // ファイル読み込み
  let content;
  try {
    content = fs.readFileSync(claudeMdPath, 'utf8');
  } catch (err) {
    log('Error: failed to read ' + claudeMdPath + ': ' + err.message);
    process.exit(1);
  }

  // 追記処理
  const result = addRuleToContent(content, ruleName);

  if (result.markerNotFound) {
    log('CLADE markers not found in ' + claudeMdPath + '. No changes made.');
    process.exit(0);
  }

  if (result.alreadyExists) {
    log('@rules/' + ruleName + '.md already exists in CLADE section. No-op.');
    process.exit(2);
  }

  log('Adding @rules/' + ruleName + '.md to CLADE section in ' + claudeMdPath);

  if (isDryRun) {
    log('[dry-run] Would write the following content:');
    process.stderr.write('--- diff ---\n');
    // dry-run では変更後の内容を stderr に出力して終了
    const lines = result.newContent.split('\n');
    const originalLines = content.split('\n');
    for (let i = 0; i < Math.max(lines.length, originalLines.length); i++) {
      if (lines[i] !== originalLines[i]) {
        if (originalLines[i] !== undefined) process.stderr.write('- ' + originalLines[i] + '\n');
        if (lines[i] !== undefined) process.stderr.write('+ ' + lines[i] + '\n');
      }
    }
    process.stderr.write('--- end diff ---\n');
    process.exit(0);
  }

  // ファイル書き込み
  try {
    fs.writeFileSync(claudeMdPath, result.newContent, 'utf8');
    log('Successfully added @rules/' + ruleName + '.md to CLADE section.');
  } catch (err) {
    log('Error: failed to write ' + claudeMdPath + ': ' + err.message);
    process.exit(1);
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// メインエントリポイント
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (!subcommand) {
    log('Error: subcommand required. Available: add-rule');
    process.exit(1);
  }

  switch (subcommand) {
    case 'add-rule':
      commandAddRule(args.slice(1));
      break;
    default:
      log('Error: unknown subcommand "' + subcommand + '". Available: add-rule');
      process.exit(1);
  }
}

main();
