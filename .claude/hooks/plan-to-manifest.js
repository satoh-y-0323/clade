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

// ===== 引数チェック =====
const planReportPath = process.argv[2];
if (!planReportPath) {
  console.error('Usage: node .claude/hooks/plan-to-manifest.js <plan-report path>');
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
let _lines = [];
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
    result.push(trimmed.slice(2).trim());
    _pos++;
  }
  return result;
}

function parseYaml(text) {
  _lines = text.split('\n');
  _pos   = 0;
  return parseMap(0);
}

// ===== パース & バリデーション =====
const parsed = parseYaml(frontmatter);
if (!parsed.parallel_groups) {
  console.error('Error: 並列グループが定義されていません（parallel_groups キーが見つかりません）');
  process.exit(1);
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

const conflicts = checkWriteConflicts(parsed.parallel_groups);
if (conflicts.length > 0) {
  console.error('Error: 並列グループ間で writes パターンの衝突が検出されました:');
  for (const c of conflicts) {
    console.error(`  [${c.groupA}] "${c.patternA}"  ⟷  [${c.groupB}] "${c.patternB}"`);
  }
  process.exit(1);
}

// ===== マニフェスト生成 =====
function getTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function buildPrompt(group, absolutePlanPath) {
  const agent    = group.agent || 'worktree-developer';
  const readOnly = group.read_only === true;
  const tasks    = Array.isArray(group.tasks) ? group.tasks : [group.tasks];
  const writes   = Array.isArray(group.writes) ? group.writes : [];

  if (readOnly) {
    return [
      `plan-report の ${tasks.join(', ')} をレビューしてください。`,
      `plan-report: ${absolutePlanPath}`,
      `Use the Agent tool with subagent_type "${agent}" and pass the above as prompt.`,
      `Do not ask questions. Execute immediately and exit.`,
    ].join('\n');
  }

  const writesLines = writes.length > 0
    ? writes.map(w => `  - ${w}`).join('\n')
    : '  （なし）';

  return [
    `plan-report の ${tasks.join(', ')} を実装してください。`,
    `plan-report: ${absolutePlanPath}`,
    `担当ファイル範囲（writes）:`,
    writesLines,
    `担当ファイル範囲外への書き込みは行わないこと。`,
    `Use the Agent tool with subagent_type "${agent}" and pass the above as prompt.`,
    `Do not ask questions. Execute immediately and exit.`,
  ].join('\n');
}

function yamlListBlock(items, indent) {
  const pad = ' '.repeat(indent);
  return items.map(item => `${pad}- ${item}`).join('\n');
}

function buildTaskYaml(id, group, absolutePlanPath) {
  const agent          = group.agent || 'worktree-developer';
  const readOnly       = group.read_only === true;
  const writes         = Array.isArray(group.writes) ? group.writes : [];
  const timeoutSec     = typeof group.timeout_sec === 'number' ? group.timeout_sec : 900;
  const idleTimeoutSec = typeof group.idle_timeout_sec === 'number' ? group.idle_timeout_sec : null;
  const prompt         = buildPrompt(group, absolutePlanPath);

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

  yaml += `    read_only: ${readOnly}\n`;
  yaml += `    timeout_sec: ${timeoutSec}`;

  // idle_timeout_sec: read_only: true のタスクには設定しない
  if (!readOnly && idleTimeoutSec !== null) {
    yaml += `\n    idle_timeout_sec: ${idleTimeoutSec}`;
  }

  return yaml;
}

const groups    = parsed.parallel_groups;
const groupKeys = Object.keys(groups);

// pre_implementation を先頭に、残りは定義順で並べる
const orderedKeys = [
  ...groupKeys.filter(k => k === 'pre_implementation'),
  ...groupKeys.filter(k => k !== 'pre_implementation'),
];

const taskYamls = orderedKeys.map(key => buildTaskYaml(key, groups[key], absolutePlanPath));

const manifestContent = [
  '---',
  'clade_plan_version: "0.5"',
  'tasks:',
  taskYamls.join('\n'),
  '---',
  '',
].join('\n');

// ===== 出力 =====
const outputDir = path.resolve('.claude/manifests');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, `manifest-${getTimestamp()}.md`);
fs.writeFileSync(outputPath, manifestContent, 'utf8');

console.log(outputPath);
