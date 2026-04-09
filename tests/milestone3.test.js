/**
 * milestone3.test.js
 * session-start.js のセットアップ未実行検出テスト（K〜N グループ）
 *
 * 実行コマンド: node --test tests/milestone3.test.js
 */

'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SESSION_START_SCRIPT = path.join(ROOT, '.claude', 'hooks', 'session-start.js');

// ============================================================
// Helpers
// ============================================================

/**
 * session-start.js を指定ディレクトリを cwd として実行する
 * @param {string} cwdDir
 * @returns {{ exitCode: number; stdout: string; stderr: string }}
 */
function runSessionStart(cwdDir) {
  const result = spawnSync('node', [SESSION_START_SCRIPT], {
    cwd: cwdDir,
    encoding: 'utf8',
    timeout: 10000,
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

/**
 * 一時ディレクトリを作成して返す
 * @returns {string}
 */
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'session-start-test-'));
}

/**
 * 一時ディレクトリ内に最低限の .claude/memory/ 構造を作成する
 * （session-start.js が正常動作するために必要な最低限のディレクトリ）
 * @param {string} dir
 */
function createMinimalStructure(dir) {
  fs.mkdirSync(path.join(dir, '.claude', 'memory'), { recursive: true });
}

// ============================================================
// Group K: 正常系（検出対象ファイルなし）
// ============================================================
describe('K: 検出対象ファイルなし（正常系）', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    createMinimalStructure(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('K-1: 検出対象ファイルが1つも存在しない場合 exit code 0 で処理継続', () => {
    const { exitCode, stdout } = runSessionStart(tmpDir);
    assert.equal(exitCode, 0, `exit code should be 0, got ${exitCode}`);
    // セットアップ警告が含まれないこと
    assert.equal(
      stdout.includes('セットアップ未実行') || stdout.includes('セットアップが完了していません'),
      false,
      'stdout should not contain setup warning'
    );
    // 通常のセッション開始ヘッダーが含まれること
    assert.equal(stdout.includes('==='), true, 'stdout should contain === header');
  });
});

// ============================================================
// Group L: 各検出対象ファイル単独の存在
// ============================================================
describe('L: 各検出対象ファイル単独の存在', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    createMinimalStructure(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('L-1: setup.sh のみが存在する場合 → exit code 1 で停止', () => {
    fs.writeFileSync(path.join(tmpDir, 'setup.sh'), '#!/bin/bash\n', 'utf8');
    const { exitCode, stdout } = runSessionStart(tmpDir);
    assert.equal(exitCode, 1, `exit code should be 1, got ${exitCode}`);
    assert.equal(stdout.length > 0, true, 'stdout should contain warning message');
  });

  it('L-2: setup.ps1 のみが存在する場合 → exit code 1 で停止', () => {
    fs.writeFileSync(path.join(tmpDir, 'setup.ps1'), '# PowerShell setup\n', 'utf8');
    const { exitCode, stdout } = runSessionStart(tmpDir);
    assert.equal(exitCode, 1, `exit code should be 1, got ${exitCode}`);
    assert.equal(stdout.length > 0, true, 'stdout should contain warning message');
  });

  it('L-3: cleanup.sh のみが存在する場合 → exit code 1 で停止', () => {
    fs.writeFileSync(path.join(tmpDir, 'cleanup.sh'), '#!/bin/bash\n', 'utf8');
    const { exitCode, stdout } = runSessionStart(tmpDir);
    assert.equal(exitCode, 1, `exit code should be 1, got ${exitCode}`);
    assert.equal(stdout.length > 0, true, 'stdout should contain warning message');
  });

  it('L-4: README.md のみが存在する場合 → exit code 1 で停止', () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# README\n', 'utf8');
    const { exitCode, stdout } = runSessionStart(tmpDir);
    assert.equal(exitCode, 1, `exit code should be 1, got ${exitCode}`);
    assert.equal(stdout.length > 0, true, 'stdout should contain warning message');
  });

  it('L-5: templates/en/.claude/ ディレクトリのみが存在する場合 → exit code 1 で停止', () => {
    fs.mkdirSync(path.join(tmpDir, 'templates', 'en', '.claude'), { recursive: true });
    const { exitCode, stdout } = runSessionStart(tmpDir);
    assert.equal(exitCode, 1, `exit code should be 1, got ${exitCode}`);
    assert.equal(stdout.length > 0, true, 'stdout should contain warning message');
  });
});

// ============================================================
// Group M: 警告メッセージ内容確認
// ============================================================
describe('M: 警告メッセージ内容確認', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    createMinimalStructure(tmpDir);
    // 検出対象として setup.sh を作成
    fs.writeFileSync(path.join(tmpDir, 'setup.sh'), '#!/bin/bash\n', 'utf8');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('M-1: 警告メッセージに「セットアップ」または "setup" 相当の文言が含まれる', () => {
    const { stdout } = runSessionStart(tmpDir);
    const hasSetupWord =
      stdout.includes('セットアップ') ||
      stdout.toLowerCase().includes('setup');
    assert.equal(hasSetupWord, true, 'stdout should contain "セットアップ" or "setup"');
  });

  it('M-2: 警告メッセージに setup.sh / setup.ps1 のファイル名が含まれる', () => {
    const { stdout } = runSessionStart(tmpDir);
    assert.equal(stdout.includes('setup.sh'), true, 'stdout should contain "setup.sh"');
    assert.equal(stdout.includes('setup.ps1'), true, 'stdout should contain "setup.ps1"');
  });

  it('M-3: 警告メッセージに settings.local.json が含まれる', () => {
    const { stdout } = runSessionStart(tmpDir);
    assert.equal(
      stdout.includes('settings.local.json'),
      true,
      'stdout should contain "settings.local.json"'
    );
  });

  it('M-4: 警告メッセージに検出されたファイル名（setup.sh）が含まれる', () => {
    const { stdout } = runSessionStart(tmpDir);
    assert.equal(stdout.includes('setup.sh'), true, 'stdout should contain detected filename "setup.sh"');
  });
});

// ============================================================
// Group N: 境界値
// ============================================================
describe('N: 境界値', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    createMinimalStructure(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('N-1: 全検出対象ファイルが同時存在 → exit code 1 かつ全ファイル名が出力に含まれる', () => {
    // 全検出対象を作成
    fs.writeFileSync(path.join(tmpDir, 'setup.sh'), '#!/bin/bash\n', 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'setup.ps1'), '# PowerShell\n', 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'cleanup.sh'), '#!/bin/bash\n', 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# README\n', 'utf8');
    fs.mkdirSync(path.join(tmpDir, 'templates', 'en', '.claude'), { recursive: true });

    const { exitCode, stdout } = runSessionStart(tmpDir);

    assert.equal(exitCode, 1, `exit code should be 1, got ${exitCode}`);
    assert.equal(stdout.length > 0, true, 'stdout should contain warning message');
    assert.equal(stdout.includes('setup.sh'), true, 'stdout should contain "setup.sh"');
    assert.equal(stdout.includes('setup.ps1'), true, 'stdout should contain "setup.ps1"');
    assert.equal(stdout.includes('cleanup.sh'), true, 'stdout should contain "cleanup.sh"');
    assert.equal(stdout.includes('README.md'), true, 'stdout should contain "README.md"');
    assert.equal(
      stdout.includes('templates/en/.claude'),
      true,
      'stdout should contain "templates/en/.claude"'
    );
  });
});
