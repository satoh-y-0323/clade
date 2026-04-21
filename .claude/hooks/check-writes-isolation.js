#!/usr/bin/env node
// check-writes-isolation.js
// Claude Code hook: PreToolUse (worktree-developer 専用)
// 担当ファイル範囲（writes）外への書き込み・削除をブロック
//
// 仕組み:
//   1. worktree-developer が起動時に .claude/tmp/worktree-writes.json を書く
//   2. このフックがそのファイルを読み、許可パターン外の Write/Edit/rm をブロック
//   3. ファイルが存在しない場合は非並列モードとみなして通過

'use strict';
const fs   = require('fs');
const path = require('path');
const { readHookInput } = require('./hook-utils');

const hookInput = readHookInput();
const toolName  = hookInput.tool_name || '';
const toolInput = hookInput.tool_input || {};

// cwd を検証してから使用する（改ざん対策）
const rawCwd = hookInput.cwd || process.cwd();
if (!path.isAbsolute(rawCwd)) {
  // cwd が相対パスなら不正入力とみなして通過させる（安全側フォールバック）
  process.exit(0);
}
const cwd = path.resolve(rawCwd);

// worktree-writes.json を読む（なければ非並列モード → 通過）
// configPath は cwd から固定パスで算出する（cwd 細工で別ファイルを読まれないよう resolve 済み cwd を使用）
const configPath = path.join(cwd, '.claude', 'tmp', 'worktree-writes.json');

function loadAllowedPatterns(cfgPath) {
  try {
    const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    // config.reads は読み取り制限（将来拡張用）。このフックでは参照しない。
    // 非文字列要素はクラッシュ防止のため除外する
    return Array.isArray(config.writes)
      ? config.writes.filter(p => typeof p === 'string')
      : [];
  } catch (_) {
    return null; // null = 非並列モード
  }
}

const allowedPatterns = loadAllowedPatterns(configPath);
if (allowedPatterns === null || allowedPatterns.length === 0) process.exit(0);

// チェック対象ファイルパスを収集
let targetFiles = [];

if (toolName === 'Write' || toolName === 'Edit') {
  // Write と Edit のどちらも tool_input.file_path を使用する（Claude Code hook 仕様）
  const fp = toolInput.file_path || '';
  if (fp) targetFiles.push(fp);

} else if (toolName === 'Bash') {
  const cmd = toolInput.command || '';
  // rm コマンドのターゲットを抽出（クォート・複数コマンド対応）
  targetFiles = extractRmTargets(cmd);
  if (targetFiles.length === 0) process.exit(0);

} else {
  process.exit(0);
}

// パスの正規化と照合
const normalizedCwd = cwd.replace(/\\/g, '/');
const normalizedCwdSlash = normalizedCwd.endsWith('/') ? normalizedCwd : normalizedCwd + '/';

const violations = [];

for (const rawPath of targetFiles) {
  // 相対パスは cwd を基準に絶対パスへ変換し、.. を解決する
  const absPath = path.isAbsolute(rawPath)
    ? path.normalize(rawPath)
    : path.resolve(cwd, rawPath);

  let fp = absPath.replace(/\\/g, '/');

  // worktree root からの相対パスに変換（worktree 外なら即ブロック）
  if (!fp.startsWith(normalizedCwdSlash)) {
    violations.push({ file: rawPath, reason: 'PATH_OUTSIDE_WORKTREE' });
    continue;
  }
  fp = fp.slice(normalizedCwdSlash.length);

  // .claude/ 配下への書き込みは必要最小限のパスのみ許可する
  // hooks・settings ファイルの改ざんによるフック無効化・権限昇格を防ぐため
  if (fp.startsWith('.claude/')) {
    if (isDangerousClaudePath(fp)) {
      violations.push({ file: rawPath, reason: 'CLAUDE_PROTECTED_PATH' });
    }
    // 危険でない .claude/ 配下は通過
    continue;
  }

  if (!isAllowed(fp, allowedPatterns)) {
    violations.push({ file: rawPath, reason: 'WRITES_ISOLATION_VIOLATION' });
  }
}

if (violations.length > 0) {
  block(violations);
}

process.exit(0);

// ===== ヘルパー関数 =====

/**
 * .claude/ 配下のパスのうち、worktree-developer が書き込んではいけないパスを判定する。
 * hooks・settings ファイルへの書き込みは権限昇格やフック無効化につながるためブロックする。
 */
function isDangerousClaudePath(fp) {
  // .claude/hooks/ 配下のスクリプト改ざん防止
  if (fp.startsWith('.claude/hooks/')) return true;
  // .claude/settings*.json の改ざん防止
  if (/^\.claude\/settings[^/]*\.json$/.test(fp)) return true;
  // worktree-writes.json 自身の書き換えによる許可パターン拡張を防止
  if (fp === '.claude/tmp/worktree-writes.json') return true;
  return false;
}

function isAllowed(filePath, patterns) {
  return patterns.some(pattern => matchGlob(filePath, pattern));
}

/**
 * glob パターンを安全な正規表現に変換してマッチングする。
 *
 * ReDoS 対策:
 *   - パターン長を 200 文字以内に制限する
 *   - ** 以外の連続する * の繰り返しを禁止する（例: a*b*c*d はOK、a*** はNG）
 *   - 変換後の正規表現は線形時間で動作するシンプルな置換のみ使用する
 */
function matchGlob(filePath, pattern) {
  const normalized = filePath.replace(/\\/g, '/');
  const pat        = pattern.replace(/\\/g, '/');

  // ReDoS 対策: パターン長チェック
  if (pat.length > 200) return false;

  // ReDoS 対策: *** 以上の連続 * を禁止する（** は合法、*** 以上は不正）
  if (/\*{3,}/.test(pat)) return false;

  const regexStr = pat
    // 先に glob 特殊文字をプレースホルダーに変換する（正規表現エスケープより前に処理）
    .replace(/\*\*/g, '\x00')    // ** → placeholder-A（任意パス）
    .replace(/\*/g,   '\x01')    // *  → placeholder-B（単一セグメント）
    .replace(/\?/g,   '\x02')    // ?  → placeholder-C（1文字）
    // 正規表現のメタ文字をエスケープ（* ? はプレースホルダー済みなので対象外）
    .replace(/[.+^${}()|[\]-]/g, '\\$&')
    // プレースホルダーを正規表現に変換
    .replace(/\x00/g, '.*')      // ** → 任意パス
    .replace(/\x01/g, '[^/]*')   // *  → 単一セグメント
    .replace(/\x02/g, '[^/]');   // ?  → / 以外の1文字

  return new RegExp('^' + regexStr + '$').test(normalized);
}

/**
 * rm コマンドの引数からターゲットファイルパスを抽出する。
 *
 * アルゴリズム:
 *   1. コマンド文字列全体を tokenizeShellArgs でトークン化する
 *      （クォート内の ; | && を分割対象から外すため、先にトークン化する）
 *   2. トークン列を &&・||・; のトークンで区切り、サブコマンドに分割する
 *   3. 各サブコマンドが rm で始まる場合にターゲットを収集する
 */
function extractRmTargets(cmd) {
  // コマンド全体をクォート対応でトークン化する
  // ここで分割することでクォート内の ; | が誤って区切り文字として扱われなくなる
  const allTokens = tokenizeShellArgs(cmd);

  // トークン列を &&・||・;・| で区切りサブコマンドに分割する
  // | はパイプ（出力リダイレクト）だが、パイプ後のコマンドを rm 引数と誤検出しないよう区切る
  const subcommands = [];
  let current = [];
  for (const token of allTokens) {
    if (token === '&&' || token === '||' || token === ';' || token === '|') {
      if (current.length > 0) {
        subcommands.push(current);
        current = [];
      }
    } else {
      current.push(token);
    }
  }
  if (current.length > 0) subcommands.push(current);

  // リダイレクトトークンかどうかを判定するヘルパー
  // 例: '>', '>>', '<', '2>', '2>>', '1>', '&>' などのスペースあり分離形式
  // スペースなし結合形式（'2>/dev/null' 等）は tokenizeShellArgs がトークン内に含むため
  // isRedirectOperator でスペースあり形式の演算子トークンを認識する
  function isRedirectOperator(token) {
    // 単独の演算子: > >> < &>
    if (/^[0-9]*>>?$/.test(token)) return true;
    if (/^[0-9]*<$/.test(token)) return true;
    if (/^&>>?$/.test(token)) return true;
    return false;
  }

  // リダイレクトが結合形式かどうかを判定するヘルパー
  // 例: '2>/dev/null', '>/tmp/log', '>>/tmp/log', '</dev/stdin'
  // fd 付き・なし・追記・入力のすべてを対象とする
  function isRedirectCombined(token) {
    return /^[0-9]*>>?[^>]/.test(token) || /^[0-9]*<[^<]/.test(token) || /^&>>?[^>]/.test(token);
  }

  const targets = [];

  for (const tokens of subcommands) {
    // rm コマンドで始まるサブコマンドを対象とする
    if (tokens.length === 0 || tokens[0] !== 'rm') continue;

    // rm 以降のトークンを処理する
    // -- 以降はオプション終端なのでダッシュ始まりトークンもファイル名として扱う
    let endOfOptions = false;
    for (let idx = 1; idx < tokens.length; idx++) {
      const token = tokens[idx];
      if (token === '--') {
        // -- はオプション終端マーカー。ファイル名ではないのでスキップする
        endOfOptions = true;
        continue;
      }
      // リダイレクト: スペースあり分離形式（'>' '2>' 等）は演算子トークンを読み飛ばし
      // さらに次のトークン（リダイレクト先ファイル）も読み飛ばす
      if (isRedirectOperator(token)) {
        idx++; // リダイレクト先トークンをスキップ
        continue;
      }
      // リダイレクト: スペースなし結合形式（'2>/dev/null' '>/tmp/log' 等）はトークンごとスキップ
      if (isRedirectCombined(token)) {
        continue;
      }
      if (!endOfOptions && token.startsWith('-')) {
        // -- より前のダッシュ始まりトークンはオプションとして除外する
        continue;
      }
      if (token.length === 0) continue;
      // サブシェル展開 $(...) や変数展開 $VAR を含む場合はスキップ（解析不能）
      if (token.includes('$') || token.includes('`')) continue;
      targets.push(token);
    }
  }

  return targets;
}

/**
 * シェル引数文字列を簡易トークン分割する。
 * シングルクォート・ダブルクォートで囲まれた文字列を1トークンとして扱う。
 * クォート外のバックスラッシュエスケープにも対応する（次の1文字をリテラルとして扱う）。
 * &&・||・; はシェルの演算子として独立したトークンとして返す。
 */
function tokenizeShellArgs(argsStr) {
  const tokens = [];
  let current = '';
  let i = 0;

  while (i < argsStr.length) {
    const ch = argsStr[i];

    if (ch === "'") {
      // シングルクォート: 次の ' まで（未終端の場合は文字列末尾まで）
      i++;
      while (i < argsStr.length && argsStr[i] !== "'") {
        current += argsStr[i];
        i++;
      }
      if (i < argsStr.length) i++; // 閉じクォートをスキップ（存在する場合のみ）

    } else if (ch === '"') {
      // ダブルクォート: 次の " まで（バックスラッシュエスケープを考慮）
      i++;
      while (i < argsStr.length && argsStr[i] !== '"') {
        if (argsStr[i] === '\\' && i + 1 < argsStr.length) {
          i++; // バックスラッシュをスキップ
          current += argsStr[i];
        } else {
          current += argsStr[i];
        }
        i++;
      }
      if (i < argsStr.length) i++; // 閉じクォートをスキップ（存在する場合のみ）

    } else if (ch === '\\') {
      // クォート外のバックスラッシュエスケープ: 次の1文字をリテラルとして扱う
      // （例: rm file\ name.txt → "file name.txt" という1トークンにする）
      if (i + 1 < argsStr.length) {
        i++;
        current += argsStr[i];
      }
      i++;

    } else if (ch === '&' && i + 1 < argsStr.length && argsStr[i + 1] === '&') {
      // && を独立したトークンとして切り出す
      if (current.length > 0) { tokens.push(current); current = ''; }
      tokens.push('&&');
      i += 2;

    } else if (ch === '|' && i + 1 < argsStr.length && argsStr[i + 1] === '|') {
      // || を独立したトークンとして切り出す
      if (current.length > 0) { tokens.push(current); current = ''; }
      tokens.push('||');
      i += 2;

    } else if (ch === ';') {
      // ; を独立したトークンとして切り出す
      if (current.length > 0) { tokens.push(current); current = ''; }
      tokens.push(';');
      i++;

    } else if (ch === ' ' || ch === '\t') {
      // スペース: トークン区切り
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      i++;

    } else {
      current += ch;
      i++;
    }
  }

  if (current.length > 0) tokens.push(current);
  return tokens;
}

function block(violations) {
  // allowed_patterns はセキュリティ上 stderr に出力しない（バイパス情報漏洩防止）
  const msg = JSON.stringify({
    violations: violations.map(v => ({ type: v.reason, file: v.file })),
    action: 'BLOCKED',
  });
  process.stderr.write(msg + '\n');
  process.exit(2);
}
