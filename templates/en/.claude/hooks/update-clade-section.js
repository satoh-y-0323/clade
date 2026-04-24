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
 * Locates the User Rules section (after <!-- /cluster-promote appends here -->
 * and before <!-- CLADE:START -->) and idempotently appends @rules/NAME.md.
 *
 * Offset calculation is LF (\n) based. In CRLF files each line retains a
 * trailing \r after split('\n'), so line.length includes \r. The final
 * insertion position is resolved via content.indexOf('\n', lastRulesLineOffset),
 * which directly locates the \n character, so CRLF files are handled correctly.
 * (CRLF-compatible)
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
    // Fall back to end-of-file if indexOf returns -1 (no trailing newline)
    const nlPos = content.indexOf('\n', lastRulesLineOffset);
    insertPos = nlPos === -1 ? content.length : nlPos + 1;
  } else {
    // No @rules/ lines yet — insert after the marker line
    const nlPos = content.indexOf('\n', markerIdx);
    insertPos = nlPos === -1 ? content.length : nlPos + 1;
  }

  const before = content.slice(0, insertPos);
  const after = content.slice(insertPos);
  const newContent = before + ruleEntry + '\n' + after;

  return { newContent, alreadyExists: false, markerNotFound: false };
}

/**
 * Removes the @rules/NAME.md line from the User Rules section of CLAUDE.md.
 * The search is scoped to the User Rules section (USER_RULES_MARKER through
 * CLADE_START_MARKER) to prevent accidental deletion of the same string
 * appearing elsewhere in the file (e.g. in comments or examples).
 * Handles both CRLF and LF line endings. Uses replaceAll to remove duplicates.
 *
 * @param {string} content    - full CLAUDE.md content
 * @param {string} ruleName   - rule name without extension
 * @returns {{ newContent: string, notFound: boolean }}
 */
function removeRuleFromContent(content, ruleName) {
  const ruleEntry = '@rules/' + ruleName + '.md';

  // Find the User Rules marker
  const markerIdx = content.indexOf(USER_RULES_MARKER);
  if (markerIdx === -1 || !content.includes(ruleEntry)) {
    return { newContent: content, notFound: true };
  }

  // Determine the end of the User Rules section (just before CLADE:START, or EOF)
  const cladeStartIdx = content.indexOf(CLADE_START_MARKER, markerIdx);
  const searchEnd = cladeStartIdx === -1 ? content.length : cladeStartIdx;

  // Check that the entry actually exists within the User Rules section
  const sectionContent = content.slice(markerIdx, searchEnd);
  if (!sectionContent.includes(ruleEntry)) {
    return { newContent: content, notFound: true };
  }

  // Remove all occurrences within the section, handling both CRLF and LF.
  // The final replaceAll handles the edge case where ruleEntry is the last line
  // with no trailing newline (e.g. file does not end with a newline).
  const newSection = sectionContent
    .replaceAll(ruleEntry + '\r\n', '')
    .replaceAll(ruleEntry + '\n', '')
    .replaceAll(ruleEntry, '');

  return {
    newContent: content.slice(0, markerIdx) + newSection + content.slice(searchEnd),
    notFound: false,
  };
}

// ---------------------------------------------------------------------------
// Shared subcommand utilities
// ---------------------------------------------------------------------------

/**
 * Parses subcommand arguments into { isDryRun, ruleName } and validates the rule name.
 * Calls process.exit(1) on validation failure.
 * @param {string[]} args - arguments after the subcommand name
 * @param {string} usage - usage string shown on error
 * @returns {{ isDryRun: boolean, ruleName: string }}
 */
function parseRuleCommandArgs(args, usage) {
  const dryRunIdx = args.indexOf('--dry-run');
  const isDryRun = dryRunIdx !== -1;

  // Remove --dry-run from positional args
  const positional = args.filter((a, i) => i !== dryRunIdx);
  const ruleName = positional[0];

  if (!ruleName) {
    log('Error: rule name is required. Usage: ' + usage);
    process.exit(1);
  }

  // Validate rule name (allow only alphanumeric, underscore, hyphen)
  // Rejects null bytes, control characters, and path traversal patterns
  if (!/^[\w\-]+$/.test(ruleName)) {
    log('Error: invalid rule name "' + ruleName + '" (only alphanumeric, underscore, hyphen allowed)');
    process.exit(1);
  }

  return { isDryRun, ruleName };
}

/**
 * Reads CLAUDE.md and returns its content. Calls process.exit(1) on failure.
 * @param {string} claudeMdPath
 * @returns {string}
 */
function readClaudeMd(claudeMdPath) {
  try {
    return fs.readFileSync(claudeMdPath, 'utf8');
  } catch (err) {
    log('Error: failed to read ' + claudeMdPath + ': ' + err.message);
    process.exit(1);
  }
}

/**
 * Compares original and updated content line by line and prints a diff to stderr.
 * @param {string} original - content before changes
 * @param {string} updated  - content after changes
 */
function printDiff(original, updated) {
  log('[dry-run] Would write the following content:');
  process.stderr.write('--- diff ---\n');
  const lines = updated.split('\n');
  const originalLines = original.split('\n');
  for (let i = 0; i < Math.max(lines.length, originalLines.length); i++) {
    if (lines[i] !== originalLines[i]) {
      if (originalLines[i] !== undefined) process.stderr.write('- ' + originalLines[i] + '\n');
      if (lines[i] !== undefined) process.stderr.write('+ ' + lines[i] + '\n');
    }
  }
  process.stderr.write('--- end diff ---\n');
}

/**
 * Writes content to CLAUDE.md. Calls process.exit(1) on failure.
 * @param {string} claudeMdPath
 * @param {string} content
 */
function writeClaudeMd(claudeMdPath, content) {
  try {
    fs.writeFileSync(claudeMdPath, content, 'utf8');
  } catch (err) {
    log('Error: failed to write ' + claudeMdPath + ': ' + err.message);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Subcommand: add-rule
// ---------------------------------------------------------------------------

/**
 * Entry point for the add-rule subcommand.
 * @param {string[]} args - arguments after the subcommand name
 */
function commandAddRule(args) {
  const { isDryRun, ruleName } = parseRuleCommandArgs(args, 'add-rule NAME [--dry-run]');
  const claudeMdPath = getClaudeMdPath();
  const content = readClaudeMd(claudeMdPath);

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
    printDiff(content, result.newContent);
    process.exit(0);
  }

  writeClaudeMd(claudeMdPath, result.newContent);
  log('Successfully added @rules/' + ruleName + '.md to User Rules section.');
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
  const { isDryRun, ruleName } = parseRuleCommandArgs(args, 'remove-rule NAME [--dry-run]');
  const claudeMdPath = getClaudeMdPath();
  const content = readClaudeMd(claudeMdPath);

  // Apply removal
  const result = removeRuleFromContent(content, ruleName);

  if (result.notFound) {
    log('@rules/' + ruleName + '.md not found. No-op.');
    process.exit(2);
  }

  log('Removing @rules/' + ruleName + '.md from ' + claudeMdPath);

  if (isDryRun) {
    printDiff(content, result.newContent);
    process.exit(0);
  }

  writeClaudeMd(claudeMdPath, result.newContent);
  log('Successfully removed @rules/' + ruleName + '.md.');
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
