#!/usr/bin/env node
/**
 * extract-patterns.js
 *
 * Called asynchronously from the Stop hook.
 * Reads observations.jsonl, analyzes behavioral patterns from the session, and
 * saves the results to .claude/instincts/raw/patterns_{YYYYMMDD}.json.
 *
 * Analysis content:
 *   1. Per-tool success/failure rates
 *   2. Failure→success transition patterns (retry patterns)
 *   3. High-frequency tool sequences (combinations of tools used consecutively)
 *   4. Frequently occurring error keyword patterns
 *   5. Per-session growth score (compared to previous session)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ===== Path Configuration =====
const CWD         = process.cwd();
const OBS_FILE    = path.join(CWD, '.claude/instincts/raw/observations.jsonl');
const OUT_DIR     = path.join(CWD, '.claude/instincts/raw');
const CLUSTER_DIR = path.join(CWD, '.claude/instincts/clusters');

const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const OUT_FILE = path.join(OUT_DIR, `patterns_${today}.json`);

// ===== Utilities =====
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadObservations(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); }
      catch { return null; }
    })
    .filter(Boolean);
}

// YYYYMMDD → YYYY-MM-DD
function sessionToDate(session) {
  const s = String(session);
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
}

// ===== Analysis Functions =====

/**
 * 1. Per-tool statistics (success rate, failure rate, average executions)
 */
function analyzeToolStats(records) {
  const stats = {};
  for (const r of records) {
    if (r.event !== 'post') continue;
    if (!stats[r.tool]) stats[r.tool] = { success: 0, failure: 0, total: 0 };
    stats[r.tool].total++;
    stats[r.tool][r.status]++;
  }
  return Object.entries(stats).map(([tool, s]) => ({
    tool,
    total:       s.total,
    success:     s.success,
    failure:     s.failure,
    successRate: s.total > 0 ? Math.round((s.success / s.total) * 100) : 0,
  })).sort((a, b) => b.total - a.total);
}

/**
 * 2. Failure→success transition patterns (retry patterns)
 *    Detects cases where the same tool failed immediately before succeeding
 */
function analyzeRetryPatterns(records) {
  const postRecords = records.filter(r => r.event === 'post');
  const patterns = [];

  for (let i = 0; i < postRecords.length - 1; i++) {
    const curr = postRecords[i];
    const next = postRecords[i + 1];
    if (curr.status === 'failure' && next.status === 'success' && curr.tool === next.tool) {
      patterns.push({
        tool:          curr.tool,
        failedInput:   curr.input?.slice(0, 150) || '',
        successInput:  next.input?.slice(0, 150) || '',
        session:       curr.session,
        timestamp:     curr.ts,
      });
    }
  }
  return patterns;
}

/**
 * 3. High-frequency tool sequences (bigram: pairs of 2 consecutive tools)
 *    Tracks session spread (occurrence across different days) and input diversity (used with different inputs).
 *    Pairs straddling session boundaries are excluded (end of one session → start of next is meaningless).
 */
function analyzeToolSequences(records) {
  const postRecords = records.filter(r => r.event === 'post' && r.status === 'success');
  const bigramMap = {};

  for (let i = 0; i < postRecords.length - 1; i++) {
    const curr = postRecords[i];
    const next = postRecords[i + 1];
    // Exclude pairs straddling sessions
    if (String(curr.session) !== String(next.session)) continue;

    const key = `${curr.tool} → ${next.tool}`;
    if (!bigramMap[key]) {
      bigramMap[key] = { sessions: new Set(), inputs: new Set(), count: 0 };
    }
    bigramMap[key].sessions.add(String(curr.session));
    // Use first 100 characters of input as a diversity fingerprint
    bigramMap[key].inputs.add((curr.input || '').slice(0, 100));
    bigramMap[key].count++;
  }

  return Object.entries(bigramMap)
    .map(([sequence, d]) => ({
      sequence,
      count:         d.count,
      sessionCount:  d.sessions.size,
      sessions:      [...d.sessions],
      inputDiversity: d.inputs.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * 4. Frequently occurring error keyword patterns
 */
function analyzeErrorKeywords(records) {
  const failedOutputs = records
    .filter(r => r.event === 'post' && r.status === 'failure')
    .map(r => r.output || '');

  const keywords = [
    'not found', 'permission denied', 'cannot find module',
    'syntax error', 'type error', 'connection refused',
    'timeout', 'undefined', 'null pointer', 'enoent',
  ];

  const keywordCount = {};
  for (const output of failedOutputs) {
    const lower = output.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        keywordCount[kw] = (keywordCount[kw] || 0) + 1;
      }
    }
  }

  return Object.entries(keywordCount)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 5. Per-session aggregation (success rate trend per session)
 */
function analyzeSessionTrend(records) {
  const bySession = {};
  for (const r of records) {
    if (r.event !== 'post') continue;
    const s = r.session;
    if (!bySession[s]) bySession[s] = { success: 0, failure: 0, total: 0 };
    bySession[s].total++;
    bySession[s][r.status]++;
  }

  return Object.entries(bySession)
    .map(([session, s]) => ({
      session,
      date:        sessionToDate(session),
      total:       s.total,
      success:     s.success,
      failure:     s.failure,
      successRate: s.total > 0 ? Math.round((s.success / s.total) * 100) : 0,
    }))
    .sort((a, b) => a.session.localeCompare(b.session));
}

/**
 * 6. Auto-determination of skill promotion candidates
 *    - Tool sequences with 3 or more successes are treated as skill candidates
 *    - 2 or more failure→success transitions are treated as rule candidates
 */
function generatePromotionCandidates(toolStats, retryPatterns, toolSequences) {
  const skillCandidates = [];
  const ruleCandidates  = [];

  // High-frequency successful sequences → skill candidates
  // Condition: occurs in 3 or more different sessions (days) AND used with 2 or more different inputs
  for (const seq of toolSequences) {
    if (seq.sessionCount >= 3 && seq.inputDiversity >= 2) {
      skillCandidates.push({
        type:       'skill',
        name:       seq.sequence.replace(' → ', '-to-').toLowerCase().replace(/\s+/g, '-'),
        summary:    `${seq.sequence} sequence confirmed in ${seq.sessionCount} sessions with ${seq.inputDiversity} input types`,
        evidence:   `sequence: "${seq.sequence}", sessions: ${seq.sessionCount}, inputDiversity: ${seq.inputDiversity}`,
        confidence: seq.sessionCount >= 5 ? 'high' : 'medium',
      });
    }
  }

  // High-frequency retry patterns → rule candidates
  // Condition: occurs in 2 or more different sessions AND with 2 or more different inputs
  const retryByTool = {};
  for (const p of retryPatterns) {
    if (!retryByTool[p.tool]) retryByTool[p.tool] = { sessions: new Set(), inputs: new Set(), count: 0 };
    retryByTool[p.tool].sessions.add(String(p.session));
    retryByTool[p.tool].inputs.add((p.failedInput || '').slice(0, 100));
    retryByTool[p.tool].count++;
  }
  for (const [tool, data] of Object.entries(retryByTool)) {
    if (data.sessions.size >= 2 && data.inputs.size >= 2) {
      ruleCandidates.push({
        type:       'rule',
        name:       `avoid-first-try-${tool.toLowerCase().replace(/\s+/g, '-')}`,
        summary:    `Failure→success retry for ${tool} detected in ${data.sessions.size} sessions with ${data.inputs.size} input types`,
        evidence:   `tool: "${tool}", sessions: ${data.sessions.size}, inputDiversity: ${data.inputs.size}`,
        confidence: data.sessions.size >= 4 ? 'high' : 'medium',
      });
    }
  }

  // Low success rate tools → rule candidates
  for (const stat of toolStats) {
    if (stat.total >= 3 && stat.successRate < 50) {
      ruleCandidates.push({
        type:       'rule',
        name:       `caution-${stat.tool.toLowerCase().replace(/\s+/g, '-')}`,
        summary:    `${stat.tool} success rate is ${stat.successRate}% (${stat.failure} failures out of ${stat.total})`,
        evidence:   `tool: "${stat.tool}", success_rate: ${stat.successRate}%`,
        confidence: 'medium',
      });
    }
  }

  return { skillCandidates, ruleCandidates };
}

// ===== Main Process =====
function main() {
  ensureDir(OUT_DIR);
  ensureDir(CLUSTER_DIR);

  const records = loadObservations(OBS_FILE);

  if (records.length === 0) {
    console.log('[extract-patterns] 0 observation records found. Skipping.');
    return;
  }

  console.log(`[extract-patterns] Analyzing ${records.length} observation records...`);

  // Target only today's data
  const todayPrefix = today.slice(0, 8);
  const todayRecords = records.filter(r => String(r.session) === todayPrefix);
  const targetRecords = todayRecords.length > 0 ? todayRecords : records;

  console.log(`[extract-patterns] Target records: ${targetRecords.length} (session: ${todayPrefix})`);

  // Run each analysis
  // toolStats / errorKeywords target today's data only
  // retryPatterns / toolSequences use full history to correctly calculate session spread
  const toolStats      = analyzeToolStats(targetRecords);
  const retryPatterns  = analyzeRetryPatterns(records);
  const toolSequences  = analyzeToolSequences(records);
  const errorKeywords  = analyzeErrorKeywords(targetRecords);
  const sessionTrend   = analyzeSessionTrend(records); // Calculate trend from full history

  // Generate promotion candidates
  const { skillCandidates, ruleCandidates } = generatePromotionCandidates(
    toolStats, retryPatterns, toolSequences
  );

  // Compile results
  const result = {
    meta: {
      generatedAt:    new Date().toISOString(),
      session:        todayPrefix,
      totalRecords:   records.length,
      todayRecords:   targetRecords.length,
    },
    toolStats,
    retryPatterns:   retryPatterns.slice(0, 20),
    toolSequences,
    errorKeywords,
    sessionTrend,
    promotionCandidates: {
      skillCandidates,
      ruleCandidates,
      total: skillCandidates.length + ruleCandidates.length,
    },
    summary: {
      topTool:          toolStats[0]?.tool || 'none',
      overallSuccessRate: targetRecords.filter(r => r.event === 'post').length > 0
        ? Math.round(
            (targetRecords.filter(r => r.event === 'post' && r.status === 'success').length /
             targetRecords.filter(r => r.event === 'post').length) * 100
          )
        : 0,
      retryCount:       retryPatterns.length,
      promotionReady:   skillCandidates.length + ruleCandidates.length,
    },
  };

  // Write to file
  fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), 'utf8');

  console.log('[extract-patterns] Analysis complete:');
  console.log(`  Output: ${OUT_FILE}`);
  console.log(`  Tool types: ${toolStats.length}`);
  console.log(`  Retry patterns: ${retryPatterns.length}`);
  console.log(`  High-frequency sequences: ${toolSequences.length}`);
  console.log(`  Promotion candidates: ${skillCandidates.length} skills / ${ruleCandidates.length} rules`);
  console.log(`  Today's success rate: ${result.summary.overallSuccessRate}%`);

  // Display promotion candidates in console if any
  if (result.promotionCandidates.total > 0) {
    console.log('');
    console.log('[extract-patterns] Promotion candidates found!');
    console.log('  Please run the /cluster-promote command.');
    for (const c of [...skillCandidates, ...ruleCandidates]) {
      console.log(`  [${c.type}/${c.confidence}] ${c.name}: ${c.summary}`);
    }
  }
}

main();
