#!/usr/bin/env node
// plan-to-manifest.js
// plan-report の YAML フロントマターを読み取り、clade-parallel 用 manifest.md を生成する
//
// 使い方:
//   node .claude/hooks/plan-to-manifest.js <plan-report パス>
//   → .claude/manifests/manifest-YYYYMMDD-HHmmss.md を生成し、パスを標準出力に表示

'use strict';
const fs   = require('fs');
const path = require('path');

// ===== scale → timeout マッピング表（一元管理） =====
const SCALE_TIMEOUTS = {
  developer: {
    small:  { timeout_sec: 3000,  idle_timeout_sec: 2400 },
    medium: { timeout_sec: 6000,  idle_timeout_sec: 3600 },
    large:  { timeout_sec: 12000, idle_timeout_sec: 4800 },
  },
  reviewer: {
    // reviewer は idle_timeout_sec を設定しない（runner.py が read_only で強制 None にする）
    small:  { timeout_sec: 3000 },
    medium: { timeout_sec: 9000 },
    large:  { timeout_sec: 45000 },
  },
};

const DEFAULT_SCALE = 'medium';
const VALID_SCALES  = ['small', 'medium', 'large'];

// ===== 引数チェック =====
let planReportPath = null;
let phaseFilter = null;

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--phase' && i + 1 < args.length) {
    phaseFilter = args[++i];
  } else if (args[i].startsWith('--phase=')) {
    phaseFilter = args[i].slice('--phase='.length);
  } else {
    planReportPath = args[i];
  }
}

if (!planReportPath) {
  console.error('Usage: node .claude/hooks/plan-to-manifest.js [--phase developer|reviewer] <plan-report path>');
  process.exit(1);
}

const VALID_PHASES = ['developer', 'reviewer'];
if (phaseFilter !== null && !VALID_PHASES.includes(phaseFilter)) {
  console.error(`Error: 不明な --phase 値: "${phaseFilter}". 有効値: developer, reviewer`);
  process.exit(1);
}

if (planReportPath.includes('\0')) {
  console.error('Error: パスにヌルバイトが含まれています');
  process.exit(1);
}

const absolutePlanPath = path.resolve(planReportPath);
if (!fs.existsSync(absolutePlanPath)) {
  console.error(`Error: plan-report not found: ${absolutePlanPath}`);
  process.exit(1);
}

// ===== フロントマター抽出 =====
const content = fs.readFileSync(absolutePlanPath, 'utf8');

function extractFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

const frontmatter = extractFrontmatter(content);
if (!frontmatter) {
  console.error('Error: YAML フロントマターが見つかりません');
  process.exit(1);
}

// ===== シンプル YAML パーサー（標準モジュールのみ） =====
// 既知の制限:
//   - parseList は "- value" 形式のスカラーリストのみ対応。
//     "- key: value" 形式の list-of-maps は未対応（文字列として積まれる）。
//     現行の plan-report フォーマットでは list-of-maps を使用していないため
//     実害はないが、将来のスキーマ拡張時には parseList の拡張が必要になる。
//   - parseScalar のインラインリスト解析 ([a, b, c]) は単純な split(',') を使用。
//     要素値にカンマが含まれるケースは正しく解析されない。
//     現行スキーマではカンマ入り文字列は使用されていないため実害なし。
//   - parseScalar のインラインコメント除去（' #' パターン）は
//     クォートなし文字列値に ' #' が含まれる（例: URL フラグメントを含む値）ケースを未考慮。
//     現行スキーマでは該当フィールドなし。
//   - (security) 自作パーサーは list-of-maps 未対応のため、plan-report フォーマットが
//     今後拡張される場合はフィールドが無音で誤解析される可能性がある。
//     スキーマ拡張時は js-yaml 等の標準ライブラリへの置き換えを検討すること。

function parseYaml(text) {
  // _lines と _pos を parseYaml のローカルスコープに閉じ込めることで
  // 複数回呼び出し時の状態干渉を防ぐ
  let _lines = text.split('\n');
  let _pos   = 0;

  function currentLine() {
    while (_pos < _lines.length && (_lines[_pos].trim() === '' || _lines[_pos].trim().startsWith('#'))) {
      _pos++;
    }
    return _pos < _lines.length ? _lines[_pos] : null;
  }

  function getIndent(line) {
    if (!line) return -1;
    return line.match(/^( *)/)[1].length;
  }

  function parseScalar(s) {
    s = s.trim();
    // クォートされていない場合のみインラインコメントを除去
    if (!s.startsWith('"') && !s.startsWith("'")) {
      const commentIdx = s.indexOf(' #');
      if (commentIdx !== -1) s = s.slice(0, commentIdx).trim();
    }
    if (s.startsWith('[') && s.endsWith(']')) {
      const inner = s.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(',').map(x => x.trim()).filter(Boolean);
    }
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    return s;
  }

  function parseMap(baseIndent) {
    const result = {};
    while (true) {
      const line = currentLine();
      if (!line) break;
      const indent = getIndent(line);
      if (indent < baseIndent) break;
      if (indent > baseIndent) { _pos++; continue; }

      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) break;

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) { _pos++; continue; }

      const key  = trimmed.slice(0, colonIdx).trim();
      const rest = trimmed.slice(colonIdx + 1).trim();
      _pos++;

      if (rest === '') {
        const next = currentLine();
        if (!next) { result[key] = {}; continue; }
        const nextIndent = getIndent(next);
        if (nextIndent <= baseIndent) { result[key] = {}; continue; }
        result[key] = next.trim().startsWith('- ')
          ? parseList(nextIndent)
          : parseMap(nextIndent);
      } else {
        result[key] = parseScalar(rest);
      }
    }
    return result;
  }

  function parseList(baseIndent) {
    const result = [];
    while (true) {
      const line = currentLine();
      if (!line) break;
      const indent = getIndent(line);
      if (indent < baseIndent) break;
      const trimmed = line.trim();
      if (!trimmed.startsWith('- ')) break;
      // 注意: list-of-maps ("- key: value" 形式) は未対応（既知の制限）。
      // スカラー文字列として積む。
      result.push(trimmed.slice(2).trim());
      _pos++;
    }
    return result;
  }

  return parseMap(0);
}

function filterGroupsByPhase(groups, filter) {
  if (filter === null) return groups;
  const filtered = {};
  for (const [id, group] of Object.entries(groups)) {
    const groupPhase = group.phase == null ? 'developer' : group.phase;
    if (groupPhase === filter) filtered[id] = group;
  }
  return filtered;
}

/**
 * group の phase と phase_scales から、使用すべき scale を決定する
 * @param {object} group - parallel_groups 内のグループ定義
 * @param {object} phaseScales - plan-report の phase_scales マップ（未指定時は {}）
 * @returns {string} - 'small' | 'medium' | 'large'
 */
function resolveScale(group, phaseScales) {
  const phase = group.phase || 'developer';
  const scale = phaseScales[phase];
  if (scale && VALID_SCALES.includes(scale)) return scale;
  if (scale) {
    console.warn(`Warning: phase_scales.${phase} の値 "${scale}" は無効です。"medium" にフォールバックします。有効値: ${VALID_SCALES.join(', ')}`);
  }
  return DEFAULT_SCALE;
}

/**
 * group の phase と scale から、timeout_sec と idle_timeout_sec を解決する
 * 優先順位: group 直書き > phase_scales 由来 > medium デフォルト
 * @param {object} group
 * @param {object} phaseScales
 * @returns {{ timeoutSec: number, idleTimeoutSec: number | null }}
 */
function resolveTimeouts(group, phaseScales) {
  const phase  = group.phase || 'developer';
  const scale  = resolveScale(group, phaseScales);
  const mapped = (SCALE_TIMEOUTS[phase] && SCALE_TIMEOUTS[phase][scale]) || {};

  const timeoutSec = typeof group.timeout_sec === 'number'
    ? group.timeout_sec
    : (typeof mapped.timeout_sec === 'number' ? mapped.timeout_sec : 900);

  // reviewer は idle_timeout_sec を出さない（mapped.idle_timeout_sec が undefined のため自然に null）
  const idleTimeoutSec = typeof group.idle_timeout_sec === 'number'
    ? group.idle_timeout_sec
    : (typeof mapped.idle_timeout_sec === 'number' ? mapped.idle_timeout_sec : null);

  return { timeoutSec, idleTimeoutSec };
}

// ===== パース & バリデーション =====
const parsed = parseYaml(frontmatter);
if (!parsed.parallel_groups) {
  console.error('Error: 並列グループが定義されていません（parallel_groups キーが見つかりません）');
  process.exit(1);
}

const phaseScales = (parsed.phase_scales && typeof parsed.phase_scales === 'object')
  ? parsed.phase_scales
  : {};

// concurrency_limits: フロントマターのトップレベルから読み取る
// 例: { 'claude-api': 3, 'db-write': 1 }
const concurrencyLimits = (parsed.concurrency_limits && typeof parsed.concurrency_limits === 'object')
  ? parsed.concurrency_limits
  : {};

const groups = filterGroupsByPhase(parsed.parallel_groups, phaseFilter);
if (Object.keys(groups).length === 0) {
  console.error(`[plan-to-manifest] No groups matched phase="${phaseFilter || '(all)'}". Exiting with 0.`);
  process.exit(0);
}

// ===== 静的衝突チェック =====

function hasWildcard(pattern) {
  return pattern.includes('*') || pattern.includes('?');
}

function getFixedPrefix(pattern) {
  const p = pattern.replace(/\\/g, '/');
  const starIdx = p.includes('*') ? p.indexOf('*') : Infinity;
  const questIdx = p.includes('?') ? p.indexOf('?') : Infinity;
  const idx = Math.min(starIdx, questIdx);
  return idx === Infinity ? p : p.slice(0, idx);
}

// check-writes-isolation.js と同じロジック（依存なしで再実装）
function matchGlob(filePath, pattern) {
  const normalized = filePath.replace(/\\/g, '/');
  const pat        = pattern.replace(/\\/g, '/');
  if (pat.length > 200) return false;
  if (/\*{3,}/.test(pat)) return false;
  const regexStr = pat
    .replace(/\*\*/g, '\x00')
    .replace(/\*/g,   '\x01')
    .replace(/\?/g,   '\x02')
    .replace(/[.+^${}()|[\]-]/g, '\\$&')
    .replace(/\x00/g, '.*')
    .replace(/\x01/g, '[^/]*')
    .replace(/\x02/g, '[^/]');
  return new RegExp('^' + regexStr + '$').test(normalized);
}

function patternsConflict(p1, p2) {
  const n1 = p1.replace(/\\/g, '/');
  const n2 = p2.replace(/\\/g, '/');
  if (n1 === n2) return true;
  // 一方が具体パス → 他方の glob にマッチするか
  if (!hasWildcard(n1) && matchGlob(n1, n2)) return true;
  if (!hasWildcard(n2) && matchGlob(n2, n1)) return true;
  // 両方ワイルドカードあり → 固定プレフィックスの包含関係で判定
  // 注意: 保守的な判定（偽陽性あり）。例: src/** と src/a/** は衝突と判定されるが
  // 実際の書き込みは分離されている場合がある。安全側に倒した設計で意図的。
  if (hasWildcard(n1) && hasWildcard(n2)) {
    const prefix1 = getFixedPrefix(n1);
    const prefix2 = getFixedPrefix(n2);
    return prefix1.startsWith(prefix2) || prefix2.startsWith(prefix1);
  }
  return false;
}

function checkWriteConflicts(groups) {
  const entries = Object.entries(groups)
    .filter(([id, group]) => group.read_only !== true)
    .map(([id, group]) => ({
      id,
      writes: Array.isArray(group.writes) ? group.writes : [],
    }));

  const conflicts = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      for (const pa of a.writes) {
        for (const pb of b.writes) {
          if (patternsConflict(pa, pb)) {
            conflicts.push({ groupA: a.id, groupB: b.id, patternA: pa, patternB: pb });
          }
        }
      }
    }
  }
  return conflicts;
}

const conflicts = checkWriteConflicts(groups);
if (conflicts.length > 0) {
  console.error('Error: 並列グループ間で writes パターンの衝突が検出されました:');
  for (const c of conflicts) {
    console.error(`  [${c.groupA}] "${c.patternA}"  ⟷  [${c.groupB}] "${c.patternB}"`);
  }
  process.exit(1);
}

// ===== マニフェスト生成 =====
function getTimestamp() {
  // ローカル時刻ベース（write-report.js と統一。UTCへの変更は両スクリプト同時に行うこと）
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * plan-report のタイムスタンプを基準に、現時点で存在するレポートの絶対パスを返す。
 * worktree-developer の prompt に埋め込むことで、起動時の Glob を不要にする。
 *
 * @param {string} absolutePlanPath - plan-report の絶対パス
 * @returns {{ requirements: string|null, architecture: string|null,
 *             test: string|null, codeReview: string|null, securityReview: string|null }}
 */
function findReportPaths(absolutePlanPath) {
  // __dirname ベースで解決することで cwd 変更の影響を受けない（clade-parallel サブプロセス対策）
  const reportsDir = path.resolve(__dirname, '../reports');
  const empty = { requirements: null, architecture: null, test: null, codeReview: null, securityReview: null };
  if (!fs.existsSync(reportsDir)) return empty;

  // plan-report-YYYYMMDD-HHmmss.md → YYYYMMDD-HHmmss
  const planBase  = path.basename(absolutePlanPath, '.md');
  const tsMatch   = planBase.match(/^plan-report-(\d{8}-\d{6})$/);
  const planTs    = tsMatch ? tsMatch[1] : null;

  let files;
  try {
    files = fs.readdirSync(reportsDir);
  } catch {
    console.warn('[plan-to-manifest] Warning: reports ディレクトリの読み取りに失敗しました');
    return empty;
  }

  function latestOf(baseName) {
    const matched = files
      .filter(f => f.startsWith(baseName + '-') && f.endsWith('.md'))
      .sort().reverse();
    return matched.length > 0 ? path.join(reportsDir, matched[0]) : null;
  }

  function latestAfter(baseName) {
    if (!planTs) return null;
    const matched = files
      .filter(f => {
        if (!f.startsWith(baseName + '-') || !f.endsWith('.md')) return false;
        const ts = f.slice(baseName.length + 1, -3);
        return /^\d{8}-\d{6}$/.test(ts) && ts > planTs;
      })
      .sort().reverse();
    return matched.length > 0 ? path.join(reportsDir, matched[0]) : null;
  }

  return {
    requirements:   latestOf('requirements-report'),
    architecture:   latestOf('architecture-report'),
    test:           latestAfter('test-report'),
    codeReview:     latestAfter('code-review-report'),
    securityReview: latestAfter('security-review-report'),
  };
}

/**
 * グループのフィールドから適切な manifest バージョンを決定する。
 * - concurrency_group が存在する場合: '0.7'
 * - retry_delay_sec / retry_backoff_factor が存在する場合: '0.5'
 * - それ以外: '0.4'
 * @param {object} groups - parallel_groups のマップ
 * @returns {string} - '0.7' | '0.5' | '0.4'
 */
function resolveManifestVersion(groups) {
  // v0.7: concurrency_group が1つでも存在する場合
  const hasConcurrencyGroup = Object.values(groups).some(
    g => typeof g.concurrency_group === 'string' && g.concurrency_group.length > 0
  );
  if (hasConcurrencyGroup) return '0.7';

  // v0.5: retry_delay_sec / retry_backoff_factor が存在する場合
  const hasBackoffFields = Object.values(groups).some(
    g => (typeof g.retry_delay_sec === 'number' && g.retry_delay_sec > 0) ||
         (typeof g.retry_backoff_factor === 'number' && g.retry_backoff_factor > 1.0)
  );
  return hasBackoffFields ? '0.5' : '0.4';
}

function buildPrompt(group, absolutePlanPath, reportPaths) {
  const agent    = group.agent || 'worktree-developer';
  const readOnly = group.read_only === true;
  const tasks    = Array.isArray(group.tasks)
    ? group.tasks
    : (group.tasks != null ? [group.tasks] : []);
  if (tasks.length === 0) {
    console.warn(`[buildPrompt] Group "${group.agent || 'unknown'}" has no tasks defined. Check "tasks:" field in plan-report.`);
  }
  const writes   = Array.isArray(group.writes) ? group.writes : [];

  if (readOnly) {
    const reportBaseNames = {
      'code-reviewer':     'code-review-report',
      'security-reviewer': 'security-review-report',
    };
    const reportBaseName = reportBaseNames[agent] || `${agent}-report`;
    // """ デリミタ内へのパス直接埋め込み対策: パス内の """ を ''' に置換
    const safePlanPath = absolutePlanPath.replace(/"""/g, "'''").replace(/[\r\n]/g, '');

    return [
      `Use the Agent tool with subagent_type "${agent}" to review the code.`,
      `Pass the following prompt to the subagent:`,
      ``,
      `"""`,
      `## 作業依頼`,
      `${reportBaseName} の作成（自動実行）`,
      ``,
      `## plan-report`,
      `${safePlanPath}`,
      ``,
      `## レビュー対象タスク`,
      `${tasks.join(', ')}`,
      ``,
      `## 特記事項`,
      `自動実行（非対話モード）のため Q&A は不要。デフォルト設定で進めてください。`,
      ``,
      `## 出力指示`,
      `\`.claude/skills/agents/report-output-common.md\` の「レポート出力フロー（共通）」に従って以下の順で実行すること:`,
      `1. \`node .claude/hooks/clear-tmp-file.js --path .claude/tmp/${reportBaseName}.md\` で tmp を事前削除`,
      `2. Write ツールで \`.claude/tmp/${reportBaseName}.md\` にレポート全文を書き込む（heredoc 禁止）`,
      `3. \`node .claude/hooks/write-report.js ${reportBaseName} new --file .claude/tmp/${reportBaseName}.md\` で実レポートに保存`,
      `- 最終メッセージに write-report.js が出力した実レポートファイルパス（\`.claude/reports/${reportBaseName}-YYYYMMDD-HHmmss.md\`）を必ず含めること`,
      `- レポート生成後は終了すること`,
      `"""`,
      ``,
      `Do not ask any clarifying questions. Do not wait for approval. Invoke the subagent immediately with the above prompt and exit after the subagent completes.`,
    ].join('\n');
  }

  const writesLines = writes.length > 0
    ? writes.map(w => `  - ${w}`).join('\n')
    : '  （なし）';

  // 存在するレポートの絶対パスを列挙する（worktree-developer 側の Glob を不要にする）
  const reportLines = [];
  if (reportPaths.requirements)   reportLines.push(`- requirements-report: ${reportPaths.requirements}`);
  if (reportPaths.architecture)   reportLines.push(`- architecture-report: ${reportPaths.architecture}`);
  if (reportPaths.test)           reportLines.push(`- test-report（現サイクル）: ${reportPaths.test}`);
  if (reportPaths.codeReview)     reportLines.push(`- code-review-report（現サイクル）: ${reportPaths.codeReview}`);
  if (reportPaths.securityReview) reportLines.push(`- security-review-report（現サイクル）: ${reportPaths.securityReview}`);

  const parts = [
    `plan-report の ${tasks.join(', ')} を実装してください。`,
    `plan-report: ${absolutePlanPath}`,
  ];
  if (reportLines.length > 0) {
    parts.push(`読み込むレポート（絶対パス）:\n${reportLines.join('\n')}`);
  }
  parts.push(
    `担当ファイル範囲（writes）:`,
    writesLines,
    `担当ファイル範囲外への書き込みは行わないこと。`,
    `Use the Agent tool with subagent_type "${agent}" and pass the above as prompt.`,
    `Do not ask questions. Execute immediately and exit.`,
  );

  return parts.join('\n');
}

function yamlListBlock(items, indent) {
  const pad = ' '.repeat(indent);
  return items.map(item => `${pad}- ${item}`).join('\n');
}

function buildTaskYaml(id, group, absolutePlanPath, phaseScales, reportPaths) {
  const agent                     = group.agent || 'worktree-developer';
  const readOnly                  = group.read_only === true;
  const writes                    = Array.isArray(group.writes) ? group.writes : [];
  const { timeoutSec, idleTimeoutSec } = resolveTimeouts(group, phaseScales);
  const prompt                    = buildPrompt(group, absolutePlanPath, reportPaths);

  // プロンプト: 6スペースでインデント（tasks > list item > prompt key の下）
  const promptIndented = prompt.split('\n').map(l => `      ${l}`).join('\n');

  let yaml = `  - id: ${id}\n    agent: ${agent}\n`;

  // depends_on（pre_implementation は除外、他は group.depends_on を使用）
  if (id !== 'pre_implementation' && group.depends_on) {
    const deps = Array.isArray(group.depends_on) ? group.depends_on : [group.depends_on];
    yaml += `    depends_on:\n${yamlListBlock(deps, 6)}\n`;
  }

  yaml += `    prompt: |\n${promptIndented}\n`;

  if (!readOnly) {
    const writesYaml = writes.length > 0
      ? `    writes:\n${yamlListBlock(writes, 6)}`
      : `    writes: []`;
    yaml += `${writesYaml}\n`;
  }

  // read_only タスクはマニフェストのディレクトリ（.claude/manifests/）ではなく
  // リポジトリルートから実行する必要がある（write-report.js が process.cwd() を使うため）
  if (readOnly) {
    yaml += `    cwd: ../..` + '\n';
  }

  yaml += `    read_only: ${readOnly}\n`;
  yaml += `    timeout_sec: ${timeoutSec}`;  // 末尾 \n なし（taskYamls.join('\n') で区切り行が入る）

  // idle_timeout_sec: read_only: true のタスクには設定しない
  if (!readOnly && idleTimeoutSec !== null) {
    yaml += `\n    idle_timeout_sec: ${idleTimeoutSec}`;
  }

  // max_retries: 省略時は出力しない（デフォルト 0）
  if (typeof group.max_retries === 'number' && group.max_retries > 0) {
    yaml += `\n    max_retries: ${group.max_retries}`;
  }
  // retry_delay_sec / retry_backoff_factor: manifest v0.5 以降（省略時は出力しない）
  if (typeof group.retry_delay_sec === 'number' && group.retry_delay_sec > 0) {
    yaml += `\n    retry_delay_sec: ${group.retry_delay_sec}`;
  }
  if (typeof group.retry_backoff_factor === 'number' && group.retry_backoff_factor > 1.0) {
    yaml += `\n    retry_backoff_factor: ${group.retry_backoff_factor}`;
  }
  // concurrency_group: manifest v0.7 以降（省略時は出力しない）
  if (typeof group.concurrency_group === 'string' && group.concurrency_group.length > 0) {
    yaml += `\n    concurrency_group: ${group.concurrency_group}`;
  }

  return yaml;
}

const groupKeys = Object.keys(groups);

// pre_implementation を先頭に、残りは定義順で並べる
const orderedKeys = [
  ...groupKeys.filter(k => k === 'pre_implementation'),
  ...groupKeys.filter(k => k !== 'pre_implementation'),
];

const reportPaths = findReportPaths(absolutePlanPath);
const taskYamls = orderedKeys.map(key => buildTaskYaml(key, groups[key], absolutePlanPath, phaseScales, reportPaths));

const manifestVersion = resolveManifestVersion(groups);

// フィルタリング後のグループで実際に使われる concurrency_group のみ抽出
const usedConcurrencyGroups = new Set(
  Object.values(groups)
    .filter(g => typeof g.concurrency_group === 'string' && g.concurrency_group.length > 0)
    .map(g => g.concurrency_group)
);
const filteredConcurrencyLimits = Object.fromEntries(
  Object.entries(concurrencyLimits).filter(([group]) => usedConcurrencyGroups.has(group))
);

// 実際に使われるグループのみトップレベルセクションを出力
const concurrencyLimitsYaml = Object.keys(filteredConcurrencyLimits).length > 0
  ? 'concurrency_limits:\n' + Object.entries(filteredConcurrencyLimits)
      .map(([group, limit]) => `  ${group}: ${limit}`)
      .join('\n') + '\n'
  : '';

const manifestContent = [
  '---',
  `clade_plan_version: "${manifestVersion}"`,
  concurrencyLimitsYaml ? concurrencyLimitsYaml.trimEnd() : null,
  'tasks:',
  taskYamls.join('\n'),
  '---',
  '',
].filter(line => line !== null)  // concurrencyLimits が空の場合のセクションをスキップ
  .join('\n');

// ===== 出力 =====
const outputDir = path.resolve(__dirname, '../manifests');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const phaseSuffix = phaseFilter ? `-${phaseFilter}` : '';
const outputPath = path.join(outputDir, `manifest${phaseSuffix}-${getTimestamp()}.md`);
fs.writeFileSync(outputPath, manifestContent, 'utf8');

console.log(outputPath);
