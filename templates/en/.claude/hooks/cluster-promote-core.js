#!/usr/bin/env node
/**
 * cluster-promote-core.js
 * CLI tool to extract promotion candidates and output them as JSON or human-readable format.
 *
 * Usage:
 *   node .claude/hooks/cluster-promote-core.js scan [--since today] [--json]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parseSessionJsonBlock } = require('./hook-utils');

// ---- Constants ---------------------------------------------------------------

const SESSIONS_DIR = path.join(__dirname, '..', 'memory', 'sessions');
const BASH_LOG_PATH = path.join(__dirname, '..', 'instincts', 'raw', 'bash-log.jsonl');

// Section headings used in .tmp session files (English edition)
const SECTION_FAILED    = '## Approaches That Were Tried but Failed';
const SECTION_SUCCEEDED = '## Approaches That Worked (with evidence)';

// ---- Date utilities ----------------------------------------------------------

/**
 * Returns today's date as a YYYYMMDD string.
 * @returns {string}
 */
function getTodayStr() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Returns the current datetime as "YYYY-MM-DD HH:mm:ss".
 * @returns {string}
 */
function getScannedAt() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

// ---- File reading utilities --------------------------------------------------

/**
 * Returns the list of .tmp file paths to process from the sessions directory.
 * @param {boolean} sinceToday - if true, only include today's file
 * @returns {string[]}
 */
function resolveTmpFilePaths(sinceToday) {
  if (!fs.existsSync(SESSIONS_DIR)) {
    return [];
  }
  const allFiles = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.endsWith('.tmp'))
    .map(f => path.join(SESSIONS_DIR, f));

  if (!sinceToday) {
    return allFiles;
  }
  const todayStr = getTodayStr();
  return allFiles.filter(f => path.basename(f) === `${todayStr}.tmp`);
}

/**
 * Extracts the text of a named section (## heading) from a .tmp file's content.
 * Matching is done by partial match (key phrase before parentheses/brackets),
 * so slight variations like "## Approaches That Were Tried but Failed (none this time)"
 * are still matched correctly.
 * @param {string} content - file content
 * @param {string} sectionTitle - e.g. "## Approaches That Were Tried but Failed"
 * @returns {string} section body (up to the next ## heading, or end of file)
 */
function extractSection(content, sectionTitle) {
  // Key phrase: strip "## " prefix and take the part before any parentheses/brackets
  const keyword = sectionTitle.replace(/^##\s*/, '').split(/[（(【「[]/)[0].trim();

  const lines = content.split(/\r?\n/);
  let inSection = false;
  const collected = [];
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inSection) break; // next section starts — stop collecting
      if (line.includes(keyword)) {
        inSection = true;
        continue;
      }
    }
    if (inSection) {
      collected.push(line);
    }
  }
  return collected.join('\n').trim();
}

// ---- Candidate extraction logic ---------------------------------------------

/**
 * Parses a set of .tmp files and extracts rule and skill candidates.
 * @param {string[]} filePaths
 * @returns {{ rules: CandidateRule[], skills: CandidateSkill[] }}
 */
function extractFromTmpFiles(filePaths) {
  const rules = [];
  const skills = [];

  // Map for skill confidence counting: title -> { candidate, count }
  const skillMap = new Map();

  for (const filePath of filePaths) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      process.stderr.write(`[cluster-promote-core] skip ${filePath}: ${err.message}\n`);
      continue;
    }

    const sessionName = path.basename(filePath, '.tmp');

    // Prefer JSON block over text parsing if available
    const jsonData = parseSessionJsonBlock(content);
    if (jsonData) {
      if (Array.isArray(jsonData.failures)) {
        for (const f of jsonData.failures) {
          if (!f.title) continue;
          rules.push({
            type: 'rule',
            title: f.title,
            summary: f.lesson || f.title,
            source: 'session-tmp',
          });
        }
      }
      if (Array.isArray(jsonData.successes)) {
        for (const s of jsonData.successes) {
          if (!s.title) continue;
          const summary = [s.summary, s.evidence].filter(Boolean).join(' / ');
          if (skillMap.has(s.title)) {
            skillMap.get(s.title).count += 1;
          } else {
            skillMap.set(s.title, {
              candidate: { type: 'skill', title: s.title, summary, source: 'session-tmp' },
              count: 1,
            });
          }
        }
      }
      continue; // skip text parsing
    }

    // Fallback: text parsing for legacy .tmp files without a JSON block

    // Rule candidates: from "Approaches That Were Tried but Failed"
    const failedSection = extractSection(content, SECTION_FAILED);
    if (failedSection && failedSection !== '(not filled in)') {
      const items = parseListItems(failedSection);
      for (const item of items) {
        rules.push({
          type: 'rule',
          title: item.title || `Failed approach (${sessionName})`,
          summary: item.body || failedSection,
          source: 'session-tmp',
        });
      }
    }

    // Skill candidates: from "Approaches That Worked" (prioritize items mentioned across sessions)
    const successSection = extractSection(content, SECTION_SUCCEEDED);
    if (successSection && successSection !== '(fill in with the /end-session command)') {
      const items = parseListItems(successSection);
      for (const item of items) {
        const title = item.title || `Successful approach (${sessionName})`;
        if (skillMap.has(title)) {
          const entry = skillMap.get(title);
          entry.count += 1;
        } else {
          skillMap.set(title, {
            candidate: {
              type: 'skill',
              title,
              summary: item.body || successSection,
              source: 'session-tmp',
            },
            count: 1,
          });
        }
      }
    }
  }

  // Sort by mention count (descending); include single-mention items too
  const skillEntries = Array.from(skillMap.values());
  skillEntries.sort((a, b) => b.count - a.count);
  for (const entry of skillEntries) {
    const candidate = { ...entry.candidate };
    if (entry.count > 1) {
      candidate.summary = `(mentioned in ${entry.count} sessions) ${candidate.summary}`;
    }
    skills.push(candidate);
  }

  return { rules, skills };
}

/**
 * Parses Markdown list-format text into { title, body } objects.
 * @param {string} text
 * @returns {{ title: string, body: string }[]}
 */
function parseListItems(text) {
  const lines = text.split(/\r?\n/);
  const items = [];
  let currentTitle = null;
  const bodyLines = [];

  for (const line of lines) {
    const listMatch = line.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      if (currentTitle !== null) {
        items.push({ title: currentTitle, body: bodyLines.join(' ').trim() });
        bodyLines.length = 0;
      }
      currentTitle = listMatch[1].replace(/:.*$/, '').trim();
      const afterColon = listMatch[1].includes(':') ? listMatch[1].split(':').slice(1).join(':').trim() : '';
      if (afterColon) bodyLines.push(afterColon);
    } else if (currentTitle !== null && line.trim()) {
      bodyLines.push(line.trim());
    }
  }
  if (currentTitle !== null) {
    items.push({ title: currentTitle, body: bodyLines.join(' ').trim() });
  }
  return items;
}

/**
 * Parses bash-log.jsonl and extracts rule candidates from error records.
 * @returns {CandidateRule[]}
 */
function extractFromBashLog() {
  if (!fs.existsSync(BASH_LOG_PATH)) {
    return [];
  }

  let rawContent;
  try {
    rawContent = fs.readFileSync(BASH_LOG_PATH, 'utf8');
  } catch (err) {
    process.stderr.write(`[cluster-promote-core] skip bash-log.jsonl: ${err.message}\n`);
    return [];
  }

  const rules = [];
  const lines = rawContent.split(/\r?\n/).filter(l => l.trim());

  for (const line of lines) {
    let record;
    try {
      record = JSON.parse(line);
    } catch (_) {
      continue;
    }

    if (record.err === true) {
      const cmd = record.cmd || record.command || '(unknown command)';
      const errDetail = record.stderr || record.out || '';
      const title = `Command error: ${String(cmd).slice(0, 60)}`;
      const summary = errDetail ? String(errDetail).slice(0, 200) : '(no error detail)';
      rules.push({
        type: 'rule',
        title,
        summary,
        source: 'bash-log',
      });
    }
  }

  return rules;
}

// ---- Main logic --------------------------------------------------------------

/**
 * Entry point for the scan subcommand.
 * @param {boolean} sinceToday
 * @param {boolean} outputJson
 */
function runScan(sinceToday, outputJson) {
  const tmpFilePaths = resolveTmpFilePaths(sinceToday);
  const { rules: tmpRules, skills } = extractFromTmpFiles(tmpFilePaths);

  // bash-log covers all entries even with --since today
  const bashLogRules = extractFromBashLog();

  const allRules = [...tmpRules, ...bashLogRules];

  // Assign sequential IDs
  let idCounter = 1;
  const rulesWithId = allRules.map(r => ({ id: idCounter++, ...r }));
  const skillsWithId = skills.map(s => ({ id: idCounter++, ...s }));

  const scannedAt = getScannedAt();
  const result = {
    scannedAt,
    candidates: {
      rules: rulesWithId,
      skills: skillsWithId,
    },
  };

  if (outputJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  // Human-readable format
  const totalCount = rulesWithId.length + skillsWithId.length;
  process.stdout.write(`Scanned at: ${scannedAt}\n`);
  process.stdout.write(`Total candidates: ${totalCount}\n\n`);

  if (rulesWithId.length === 0 && skillsWithId.length === 0) {
    process.stdout.write('No promotion candidates found.\n');
    return;
  }

  if (rulesWithId.length > 0) {
    process.stdout.write('=== Rule Candidates ===\n');
    for (const r of rulesWithId) {
      process.stdout.write(`[${r.id}] ${r.title}\n    ${r.summary}\n    Source: ${r.source}\n\n`);
    }
  }

  if (skillsWithId.length > 0) {
    process.stdout.write('=== Skill Candidates ===\n');
    for (const s of skillsWithId) {
      process.stdout.write(`[${s.id}] ${s.title}\n    ${s.summary}\n    Source: ${s.source}\n\n`);
    }
  }
}

// ---- CLI parsing -------------------------------------------------------------

const args = process.argv.slice(2);
const subcommand = args[0];

if (subcommand !== 'scan') {
  process.stderr.write(`Usage: node cluster-promote-core.js scan [--since today] [--json]\n`);
  process.exit(1);
}

const sinceToday = args.includes('--since') && args[args.indexOf('--since') + 1] === 'today';
const outputJson = args.includes('--json');

try {
  runScan(sinceToday, outputJson);
  process.exit(0);
} catch (err) {
  process.stderr.write(`[cluster-promote-core] Unexpected error: ${err.message}\n${err.stack}\n`);
  process.exit(1);
}
