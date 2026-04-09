'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// Helper: read file content
function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// Helper: check if file exists
function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ============================================================
// Group A: .claude/VERSION file (Task T2)
// ============================================================
describe('T2: .claude/VERSION', () => {
  it('A-1: file exists', () => {
    assert.equal(fileExists('.claude/VERSION'), true);
  });

  it('A-2: version string is 1.7.0', () => {
    const content = readFile('.claude/VERSION');
    assert.equal(content.trim(), '1.7.0');
  });

  it('A-3: version matches semantic version format', () => {
    const content = readFile('.claude/VERSION');
    assert.match(content.trim(), /^\d+\.\d+\.\d+$/);
  });

  it('A-4: file is not empty', () => {
    const content = readFile('.claude/VERSION');
    assert.ok(content.trim().length > 0);
  });
});

// ============================================================
// Group B: .claude/clade-manifest.json file (Task T3)
// ============================================================
describe('T3: .claude/clade-manifest.json', () => {
  it('B-1: file exists', () => {
    assert.equal(fileExists('.claude/clade-manifest.json'), true);
  });

  it('B-2: valid JSON', () => {
    const content = readFile('.claude/clade-manifest.json');
    assert.doesNotThrow(() => JSON.parse(content));
  });

  it('B-3: version field is "1.7.0"', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(manifest.version, '1.7.0');
  });

  it('B-4: managed_files is an object', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(typeof manifest.managed_files, 'object');
    assert.notEqual(manifest.managed_files, null);
  });

  it('B-5: managed_files.commands is an array', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(Array.isArray(manifest.managed_files.commands), true);
  });

  it('B-6: managed_files.hooks is an array', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(Array.isArray(manifest.managed_files.hooks), true);
  });

  it('B-7: managed_files.rules is an array', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(Array.isArray(manifest.managed_files.rules), true);
  });

  it('B-8: managed_files.other is an array', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(Array.isArray(manifest.managed_files.other), true);
  });

  it('B-9: managed_files.ja_only is an array', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(Array.isArray(manifest.managed_files.ja_only), true);
  });

  it('B-10: managed_files.en_only is an array', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(Array.isArray(manifest.managed_files.en_only), true);
  });

  it('B-11: ja_only contains "commands/context-gauge.md"', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(manifest.managed_files.ja_only.includes('commands/context-gauge.md'), true);
  });

  it('B-12: en_only is empty array', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(manifest.managed_files.en_only.length, 0);
  });

  it('B-13: commands contains all required 20 files', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    const commands = manifest.managed_files.commands;
    const required = [
      'agent-architect.md',
      'agent-code-reviewer.md',
      'agent-developer.md',
      'agent-interviewer.md',
      'agent-mcp-setup.md',
      'agent-planner.md',
      'agent-project-setup.md',
      'agent-security-reviewer.md',
      'agent-tester.md',
      'agent-workflow-builder.md',
      'clear-file-history.md',
      'cluster-promote.md',
      'enable-sandbox.md',
      'end-session.md',
      'init-session.md',
      'playwright-add-origin.md',
      'playwright-list-origins.md',
      'playwright-remove-origin.md',
      'promote.md',
      'status.md',
    ];
    for (const file of required) {
      assert.equal(commands.includes(file), true, `commands should include ${file}`);
    }
  });

  it('B-14: commands does not contain "context-gauge.md"', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(manifest.managed_files.commands.includes('context-gauge.md'), false);
  });

  it('B-15: hooks contains all required 13 files', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    const hooks = manifest.managed_files.hooks;
    const required = [
      'check-group-isolation.js',
      'clear-file-history.js',
      'enable-sandbox.js',
      'hook-utils.js',
      'manage-playwright-origins.js',
      'post-tool.js',
      'pre-compact.js',
      'pre-tool.js',
      'record-approval.js',
      'session-start.js',
      'statusline.js',
      'stop.js',
      'write-report.js',
    ];
    for (const file of required) {
      assert.equal(hooks.includes(file), true, `hooks should include ${file}`);
    }
  });

  it('B-16: other contains CLAUDE.md, clade-manifest.json, VERSION', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    const other = manifest.managed_files.other;
    assert.equal(other.includes('CLAUDE.md'), true);
    assert.equal(other.includes('clade-manifest.json'), true);
    assert.equal(other.includes('VERSION'), true);
  });

  it('B-17: rules contains "core.md"', () => {
    const manifest = JSON.parse(readFile('.claude/clade-manifest.json'));
    assert.equal(manifest.managed_files.rules.includes('core.md'), true);
  });
});

// ============================================================
// Group C: CLADE markers in CLAUDE.md (Task T4)
// ============================================================
describe('T4: CLADE markers in CLAUDE.md', () => {
  const START_TAG = '<!-- CLADE:START -->';
  const END_TAG = '<!-- CLADE:END -->';

  it('C-1: Japanese CLAUDE.md contains START tag', () => {
    const content = readFile('.claude/CLAUDE.md');
    assert.equal(content.includes(START_TAG), true);
  });

  it('C-2: Japanese CLAUDE.md contains END tag', () => {
    const content = readFile('.claude/CLAUDE.md');
    assert.equal(content.includes(END_TAG), true);
  });

  it('C-3: Japanese CLAUDE.md markers are in correct order', () => {
    const content = readFile('.claude/CLAUDE.md');
    assert.ok(content.indexOf(START_TAG) < content.indexOf(END_TAG));
  });

  it('C-4: Japanese CLAUDE.md markers each appear exactly once', () => {
    const content = readFile('.claude/CLAUDE.md');
    const startCount = (content.match(/<!-- CLADE:START -->/g) || []).length;
    const endCount = (content.match(/<!-- CLADE:END -->/g) || []).length;
    assert.equal(startCount, 1);
    assert.equal(endCount, 1);
  });

  it('C-5: Japanese CLAUDE.md preserves existing content', () => {
    const content = readFile('.claude/CLAUDE.md');
    assert.equal(content.includes('Startup Protocol'), true);
    assert.equal(content.includes('Language'), true);
    assert.equal(content.includes('Available Agents'), true);
    assert.equal(content.includes('@rules/core.md'), true);
  });

  it('C-6: English CLAUDE.md exists', () => {
    assert.equal(fileExists('templates/en/.claude/CLAUDE.md'), true);
  });

  it('C-7: English CLAUDE.md contains START tag', () => {
    const content = readFile('templates/en/.claude/CLAUDE.md');
    assert.equal(content.includes(START_TAG), true);
  });

  it('C-8: English CLAUDE.md contains END tag', () => {
    const content = readFile('templates/en/.claude/CLAUDE.md');
    assert.equal(content.includes(END_TAG), true);
  });

  it('C-9: English CLAUDE.md markers are in correct order', () => {
    const content = readFile('templates/en/.claude/CLAUDE.md');
    assert.ok(content.indexOf(START_TAG) < content.indexOf(END_TAG));
  });

  it('C-10: English CLAUDE.md markers each appear exactly once', () => {
    const content = readFile('templates/en/.claude/CLAUDE.md');
    const startCount = (content.match(/<!-- CLADE:START -->/g) || []).length;
    const endCount = (content.match(/<!-- CLADE:END -->/g) || []).length;
    assert.equal(startCount, 1);
    assert.equal(endCount, 1);
  });
});

// ============================================================
// Group D: templates/en/.claude/commands/context-gauge.md (Task T1)
// ============================================================
describe('T1: templates/en/.claude/commands/context-gauge.md', () => {
  it('D-1: file exists', () => {
    assert.equal(fileExists('templates/en/.claude/commands/context-gauge.md'), true);
  });

  it('D-2: file is not empty', () => {
    const content = readFile('templates/en/.claude/commands/context-gauge.md');
    assert.ok(content.trim().length > 0);
  });

  it('D-3: file contains no Japanese characters', () => {
    const content = readFile('templates/en/.claude/commands/context-gauge.md');
    // Hiragana, Katakana, and CJK Unified Ideographs
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(content);
    assert.equal(hasJapanese, false);
  });

  it('D-4: file has a command header (# heading)', () => {
    const content = readFile('templates/en/.claude/commands/context-gauge.md');
    assert.match(content, /^# .+/m);
  });

  it('D-5: file mentions statusLine or settings.local.json', () => {
    const content = readFile('templates/en/.claude/commands/context-gauge.md');
    const hasMention = content.includes('statusLine') || content.includes('settings.local.json');
    assert.equal(hasMention, true);
  });

  it('D-6: file contains enable/disable or activate/deactivate flow description', () => {
    const content = readFile('templates/en/.claude/commands/context-gauge.md');
    const hasFlow =
      content.toLowerCase().includes('enable') ||
      content.toLowerCase().includes('disable') ||
      content.toLowerCase().includes('activate') ||
      content.toLowerCase().includes('deactivate');
    assert.equal(hasFlow, true);
  });

  it('D-7: file covers statusLine, settings.local.json, and gauge description (10/10%/cells)', () => {
    const content = readFile('templates/en/.claude/commands/context-gauge.md');
    assert.equal(content.includes('statusLine'), true, 'should mention statusLine');
    assert.equal(content.includes('settings.local.json'), true, 'should mention settings.local.json');
    const hasGauge =
      content.includes('10') && (content.includes('10%') || content.includes('cells'));
    assert.equal(hasGauge, true, 'should describe gauge with 10 cells / 10%');
  });

  it('D-8: file is placed directly under templates/en/.claude/commands/', () => {
    const fullPath = path.join(ROOT, 'templates/en/.claude/commands/context-gauge.md');
    const dir = path.dirname(fullPath);
    const expectedDir = path.join(ROOT, 'templates/en/.claude/commands');
    assert.equal(dir, expectedDir);
  });
});
