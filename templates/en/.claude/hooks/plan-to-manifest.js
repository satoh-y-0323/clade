#!/usr/bin/env node
// plan-to-manifest.js
// Reads the YAML frontmatter from a plan-report and generates a clade-parallel manifest.md
//
// Usage:
//   node .claude/hooks/plan-to-manifest.js <plan-report path>
//   → generates .claude/manifests/manifest-YYYYMMDD-HHmmss.md and prints the path to stdout

'use strict';
const fs   = require('fs');
const path = require('path');

// ===== scale → timeout mapping table (single source of truth) =====
const SCALE_TIMEOUTS = {
  developer: {
    small:  { timeout_sec: 3000,  idle_timeout_sec: 2400 },
    medium: { timeout_sec: 6000,  idle_timeout_sec: 3600 },
    large:  { timeout_sec: 12000, idle_timeout_sec: 4800 },
  },
  reviewer: {
    // reviewer does not set idle_timeout_sec (runner.py forces it to None for read_only tasks)
    small:  { timeout_sec: 3000 },
    medium: { timeout_sec: 9000 },
    large:  { timeout_sec: 45000 },
  },
};

const DEFAULT_SCALE = 'medium';
const VALID_SCALES  = ['small', 'medium', 'large'];

// ===== Argument check =====
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
  console.error(`Error: Unknown --phase value: "${phaseFilter}". Valid values: developer, reviewer`);
  process.exit(1);
}

const absolutePlanPath = path.resolve(planReportPath);
if (!fs.existsSync(absolutePlanPath)) {
  console.error(`Error: plan-report not found: ${absolutePlanPath}`);
  process.exit(1);
}

// ===== Extract frontmatter =====
const content = fs.readFileSync(absolutePlanPath, 'utf8');

function extractFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

const frontmatter = extractFrontmatter(content);
if (!frontmatter) {
  console.error('Error: YAML frontmatter not found');
  process.exit(1);
}

// ===== Simple YAML parser (standard modules only) =====
// Known limitations:
//   - parseList only handles scalar lists ("- value" form).
//     List-of-maps ("- key: value" form) is not supported — items are stored as strings.
//     The current plan-report format does not use list-of-maps, so there is no practical
//     impact, but parseList will need to be extended if the schema is expanded in the future.
//   - Inline list parsing in parseScalar ([a, b, c]) uses a simple split(',').
//     Elements whose values contain commas are not parsed correctly.
//     The current schema does not use comma-containing values, so there is no practical impact.

function parseYaml(text) {
  // _lines and _pos are scoped inside parseYaml as closure variables to prevent
  // state leakage between multiple calls.
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
    // Strip inline comments only when the value is not quoted
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
      // Note: list-of-maps ("- key: value" form) is not supported (known limitation).
      // Items are stored as plain strings.
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
 * Determine the scale to use based on the group's phase and phase_scales.
 * @param {object} group - Group definition from parallel_groups
 * @param {object} phaseScales - phase_scales map from plan-report (defaults to {})
 * @returns {string} - 'small' | 'medium' | 'large'
 */
function resolveScale(group, phaseScales) {
  const phase = group.phase || 'developer';
  const scale = phaseScales[phase];
  if (scale && VALID_SCALES.includes(scale)) return scale;
  if (scale) {
    console.warn(`Warning: phase_scales.${phase} value "${scale}" is invalid. Falling back to "medium". Valid values: ${VALID_SCALES.join(', ')}`);
  }
  return DEFAULT_SCALE;
}

/**
 * Resolve timeout_sec and idle_timeout_sec from the group's phase and scale.
 * Priority: group direct value > phase_scales-derived value > medium default
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

  // reviewer does not emit idle_timeout_sec (mapped.idle_timeout_sec is undefined → naturally null)
  const idleTimeoutSec = typeof group.idle_timeout_sec === 'number'
    ? group.idle_timeout_sec
    : (typeof mapped.idle_timeout_sec === 'number' ? mapped.idle_timeout_sec : null);

  return { timeoutSec, idleTimeoutSec };
}

// ===== Parse & validate =====
const parsed = parseYaml(frontmatter);
if (!parsed.parallel_groups) {
  console.error('Error: No parallel groups defined (parallel_groups key not found)');
  process.exit(1);
}

const phaseScales = (parsed.phase_scales && typeof parsed.phase_scales === 'object')
  ? parsed.phase_scales
  : {};

const groups = filterGroupsByPhase(parsed.parallel_groups, phaseFilter);
if (Object.keys(groups).length === 0) {
  process.exit(0);
}

// ===== Static conflict check =====

function hasWildcard(p) { return p.includes('*') || p.includes('?'); }

function getFixedPrefix(pattern) {
  const p = pattern.replace(/\\/g, '/');
  const starIdx = p.includes('*') ? p.indexOf('*') : Infinity;
  const questIdx = p.includes('?') ? p.indexOf('?') : Infinity;
  const idx = Math.min(starIdx, questIdx);
  return idx === Infinity ? p : p.slice(0, idx);
}

// Same logic as check-writes-isolation.js (reimplemented without dependency)
function matchGlob(filePath, pattern) {
  const normalized = filePath.replace(/\\/g, '/');
  const pat        = pattern.replace(/\\/g, '/');
  if (pat.length > 200) return false;
  if (/\*{3,}/.test(pat)) return false;
  const regexStr = pat
    .replace(/\*\*/g, '\x00').replace(/\*/g, '\x01').replace(/\?/g, '\x02')
    .replace(/[.+^${}()|[\]-]/g, '\\$&')
    .replace(/\x00/g, '.*').replace(/\x01/g, '[^/]*').replace(/\x02/g, '[^/]');
  return new RegExp('^' + regexStr + '$').test(normalized);
}

function patternsConflict(p1, p2) {
  const n1 = p1.replace(/\\/g, '/'), n2 = p2.replace(/\\/g, '/');
  if (n1 === n2) return true;
  // One is a concrete path matched by the other's glob
  if (!hasWildcard(n1) && matchGlob(n1, n2)) return true;
  if (!hasWildcard(n2) && matchGlob(n2, n1)) return true;
  // Both have wildcards: check if fixed prefixes overlap
  if (hasWildcard(n1) && hasWildcard(n2)) {
    const pref1 = getFixedPrefix(n1), pref2 = getFixedPrefix(n2);
    return pref1.startsWith(pref2) || pref2.startsWith(pref1);
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
      const a = entries[i], b = entries[j];
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
  console.error('Error: Write pattern conflicts detected between parallel groups:');
  for (const c of conflicts) {
    console.error(`  [${c.groupA}] "${c.patternA}"  ⟷  [${c.groupB}] "${c.patternB}"`);
  }
  process.exit(1);
}

// ===== Generate manifest =====
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
    const reportBaseNames = {
      'code-reviewer':     'code-review-report',
      'security-reviewer': 'security-review-report',
    };
    const reportBaseName = reportBaseNames[agent] || `${agent}-report`;
    // Sanitize path against """ delimiter injection: replace """ with ''' before embedding
    const safePlanPath = absolutePlanPath.replace(/"""/g, "'''");

    return [
      `Use the Agent tool with subagent_type "${agent}" to review the code.`,
      `Pass the following prompt to the subagent:`,
      ``,
      `"""`,
      `## Task Request`,
      `Generate ${reportBaseName} (automated execution)`,
      ``,
      `## plan-report`,
      `${safePlanPath}`,
      ``,
      `## Review target tasks`,
      `${tasks.join(', ')}`,
      ``,
      `## Notes`,
      `Automated execution (non-interactive mode); no Q&A needed. Proceed with default settings.`,
      ``,
      `## Output instructions`,
      `Follow the "Report output flow (common)" in \`.claude/skills/agents/report-output-common.md\` and execute in this order:`,
      `1. \`node .claude/hooks/clear-tmp-file.js --path .claude/tmp/${reportBaseName}.md\` — pre-delete tmp file`,
      `2. Use the Write tool to write the full report body to \`.claude/tmp/${reportBaseName}.md\` (no heredoc)`,
      `3. \`node .claude/hooks/write-report.js ${reportBaseName} new --file .claude/tmp/${reportBaseName}.md\` — save to the actual report path`,
      `- Always include the actual report file path printed by write-report.js (\`.claude/reports/${reportBaseName}-YYYYMMDD-HHmmss.md\`) in the final message`,
      `- Exit after generating the report`,
      `"""`,
      ``,
      `Do not ask any clarifying questions. Do not wait for approval. Invoke the subagent immediately with the above prompt and exit after the subagent completes.`,
    ].join('\n');
  }

  const writesLines = writes.length > 0
    ? writes.map(w => `  - ${w}`).join('\n')
    : '  (none)';

  return [
    `Implement ${tasks.join(', ')} from the plan-report.`,
    `plan-report: ${absolutePlanPath}`,
    `Assigned file scope (writes):`,
    writesLines,
    `Do not write outside the assigned file scope.`,
    `Use the Agent tool with subagent_type "${agent}" and pass the above as prompt.`,
    `Do not ask questions. Execute immediately and exit.`,
  ].join('\n');
}

function yamlListBlock(items, indent) {
  const pad = ' '.repeat(indent);
  return items.map(item => `${pad}- ${item}`).join('\n');
}

function buildTaskYaml(id, group, absolutePlanPath, phaseScales) {
  const agent                     = group.agent || 'worktree-developer';
  const readOnly                  = group.read_only === true;
  const writes                    = Array.isArray(group.writes) ? group.writes : [];
  const { timeoutSec, idleTimeoutSec } = resolveTimeouts(group, phaseScales);
  const prompt                    = buildPrompt(group, absolutePlanPath);

  // Prompt: indented with 6 spaces (under tasks > list item > prompt key)
  const promptIndented = prompt.split('\n').map(l => `      ${l}`).join('\n');

  let yaml = `  - id: ${id}\n    agent: ${agent}\n`;

  // depends_on (exclude pre_implementation itself; use group.depends_on for others)
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

  // read_only tasks must run from the repo root (not the manifest dir .claude/manifests/)
  // because write-report.js uses process.cwd()
  if (readOnly) {
    yaml += `    cwd: ../..` + '\n';
  }

  yaml += `    read_only: ${readOnly}\n`;
  yaml += `    timeout_sec: ${timeoutSec}`;

  // idle_timeout_sec: do not set for read_only: true tasks
  if (!readOnly && idleTimeoutSec !== null) {
    yaml += `\n    idle_timeout_sec: ${idleTimeoutSec}`;
  }

  // max_retries: omit when not set (default 0)
  if (typeof group.max_retries === 'number' && group.max_retries > 0) {
    yaml += `\n    max_retries: ${group.max_retries}`;
  }

  return yaml;
}

const groupKeys = Object.keys(groups);

// Place pre_implementation first, then the rest in definition order
const orderedKeys = [
  ...groupKeys.filter(k => k === 'pre_implementation'),
  ...groupKeys.filter(k => k !== 'pre_implementation'),
];

const taskYamls = orderedKeys.map(key => buildTaskYaml(key, groups[key], absolutePlanPath, phaseScales));

const manifestContent = [
  '---',
  'clade_plan_version: "0.3"',
  'tasks:',
  taskYamls.join('\n'),
  '---',
  '',
].join('\n');

// ===== Output =====
const outputDir = path.resolve('.claude/manifests');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const phaseSuffix = phaseFilter ? `-${phaseFilter}` : '';
const outputPath = path.join(outputDir, `manifest${phaseSuffix}-${getTimestamp()}.md`);
fs.writeFileSync(outputPath, manifestContent, 'utf8');

console.log(outputPath);
