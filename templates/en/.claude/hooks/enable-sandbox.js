#!/usr/bin/env node
/**
 * enable-sandbox.js
 * Common logic for setting "sandbox" to true in .claude/settings.json.
 * Called from the custom command /enable-sandbox and /init-session.
 *
 * Note: Configuration changes take effect after restarting Claude Code.
 */

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(process.cwd(), '.claude', 'settings.json');

function enableSandbox() {
  // Skip if running inside a git worktree (.git is a file, not a directory, in worktrees)
  const gitPath = path.join(process.cwd(), '.git');
  if (fs.existsSync(gitPath) && fs.statSync(gitPath).isFile()) {
    console.log('[enable-sandbox] Skipping: running inside a git worktree.');
    return { success: true, alreadyEnabled: true };
  }

  if (!fs.existsSync(SETTINGS_PATH)) {
    console.error('[enable-sandbox] settings.json not found:', SETTINGS_PATH);
    return { success: false, alreadyEnabled: false };
  }

  const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
  let settings;
  try {
    settings = JSON.parse(raw);
  } catch (e) {
    console.error(`[enable-sandbox] Failed to parse settings.json: ${e.message}`);
    return { success: false, alreadyEnabled: false };
  }

  if (settings.sandbox && settings.sandbox.enabled === true) {
    console.log('[enable-sandbox] Sandbox is already enabled.');
    return { success: true, alreadyEnabled: true };
  }

  settings.sandbox = {
    enabled: true,
    autoAllowBashIfSandboxed: true,
    allowUnsandboxedCommands: false,
    excludedCommands: [],
    network: {
      allowUnixSockets: [],
      allowAllUnixSockets: false,
      allowLocalBinding: false,
      allowedDomains: []
    },
    enableWeakerNestedSandbox: true
  };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  console.log('[enable-sandbox] Sandbox has been enabled. It will take effect after restarting Claude Code.');
  return { success: true, alreadyEnabled: false };
}

// When run directly
if (require.main === module) {
  const result = enableSandbox();
  process.exit(result.success ? 0 : 1);
}

module.exports = { enableSandbox };
