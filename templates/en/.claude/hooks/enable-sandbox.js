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
  if (!fs.existsSync(SETTINGS_PATH)) {
    console.error('[enable-sandbox] settings.json not found:', SETTINGS_PATH);
    return { success: false, alreadyEnabled: false };
  }

  const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
  const settings = JSON.parse(raw);

  if (settings.sandbox === true) {
    console.log('[enable-sandbox] Sandbox is already enabled.');
    return { success: true, alreadyEnabled: true };
  }

  settings.sandbox = true;
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
