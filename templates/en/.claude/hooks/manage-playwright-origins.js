#!/usr/bin/env node
// Playwright allowed origins management script
// Usage:
//   node .claude/hooks/manage-playwright-origins.js list
//   node .claude/hooks/manage-playwright-origins.js add <origin>
//   node .claude/hooks/manage-playwright-origins.js remove <origin>
//
// Design Policy:
//   - settings.json (base) is never modified
//   - Additional origins are written to settings.local.json under mcpServers.playwright
//   - When the number of additional origins reaches 0, the playwright entry is removed from
//     settings.local.json, and the base configuration in settings.json (localhost only) is restored

const fs = require('fs');
const path = require('path');

const SETTINGS_LOCAL_PATH = path.join(process.cwd(), '.claude', 'settings.local.json');

// Base origins defined in settings.json (cannot be modified)
const BASE_ORIGINS = [
  'http://localhost:*',
  'https://localhost:*',
  'http://127.0.0.1:*',
  'https://127.0.0.1:*',
];

function readSettingsLocal() {
  if (!fs.existsSync(SETTINGS_LOCAL_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_LOCAL_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeSettingsLocal(data) {
  fs.writeFileSync(SETTINGS_LOCAL_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function getExtraOrigins(settings) {
  const args = settings?.mcpServers?.playwright?.args || [];
  const idx = args.indexOf('--allowed-origins');
  if (idx === -1) return [];
  const originsStr = args[idx + 1] || '';
  return originsStr
    .split(';')
    .map(o => o.trim())
    .filter(o => o !== '' && !BASE_ORIGINS.includes(o));
}

function buildPlaywrightEntry(extraOrigins) {
  const allOrigins = [...BASE_ORIGINS, ...extraOrigins].join(';');
  return {
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest', '--allowed-origins', allOrigins],
  };
}

const [, , command, origin] = process.argv;
const settings = readSettingsLocal();

if (command === 'list') {
  const extras = getExtraOrigins(settings);

  console.log('=== Playwright Allowed Origins ===\n');
  console.log('[Base (settings.json / cannot be modified)]');
  BASE_ORIGINS.forEach(o => console.log('  ' + o));

  if (extras.length === 0) {
    console.log('\n[Additional Origins (settings.local.json)]\n  None');
    console.log('\n→ Base configuration from settings.json is currently active.');
  } else {
    console.log('\n[Additional Origins (settings.local.json)]');
    extras.forEach(o => console.log('  ' + o));
    console.log('\n→ settings.local.json is active (base + additional origins).');
  }

} else if (command === 'add') {
  if (!origin) {
    console.error('Error: Please specify an origin.');
    console.error('Example: node .claude/hooks/manage-playwright-origins.js add https://staging.example.com');
    process.exit(1);
  }

  if (BASE_ORIGINS.includes(origin)) {
    console.log(`"${origin}" is already included in the base origins. No need to add.`);
    process.exit(0);
  }

  const extras = getExtraOrigins(settings);
  if (extras.includes(origin)) {
    console.log(`"${origin}" has already been added.`);
    process.exit(0);
  }

  extras.push(origin);
  settings.mcpServers = settings.mcpServers || {};
  settings.mcpServers.playwright = buildPlaywrightEntry(extras);
  writeSettingsLocal(settings);

  console.log(`Added "${origin}".`);
  console.log('Restart Claude Code for the change to take effect.');

} else if (command === 'remove') {
  if (!origin) {
    console.error('Error: Please specify the origin to remove.');
    console.error('Example: node .claude/hooks/manage-playwright-origins.js remove https://staging.example.com');
    process.exit(1);
  }

  if (BASE_ORIGINS.includes(origin)) {
    console.error(`"${origin}" is a base origin (settings.json) and cannot be removed.`);
    process.exit(1);
  }

  const extras = getExtraOrigins(settings);
  const newExtras = extras.filter(o => o !== origin);

  if (newExtras.length === extras.length) {
    console.log(`"${origin}" was not found in the additional origins.`);
    process.exit(0);
  }

  if (newExtras.length === 0) {
    // Remove the playwright entry from settings.local.json since there are no more additional origins
    if (settings.mcpServers) {
      delete settings.mcpServers.playwright;
      if (Object.keys(settings.mcpServers).length === 0) {
        delete settings.mcpServers;
      }
    }
    console.log(`Removed "${origin}".`);
    console.log('No more additional origins. Reverting to the base configuration in settings.json (localhost only).');
  } else {
    settings.mcpServers = settings.mcpServers || {};
    settings.mcpServers.playwright = buildPlaywrightEntry(newExtras);
    console.log(`Removed "${origin}".`);
  }

  writeSettingsLocal(settings);
  console.log('Restart Claude Code for the change to take effect.');

} else {
  console.log('Usage:');
  console.log('  node .claude/hooks/manage-playwright-origins.js list');
  console.log('  node .claude/hooks/manage-playwright-origins.js add <origin>');
  console.log('  node .claude/hooks/manage-playwright-origins.js remove <origin>');
  process.exit(1);
}
