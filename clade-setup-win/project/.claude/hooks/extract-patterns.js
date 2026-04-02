#!/usr/bin/env node
/**
 * extract-patterns.js
 *
 * Stop hookから非同期で呼ばれる。
 * observations.jsonl を読み込み、セッション中の行動パターンを分析して
 * .claude/instincts/raw/patterns_{YYYYMMDD}.json に保存する。
 *
 * 分析内容:
 *   1. ツール別成功率・失敗率
 *   2. 失敗→成功の遷移パターン（リトライパターン）
 *   3. 高頻度ツールシーケンス（よく連続して使うツールの組み合わせ）
 *   4. エラーキーワードの頻出パターン
 *   5. セッションごとの成長スコア（前セッション比）
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ===== パス設定 =====
const CWD         = process.cwd();
const OBS_FILE    = path.join(CWD, '.claude/instincts/raw/observations.jsonl');
const OUT_DIR     = path.join(CWD, '.claude/instincts/raw');
const CLUSTER_DIR = path.join(CWD, '.claude/instincts/clusters');

const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const OUT_FILE = path.join(OUT_DIR, `patterns_${today}.json`);

// ===== ユーティリティ =====
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

// ===== 分析関数群 =====

/**
 * 1. ツール別統計（成功率・失敗率・平均実行回数）
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
 * 2. 失敗→成功の遷移パターン（リトライパターン）
 *    同じツールで失敗した直後に成功した場合を検出
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
 * 3. 高頻度ツールシーケンス（bigram: 2つ連続するツールの組み合わせ）
 */
function analyzeToolSequences(records) {
  const postRecords = records.filter(r => r.event === 'post' && r.status === 'success');
  const bigramCount = {};

  for (let i = 0; i < postRecords.length - 1; i++) {
    const key = `${postRecords[i].tool} → ${postRecords[i+1].tool}`;
    bigramCount[key] = (bigramCount[key] || 0) + 1;
  }

  return Object.entries(bigramCount)
    .filter(([, count]) => count >= 2)
    .map(([sequence, count]) => ({ sequence, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * 4. エラーキーワード頻出パターン
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
 * 5. セッション別集計（セッションごとの成功率推移）
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
 * 6. スキル昇格候補の自動判定
 *    - 3回以上成功しているツールシーケンスをスキル候補とみなす
 *    - 2回以上失敗→成功の遷移があればルール候補とみなす
 */
function generatePromotionCandidates(toolStats, retryPatterns, toolSequences) {
  const skillCandidates = [];
  const ruleCandidates  = [];

  // 高頻度成功シーケンス → スキル候補
  for (const seq of toolSequences) {
    if (seq.count >= 3) {
      skillCandidates.push({
        type:       'skill',
        name:       seq.sequence.replace(' → ', '-to-').toLowerCase().replace(/\s+/g, '-'),
        summary:    `${seq.sequence} のシーケンスが${seq.count}回成功`,
        evidence:   `sequence: "${seq.sequence}", count: ${seq.count}`,
        confidence: seq.count >= 5 ? 'high' : 'medium',
      });
    }
  }

  // 高頻度リトライパターン → ルール候補
  const retryByTool = {};
  for (const p of retryPatterns) {
    retryByTool[p.tool] = (retryByTool[p.tool] || 0) + 1;
  }
  for (const [tool, count] of Object.entries(retryByTool)) {
    if (count >= 2) {
      ruleCandidates.push({
        type:       'rule',
        name:       `avoid-first-try-${tool.toLowerCase().replace(/\s+/g, '-')}`,
        summary:    `${tool} で${count}回失敗→成功のリトライパターンを検出`,
        evidence:   `tool: "${tool}", retry_count: ${count}`,
        confidence: count >= 4 ? 'high' : 'medium',
      });
    }
  }

  // 低成功率ツール → ルール候補
  for (const stat of toolStats) {
    if (stat.total >= 3 && stat.successRate < 50) {
      ruleCandidates.push({
        type:       'rule',
        name:       `caution-${stat.tool.toLowerCase().replace(/\s+/g, '-')}`,
        summary:    `${stat.tool} の成功率が${stat.successRate}%（${stat.total}回中${stat.failure}回失敗）`,
        evidence:   `tool: "${stat.tool}", success_rate: ${stat.successRate}%`,
        confidence: 'medium',
      });
    }
  }

  return { skillCandidates, ruleCandidates };
}

// ===== メイン処理 =====
function main() {
  ensureDir(OUT_DIR);
  ensureDir(CLUSTER_DIR);

  const records = loadObservations(OBS_FILE);

  if (records.length === 0) {
    console.log('[extract-patterns] 観察データが0件のためスキップします');
    return;
  }

  console.log(`[extract-patterns] ${records.length}件の観察データを分析中...`);

  // 本日分のデータのみ対象
  const todayPrefix = today.slice(0, 8);
  const todayRecords = records.filter(r => String(r.session) === todayPrefix);
  const targetRecords = todayRecords.length > 0 ? todayRecords : records;

  console.log(`[extract-patterns] 対象レコード: ${targetRecords.length}件 (session: ${todayPrefix})`);

  // 各分析を実行
  const toolStats      = analyzeToolStats(targetRecords);
  const retryPatterns  = analyzeRetryPatterns(targetRecords);
  const toolSequences  = analyzeToolSequences(targetRecords);
  const errorKeywords  = analyzeErrorKeywords(targetRecords);
  const sessionTrend   = analyzeSessionTrend(records); // 全履歴でトレンド計算

  // 昇格候補の生成
  const { skillCandidates, ruleCandidates } = generatePromotionCandidates(
    toolStats, retryPatterns, toolSequences
  );

  // 結果をまとめる
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
      topTool:          toolStats[0]?.tool || 'なし',
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

  // ファイルに書き込む
  fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), 'utf8');

  console.log('[extract-patterns] 分析完了:');
  console.log(`  出力先: ${OUT_FILE}`);
  console.log(`  ツール種別: ${toolStats.length}種`);
  console.log(`  リトライパターン: ${retryPatterns.length}件`);
  console.log(`  高頻度シーケンス: ${toolSequences.length}件`);
  console.log(`  昇格候補: スキル ${skillCandidates.length}件 / ルール ${ruleCandidates.length}件`);
  console.log(`  本日の成功率: ${result.summary.overallSuccessRate}%`);

  // 昇格候補があればコンソールに表示
  if (result.promotionCandidates.total > 0) {
    console.log('');
    console.log('[extract-patterns] 昇格候補が見つかりました！');
    console.log('  /cluster-promote コマンドを実行してください。');
    for (const c of [...skillCandidates, ...ruleCandidates]) {
      console.log(`  [${c.type}/${c.confidence}] ${c.name}: ${c.summary}`);
    }
  }
}

main();
