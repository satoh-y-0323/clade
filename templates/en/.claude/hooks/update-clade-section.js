'use strict';

/**
 * update-clade-section.js
 *
 * Idempotently appends @rules/NAME.md to the User Rules section of CLAUDE.md,
 * just before the <!-- CLADE:START --> marker.
 *
 * Usage:
 *   node .claude/hooks/update-clade-section.js add-rule NAME [--dry-run]
 *   node .claude/hooks/update-clade-section.js remove-rule NAME [--dry-run]
 *
 * Exit codes:
 *   0 - success (appended/removed, or marker not found — no-op)
 *   2 - no-op (entry already exists / entry not found for removal)
 *   1 - error (file read/write failure, etc.)
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CLADE_START_MARKER   = '<!-- CLADE:START -->';
const CLADE_END_MARKER     = '<!-- CLADE:END -->';
const GLOBAL_RULES_HEADING = '## Global Rules (Clade Managed)';
const USER_RULES_MARKER    = '<!-- /cluster-promote auto-appends here -->';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Writes a log message to stderr.
 * @param {string} message
 */
function log(message) {
  process.stderr.write('[update-clade-section] ' + message + '\n');
}

/**
 * Returns the project root (assumes this script lives in .claude/hooks/).
 * @returns {string}
 */
function getProjectRoot() {
  return path.resolve(__dirname, '..', '..');
}

/**
 * Returns the path to CLAUDE.md.
 * @returns {string}
 */
function getClaudeMdPath() {
  return path.join(getProjectRoot(), '.claude', 'CLAUDE.md');
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * Finds the start and end indices of the CLADE:START ~ CLADE:END region.
 * Handles both CRLF and LF line endings.
 *
 * @param {string} content - full file content
 * @returns {{ startIdx: number, sectionEnd: number, innerStart: number, innerEnd: number } | null}
 *   null if markers are not found
 */
function findCladeSection(content) {
  const startIdx = content.indexOf(CLADE_START_MARKER);
  if (startIdx === -1) return null;

  const endIdx = content.indexOf(CLADE_END_MARKER, startIdx);
  if (endIdx === -1) return null;

  // Include through the end of the CLADE:END marker line (including newline)
  const afterEnd = endIdx + CLADE_END_MARKER.length;
  const nextNewline = content.indexOf('\n', afterEnd);
  const sectionEnd = nextNewline === -1 ? content.length : nextNewline + 1;

  return { startIdx, sectionEnd, innerStart: startIdx + CLADE_START_MARKER.length, innerEnd: endIdx };
}

/**
 * Locates the User Rules section (after <!-- /cluster-promote appends here -->
 * and before <!-- CLADE:START -->) and idempotently appends @rules/NAME.md.
 *
 * @param {string} content    - full CLAUDE.md content
 * @param {string} ruleName   - rule name without extension
 * @returns {{ newContent: string, alreadyExists: boolean, markerNotFound: boolean }}
 */
function addRuleToContent(content, ruleName) {
  const ruleEntry = '@rules/' + ruleName + '.md';

  // Check for duplicate (entire file)
  if (content.includes(ruleEntry)) {
    return { newContent: content, alreadyExists: true, markerNotFound: false };
  }

  // Find the User Rules marker
  const markerIdx = content.indexOf(USER_RULES_MARKER);
  if (markerIdx === -1) {
    return { newContent: content, alreadyExists: false, markerNotFound: true };
  }

  // Find CLADE:START (end boundary of User Rules block)
  const cladeStartIdx = content.indexOf(CLADE_START_MARKER, markerIdx);

  // Scan the User Rules block for the last @rules/ line
  const userRulesBlock = cladeStartIdx === -1
    ? content.slice(markerIdx)
    : content.slice(markerIdx, cladeStartIdx);

  const lines = userRulesBlock.split('\n');
  let lastRulesLineOffset = -1;
  let offset = 0;
  for (const line of lines) {
    if (line.startsWith('@rules/')) {
      lastRulesLineOffset = markerIdx + offset + line.length;
    }
    offset += line.length + 1; // +1 for '\n'
  }

  let insertPos;
  if (lastRulesLineOffset !== -1) {
    // Insert after the last @rules/ line
    insertPos = content.indexOf('\n', lastRulesLineOffset) + 1;
  } else {
    // No @rules/ lines yet — insert after the marker line
    insertPos = content.indexOf('\n', markerIdx) + 1;
  }

  const before = content.slice(0, insertPos);
  const after = content.slice(insertPos);
  const newContent = before + ruleEntry + '\n' + after;

  return { newContent, alreadyExists: false, markerNotFound: false };
}

/**
 * Removes the @rules/NAME.md line from CLAUDE.md.
 *
 * @param {string} content    - full CLAUDE.md content
 * @param {string} ruleName   - rule name without extension
 * @returns {{ newContent: string, notFound: boolean }}
 */
function removeRuleFromContent(content, ruleName) {
  const ruleEntry = '@rules/' + ruleName + '.md';

  // Check if the entry exists
  if (!content.includes(ruleEntry)) {
    return { newContent: content, notFound: true };
  }

  // Remove the matching line (including its newline), handling both CRLF and LF
  const newContent = content
    .replace(ruleEntry + '\r\n', '')
    .replace(ruleEntry + '\n', '');

  return { newContent, notFound: false };
}

// ---------------------------------------------------------------------------
// Subcommand: add-rule
// ---------------------------------------------------------------------------

/**
 * Entry point for the add-rule subcommand.
 * @param {string[]} args - arguments after the subcommand name
 */
function commandAddRule(args) {
  const dryRunIdx = args.indexOf('--dry-run');
  const isDryRun = dryRunIdx !== -1;

  // Remove --dry-run from positional args
  const positional = args.filter((a, i) => i !== dryRunIdx);
  const ruleName = positional[0];

  if (!ruleName) {
    log('Error: rule name is required. Usage: add-rule NAME [--dry-run]');
    process.exit(1);
  }

  // Validate rule name (prevent path traversal)
  if (ruleName.includes('/') || ruleName.includes('\\') || ruleName.includes('..')) {
    log('Error: invalid rule name "' + ruleName + '"');
    process.exit(1);
  }

  const claudeMdPath = getClaudeMdPath();

  // Read file
  let content;
  try {
    content = fs.readFileSync(claudeMdPath, 'utf8');
  } catch (err) {
    log('Error: failed to read ' + claudeMdPath + ': ' + err.message);
    process.exit(1);
  }

  // Apply changes
  const result = addRuleToContent(content, ruleName);

  if (result.markerNotFound) {
    log('CLADE markers not found in ' + claudeMdPath + '. No changes made.');
    process.exit(0);
  }

  if (result.alreadyExists) {
    log('@rules/' + ruleName + '.md already exists. No-op.');
    process.exit(2);
  }

  log('Adding @rules/' + ruleName + '.md to User Rules section in ' + claudeMdPath);

  if (isDryRun) {
    log('[dry-run] Would write the following content:');
    process.stderr.write('--- diff ---\n');
    const lines = result.newContent.split('\n');
    const originalLines = content.split('\n');
    for (let i = 0; i < Math.max(lines.length, originalLines.length); i++) {
      if (lines[i] !== originalLines[i]) {
        if (originalLines[i] !== undefined) process.stderr.write('- ' + originalLines[i] + '\n');
        if (lines[i] !== undefined) process.stderr.write('+ ' + lines[i] + '\n');
      }
    }
    process.stderr.write('--- end diff ---\n');
    process.exit(0);
  }

  // Write file
  try {
    fs.writeFileSync(claudeMdPath, result.newContent, 'utf8');
    log('Successfully added @rules/' + ruleName + '.md to User Rules section.');
  } catch (err) {
    log('Error: failed to write ' + claudeMdPath + ': ' + err.message);
    process.exit(1);
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Subcommand: remove-rule
// ---------------------------------------------------------------------------

/**
 * Entry point for the remove-rule subcommand.
 * @param {string[]} args - arguments after the subcommand name
 */
function commandRemoveRule(args) {
  const dryRunIdx = args.indexOf('--dry-run');
  const isDryRun = dryRunIdx !== -1;

  // Remove --dry-run from positional args
  const positional = args.filter((a, i) => i !== dryRunIdx);
  const ruleName = positional[0];

  if (!ruleName) {
    log('Error: rule name is required. Usage: remove-rule NAME [--dry-run]');
    process.exit(1);
  }

  // Validate rule name (prevent path traversal)
  if (ruleName.includes('/') || ruleName.includes('\\') || ruleName.includes('..')) {
    log('Error: invalid rule name "' + ruleName + '"');
    process.exit(1);
  }

  const claudeMdPath = getClaudeMdPath();

  // Read file
  let content;
  try {
    content = fs.readFileSync(claudeMdPath, 'utf8');
  } catch (err) {
    log('Error: failed to read ' + claudeMdPath + ': ' + err.message);
    process.exit(1);
  }

  // Apply removal
  const result = removeRuleFromContent(content, ruleName);

  if (result.notFound) {
    log('@rules/' + ruleName + '.md not found. No-op.');
    process.exit(2);
  }

  log('Removing @rules/' + ruleName + '.md from ' + claudeMdPath);

  if (isDryRun) {
    log('[dry-run] Would write the following content:');
    process.stderr.write('--- diff ---\n');
    const lines = result.newContent.split('\n');
    const originalLines = content.split('\n');
    for (let i = 0; i < Math.max(lines.length, originalLines.length); i++) {
      if (lines[i] !== originalLines[i]) {
        if (originalLines[i] !== undefined) process.stderr.write('- ' + originalLines[i] + '\n');
        if (lines[i] !== undefined) process.stderr.write('+ ' + lines[i] + '\n');
      }
    }
    process.stderr.write('--- end diff ---\n');
    process.exit(0);
  }

  // Write file
  try {
    fs.writeFileSync(claudeMdPath, result.newContent, 'utf8');
    log('Successfully removed @rules/' + ruleName + '.md.');
  } catch (err) {
    log('Error: failed to write ' + claudeMdPath + ': ' + err.message);
    process.exit(1);
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (!subcommand) {
    log('Error: subcommand required. Available: add-rule, remove-rule');
    process.exit(1);
  }

  switch (subcommand) {
    case 'add-rule':
      commandAddRule(args.slice(1));
      break;
    case 'remove-rule':
      commandRemoveRule(args.slice(1));
      break;
    default:
      log('Error: unknown subcommand "' + subcommand + '". Available: add-rule, remove-rule');
      process.exit(1);
  }
}

main();
