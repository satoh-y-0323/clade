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
 * Returns zero-padded string parts { yyyy, mm, dd, hh, min, sec } for a Date object.
 * @param {Date} d
 * @returns {{ yyyy: string, mm: string, dd: string, hh: string, min: string, sec: string }}
 */
function formatDateParts(d) {
  return {
    yyyy: String(d.getFullYear()),
    mm:   String(d.getMonth() + 1).padStart(2, '0'),
    dd:   String(d.getDate()).padStart(2, '0'),
    hh:   String(d.getHours()).padStart(2, '0'),
    min:  String(d.getMinutes()).padStart(2, '0'),
    sec:  String(d.getSeconds()).padStart(2, '0'),
  };
}

/**
 * Returns today's date as a YYYYMMDD string.
 * @returns {string}
 */
function getTodayStr() {
  const { yyyy, mm, dd } = formatDateParts(new Date());
  return `${yyyy}${mm}${dd}`;
}

/**
 * Returns the current datetime as "YYYY-MM-DD HH:mm:ss".
 * @returns {string}
 */
function getScannedAt() {
  const { yyyy, mm, dd, hh, min, sec } = formatDateParts(new Date());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

// ---- File reading utilities --------------------------------------------------

// Maximum size for .tmp files (files exceeding 1 MB are skipped)
const MAX_TMP_SIZE = 1024 * 1024;

/**
 * Returns the list of .tmp file paths to process from the sessions directory.
 * Files exceeding MAX_TMP_SIZE are skipped with a warning to stderr.
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

  const todayStr = getTodayStr();
  const filtered = sinceToday
    ? allFiles.filter(f => path.basename(f) === `${todayStr}.tmp`)
    : allFiles;

  return filtered.filter(filePath => {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > MAX_TMP_SIZE) {
        process.stderr.write(
          `[cluster-promote-core] skip large file ${filePath}: ${stat.size} bytes\n`
        );
        return false;
      }
    } catch (err) {
      process.stderr.write(`[cluster-promote-core] stat failed ${filePath}: ${err.message}\n`);
      return false;
    }
    return true;
  });
}

/**
 * Extracts the text of a named section (## heading) from a .tmp file's content.
 * Matching uses startsWith("## " + keyword) to avoid false positives from
 * short keywords matching unrelated headings.
 * Since keyword is the phrase before any parentheses/brackets, a title like
 * "## Approaches That Were Tried but Failed (none this time)" is still matched.
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
      if (line.startsWith('## ' + keyword)) {
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
  let bodyLines = [];

  for (const line of lines) {
    const listMatch = line.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      if (currentTitle !== null) {
        items.push({ title: currentTitle, body: bodyLines.join(' ').trim() });
        bodyLines = [];
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
 * Strips control characters (including ANSI escape sequences) for safe terminal output.
 * Not called in --json mode (raw data is preserved in JSON output).
 *
 * The regex [\x00-\x1f\x7f-\x9f] removes ASCII C0 control characters and
 * Latin-1 C1 control characters (U+0080–U+009F). Because JavaScript's
 * String.replace operates on code points (not bytes), multibyte characters
 * such as CJK characters are not affected. Example: "あ" (U+3042) is outside
 * the removed range and passes through safely.
 * @param {string} str
 * @returns {string}
 */
function sanitizeForTerminal(str) {
  return String(str).replace(/[\x00-\x1f\x7f-\x9f]/g, '');
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
    } catch {
      continue;
    }

    if (record.err === true) {
      const cmd = record.cmd || record.command || '';
      const errDetail = record.stderr || record.out || '';
      // Avoid "null" or "undefined" appearing in the title when cmd is falsy
      const title = cmd
        ? `Command error: ${String(cmd).slice(0, 60)}`
        : '(no command info)';
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
      // Strip control characters / ANSI escapes for human-readable output
      const title   = sanitizeForTerminal(r.title);
      const summary = sanitizeForTerminal(r.summary);
      process.stdout.write(`[${r.id}] ${title}\n    ${summary}\n    Source: ${r.source}\n\n`);
    }
  }

  if (skillsWithId.length > 0) {
    process.stdout.write('=== Skill Candidates ===\n');
    for (const s of skillsWithId) {
      const title   = sanitizeForTerminal(s.title);
      const summary = sanitizeForTerminal(s.summary);
      process.stdout.write(`[${s.id}] ${title}\n    ${summary}\n    Source: ${s.source}\n\n`);
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
