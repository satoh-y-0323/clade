#!/usr/bin/env node
// check-writes-isolation.js
// Claude Code hook: PreToolUse (for worktree-developer only)
// Blocks writes/deletions outside the declared file scope (writes)
//
// How it works:
//   1. worktree-developer writes .claude/tmp/worktree-writes.json at startup
//   2. This hook reads that file and blocks Write/Edit/rm outside the allowed patterns
//   3. If the file does not exist, the hook treats the session as non-parallel and passes through

'use strict';
const fs   = require('fs');
const path = require('path');
const { readHookInput } = require('./hook-utils');

const hookInput = readHookInput();
const toolName  = hookInput.tool_name || '';
const toolInput = hookInput.tool_input || {};

// Validate cwd before use (guard against tampering)
const rawCwd = hookInput.cwd || process.cwd();
if (!path.isAbsolute(rawCwd)) {
  // If cwd is a relative path, treat it as invalid input and pass through (safe fallback)
  process.exit(0);
}
const cwd = path.resolve(rawCwd);

// Read worktree-writes.json (if absent → non-parallel mode → pass through)
// configPath is derived from cwd using a fixed relative path (uses resolved cwd to prevent path manipulation)
const configPath = path.join(cwd, '.claude', 'tmp', 'worktree-writes.json');

function loadAllowedPatterns(cfgPath) {
  try {
    const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    // config.reads is for read-scope limiting (reserved for future use). Not referenced in this hook.
    // Filter out non-string elements to prevent crashes. Empty strings are also excluded because
    // an empty pattern could cause unintended matchGlob matches.
    return Array.isArray(config.writes)
      ? config.writes.filter(p => typeof p === 'string' && p.length > 0)
      : [];
  } catch (e) {
    if (e.code !== 'ENOENT') {
      // File exists but failed to parse — warn (possible config file corruption).
      // ENOENT (file not found) is treated as non-parallel mode and is normal.
      process.stderr.write(`[check-writes-isolation] WARNING: failed to parse ${cfgPath}: ${e.message}\n`);
    }
    return null; // null = non-parallel mode
  }
}

const allowedPatterns = loadAllowedPatterns(configPath);
if (allowedPatterns === null || allowedPatterns.length === 0) process.exit(0);

// Collect target file paths to check
let targetFiles = [];

if (toolName === 'Write' || toolName === 'Edit') {
  // Both Write and Edit use tool_input.file_path (Claude Code hook spec)
  const fp = toolInput.file_path || '';
  if (fp) targetFiles.push(fp);

} else if (toolName === 'Bash') {
  const cmd = toolInput.command || '';
  // Extract rm command targets (handles quotes and compound commands)
  targetFiles = extractRmTargets(cmd);
  if (targetFiles.length === 0) process.exit(0);

} else {
  process.exit(0);
}

// Normalize paths and match against allowed patterns
// normalizedCwdSlash: backslashes converted to forward slashes, trailing slash guaranteed
// (the trailing slash prevents "C:/foo/bar" from prefix-matching "C:/foo/barbaz")
const normalizedCwdSlash = (cwd.replace(/\\/g, '/').replace(/\/$/, '')) + '/';

const violations = [];

for (const rawPath of targetFiles) {
  // Resolve relative paths against cwd to get absolute paths and resolve ..
  const absPath = path.isAbsolute(rawPath)
    ? path.normalize(rawPath)
    : path.resolve(cwd, rawPath);

  let fp = absPath.replace(/\\/g, '/');

  // Convert to a path relative to the worktree root (block immediately if outside the worktree)
  if (!fp.startsWith(normalizedCwdSlash)) {
    violations.push({ file: rawPath, reason: 'PATH_OUTSIDE_WORKTREE' });
    continue;
  }
  fp = fp.slice(normalizedCwdSlash.length);

  // Only allow writes to the minimum required paths under .claude/
  // Prevents hook disabling or privilege escalation via hooks/settings tampering
  if (fp.startsWith('.claude/')) {
    if (isDangerousClaudePath(fp)) {
      violations.push({ file: rawPath, reason: 'CLAUDE_PROTECTED_PATH' });
    }
    // Non-dangerous .claude/ paths pass through
    continue;
  }

  if (!isAllowed(fp, allowedPatterns)) {
    violations.push({ file: rawPath, reason: 'WRITES_ISOLATION_VIOLATION' });
  }
}

if (violations.length > 0) {
  block(violations);
}

process.exit(0);

// ===== Helper functions =====

/**
 * Determines whether a path under .claude/ is one that worktree-developer must not write to.
 * Writes to hooks and settings files can lead to privilege escalation or hook disabling.
 */
function isDangerousClaudePath(fp) {
  // Prevent tampering with scripts under .claude/hooks/
  if (fp.startsWith('.claude/hooks/')) return true;
  // Prevent tampering with .claude/settings*.json
  if (/^\.claude\/settings[^/]*\.json$/.test(fp)) return true;
  // Prevent expanding allowed patterns by overwriting worktree-writes.json itself
  if (fp === '.claude/tmp/worktree-writes.json') return true;
  return false;
}

function isAllowed(filePath, patterns) {
  return patterns.some(pattern => matchGlob(filePath, pattern));
}

/**
 * Converts a glob pattern to a safe regex and tests for a match.
 *
 * ReDoS mitigations:
 *   - Pattern length is limited to 200 characters
 *   - Consecutive * other than ** is forbidden (e.g. a*b*c*d is OK, a*** is not)
 *   - The converted regex uses only simple substitutions that run in linear time
 */
function matchGlob(filePath, pattern) {
  const normalized = filePath.replace(/\\/g, '/');
  const pat        = pattern.replace(/\\/g, '/');

  // ReDoS guard: pattern length check
  if (pat.length > 200) return false;

  // ReDoS guard: reject 3+ consecutive asterisks (** is legal, *** or more is not)
  if (/\*{3,}/.test(pat)) return false;

  const regexStr = pat
    // Convert glob special characters to placeholders before escaping regex meta-chars
    .replace(/\*\*/g, '\x00')    // ** → placeholder-A (any path)
    .replace(/\*/g,   '\x01')    // *  → placeholder-B (single segment)
    .replace(/\?/g,   '\x02')    // ?  → placeholder-C (one character)
    // Escape regex meta-characters (* and ? are already replaced)
    .replace(/[.+^${}()|[\]-]/g, '\\$&')
    // Convert placeholders to regex
    .replace(/\x00/g, '.*')      // ** → any path
    .replace(/\x01/g, '[^/]*')   // *  → single segment
    .replace(/\x02/g, '[^/]');   // ?  → one character other than /

  return new RegExp('^' + regexStr + '$').test(normalized);
}

/**
 * Extracts target file paths from an rm command.
 *
 * Algorithm:
 *   1. Tokenize the entire command string with tokenizeShellArgs
 *      (tokenize first so that ; | && inside quotes are not treated as delimiters)
 *   2. Split the token list into subcommands at &&, ||, and ; tokens
 *   3. Collect targets from subcommands that start with rm
 */
function extractRmTargets(cmd) {
  // Tokenize the full command with quote awareness
  // This ensures ; | inside quotes are not mistakenly used as delimiters
  const allTokens = tokenizeShellArgs(cmd);

  // Split token list into subcommands at &&, ||, ;, and | tokens
  // | is a pipe (output redirect), but we split here to avoid treating post-pipe tokens as rm args
  const subcommands = [];
  let current = [];
  for (const token of allTokens) {
    if (token === '&&' || token === '||' || token === ';' || token === '|') {
      if (current.length > 0) {
        subcommands.push(current);
        current = [];
      }
    } else {
      current.push(token);
    }
  }
  if (current.length > 0) subcommands.push(current);

  // Helper to detect redirect operator tokens (space-separated form)
  // Examples: '>', '>>', '<', '2>', '2>>', '1>', '&>'
  // The combined form ('2>/dev/null' etc.) stays inside the token and is handled by isRedirectCombined
  function isRedirectOperator(token) {
    if (/^[0-9]*>>?$/.test(token)) return true;
    if (/^[0-9]*<$/.test(token)) return true;
    if (/^&>>?$/.test(token)) return true;
    return false;
  }

  // Helper to detect combined-form redirects (operator and destination in the same token, no space).
  // isRedirectOperator handles the space-separated form ('>' '2>' etc. as standalone tokens).
  // This function handles the combined form where operator and path are concatenated.
  // Examples: '2>/dev/null', '>/tmp/log', '>>/tmp/log', '</dev/stdin', '&>/dev/null'
  // Covers fd-prefixed, plain, append, input, and &> forms.
  // The trailing [^>] in the '>>' pattern excludes '>>' as a standalone operator
  // (already covered by isRedirectOperator in the space-separated form).
  function isRedirectCombined(token) {
    return /^[0-9]*>>?[^>]/.test(token) || /^[0-9]*<[^<]/.test(token) || /^&>>?[^>]/.test(token);
  }

  const targets = [];

  for (const tokens of subcommands) {
    // Only process subcommands that start with rm
    if (tokens.length === 0 || tokens[0] !== 'rm') continue;

    // Process tokens after rm
    // After --, dash-prefixed tokens are treated as filenames (end-of-options marker)
    let endOfOptions = false;
    for (let idx = 1; idx < tokens.length; idx++) {
      const token = tokens[idx];
      if (token === '--') {
        // -- is the end-of-options marker; not a filename, skip it
        endOfOptions = true;
        continue;
      }
      // Space-separated redirect operator: skip the operator token and the following destination token
      if (isRedirectOperator(token)) {
        idx++; // skip the redirect destination token
        continue;
      }
      // Combined-form redirect (e.g. '2>/dev/null'): skip the entire token
      if (isRedirectCombined(token)) {
        continue;
      }
      if (!endOfOptions && token.startsWith('-')) {
        // Before --, dash-prefixed tokens are options; exclude them
        continue;
      }
      if (token.length === 0) continue;
      // Skip tokens containing subshell expansion $(...) or variable expansion $VAR (unparseable)
      if (token.includes('$') || token.includes('`')) continue;
      targets.push(token);
    }
  }

  return targets;
}

/**
 * Tokenizes a shell argument string into tokens.
 * Treats strings enclosed in single or double quotes as a single token.
 * Handles backslash escapes outside quotes (next character is treated as a literal).
 * Returns &&, ||, and ; as standalone operator tokens.
 */
function tokenizeShellArgs(argsStr) {
  const tokens = [];
  let current = '';
  let i = 0;

  while (i < argsStr.length) {
    const ch = argsStr[i];

    if (ch === "'") {
      // Single quote: read until the next ' (or end of string if unterminated)
      i++;
      while (i < argsStr.length && argsStr[i] !== "'") {
        current += argsStr[i];
        i++;
      }
      if (i < argsStr.length) i++; // skip closing quote (only if present)

    } else if (ch === '"') {
      // Double quote: read until the next " (with backslash escape support)
      i++;
      while (i < argsStr.length && argsStr[i] !== '"') {
        if (argsStr[i] === '\\' && i + 1 < argsStr.length) {
          i++; // skip backslash
          current += argsStr[i];
        } else {
          current += argsStr[i];
        }
        i++;
      }
      if (i < argsStr.length) i++; // skip closing quote (only if present)

    } else if (ch === '\\') {
      // Backslash escape outside quotes: treat the next character as a literal
      // (e.g. rm file\ name.txt → "file name.txt" as a single token)
      //
      // Edge case — backslash-escaped pipe (\|):
      //   rm /allowed/path \| rm /protected/path
      //   → The \ here is consumed and | is appended to current
      //   → Result: "/allowed/path|" is one token; "rm" "/protected/path" follow as separate tokens
      //   → | does NOT become a standalone token, so extractRmTargets' pipe-split does not fire here
      //   → "/protected/path" is collected as a target of the next rm subcommand
      //   This differs from actual shell behavior (\| passes a literal | to the command), but for
      //   target collection it errs on the safe side (collecting more targets rather than fewer).
      if (i + 1 < argsStr.length) {
        i++;
        current += argsStr[i];
      }
      i++;

    } else if (ch === '&' && i + 1 < argsStr.length && argsStr[i + 1] === '&') {
      // && as a standalone token
      if (current.length > 0) { tokens.push(current); current = ''; }
      tokens.push('&&');
      i += 2;

    } else if (ch === '|' && i + 1 < argsStr.length && argsStr[i + 1] === '|') {
      // || as a standalone token
      if (current.length > 0) { tokens.push(current); current = ''; }
      tokens.push('||');
      i += 2;

    } else if (ch === ';') {
      // ; as a standalone token
      if (current.length > 0) { tokens.push(current); current = ''; }
      tokens.push(';');
      i++;

    } else if (ch === ' ' || ch === '\t') {
      // Space: token delimiter
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      i++;

    } else {
      current += ch;
      i++;
    }
  }

  if (current.length > 0) tokens.push(current);
  return tokens;
}

function block(violations) {
  // Do not include allowed_patterns in stderr output (prevents information leakage for bypass)
  const msg = JSON.stringify({
    violations: violations.map(v => ({ type: v.reason, file: v.file })),
    action: 'BLOCKED',
  });
  process.stderr.write(msg + '\n');
  process.exit(2);
}
