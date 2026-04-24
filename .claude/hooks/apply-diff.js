#!/usr/bin/env node
/**
 * apply-diff.js
 * 対話的更新対象ファイル（settings.json / settings.local.json 等）の
 * .new ファイルを target に反映し、.new を削除する。
 *
 * 使用例:
 *   node .claude/hooks/apply-diff.js --target .claude/settings.json \
 *                                    --new    .claude/settings.json.new
 *
 * 動作:
 *   1. --new のファイルが存在しない場合はエラー終了
 *   2. --new の内容で --target を上書き（ファイルがなければ新規作成）
 *   3. --new を削除
 *   4. 結果を標準出力に表示
 */

'use strict';

const fs = require('fs');
const path = require('path');

function usageAndExit() {
  console.error('使い方: node apply-diff.js --target <targetPath> --new <newPath>');
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  const targetIdx = args.indexOf('--target');
  const newIdx = args.indexOf('--new');

  if (targetIdx === -1 || newIdx === -1 ||
      !args[targetIdx + 1] || args[targetIdx + 1].startsWith('--') ||
      !args[newIdx + 1]    || args[newIdx + 1].startsWith('--')) {
    usageAndExit();
  }

  const targetPath = args[targetIdx + 1];
  const newPath = args[newIdx + 1];

  // パストラバーサル対策: プロジェクトルート配下のみ許可
  const allowedRoot = path.resolve(process.cwd());

  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(allowedRoot + path.sep) && resolvedTarget !== allowedRoot) {
    console.error('[apply-diff] リポジトリ外へのパスは指定できません（--target）。');
    process.exit(1);
  }

  const resolvedNew = path.resolve(newPath);
  if (!resolvedNew.startsWith(allowedRoot + path.sep) && resolvedNew !== allowedRoot) {
    console.error('[apply-diff] リポジトリ外へのパスは指定できません（--new）。');
    process.exit(1);
  }

  if (!fs.existsSync(resolvedNew)) {
    console.error(`[apply-diff] .new ファイルが見つかりません: ${newPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(resolvedNew, 'utf8');
  fs.mkdirSync(path.dirname(resolvedTarget), { recursive: true });
  fs.writeFileSync(resolvedTarget, content, 'utf8');

  try {
    fs.unlinkSync(resolvedNew);
  } catch (error) {
    console.error(`[apply-diff] .new ファイルの削除に失敗しました: ${newPath} (${error.message})`);
    process.exit(1);
  }

  const relative = path.relative(process.cwd(), resolvedTarget).replace(/\\/g, '/');
  console.log(`[apply-diff] 上書き完了: ${relative}`);
}

main();
