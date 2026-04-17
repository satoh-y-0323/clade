#!/usr/bin/env node
/**
 * clade-update.js (English edition)
 * clade framework update script
 *
 * This is the English edition: files are sourced from templates/en/.claude/
 * in the release and applied to the project's .claude/ directory.
 *
 * Usage:
 *   node .claude/hooks/clade-update.js --check
 *   node .claude/hooks/clade-update.js --apply
 *   node .claude/hooks/clade-update.js --rollback
 */

'use strict';

const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

// ============================================================
// Constants
// ============================================================
const GITHUB_API_HOST = 'api.github.com';
const GITHUB_REPO = 'satoh-y-0323/clade';
const RELEASES_LATEST_PATH = `/repos/${GITHUB_REPO}/releases/latest`;

const CLADE_MARKER_START = '<!-- CLADE:START -->';
const CLADE_MARKER_END = '<!-- CLADE:END -->';

const BACKUP_COMMIT_PREFIX = 'chore: backup before clade update to';

// English edition: source files from templates/en/.claude/ in the release
const RELEASE_SRC_PREFIX = 'templates/en/.claude/';

// ============================================================
// Helpers: HTTP
// ============================================================

function fetchGitHubToken() {
  try {
    const result = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  } catch (_) {
    // ignore if gh is not available
  }
  return null;
}

function httpsGet(host, urlPath, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path: urlPath,
      method: 'GET',
      headers: {
        'User-Agent': 'clade-update/1.0',
        Accept: 'application/vnd.github+json',
        ...extraHeaders,
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location);
        httpsGet(redirectUrl.hostname, redirectUrl.pathname + redirectUrl.search, extraHeaders)
          .then(resolve)
          .catch(reject);
        return;
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(new Error('Request timed out')); });
    req.end();
  });
}

function httpsDownload(url, extraHeaders = {}) {
  const ALLOWED_HOSTS = ['api.github.com', 'codeload.github.com', 'objects.githubusercontent.com'];

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'clade-update/1.0',
        ...extraHeaders,
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location);
        const safeHeaders = ALLOWED_HOSTS.includes(redirectUrl.hostname)
          ? extraHeaders
          : Object.fromEntries(
              Object.entries(extraHeaders).filter(([k]) => k.toLowerCase() !== 'authorization')
            );
        httpsDownload(res.headers.location, safeHeaders).then(resolve).catch(reject);
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
        } else {
          resolve(Buffer.concat(chunks));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(new Error('Download timed out')); });
    req.end();
  });
}

// ============================================================
// Helpers: File system
// ============================================================

let _projectRootOverride = null;

function getProjectRoot() {
  if (_projectRootOverride) {
    return _projectRootOverride;
  }
  // Two levels up from .claude/hooks/ is the project root
  return path.resolve(__dirname, '..', '..');
}

function getVersionFilePath(versionFile) {
  if (versionFile) {
    return versionFile;
  }
  return path.join(getProjectRoot(), '.claude', 'VERSION');
}

function readLocalVersion(versionFile) {
  const filePath = getVersionFilePath(versionFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`VERSION file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8').trim();
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(sourcePath, destPath) {
  ensureDirectory(path.dirname(destPath));
  fs.copyFileSync(sourcePath, destPath);
}

// ============================================================
// Helpers: git
// ============================================================

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd: cwd || getProjectRoot(),
    encoding: 'utf8',
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status ?? 1,
  };
}

function hasUncommittedChanges(cwd) {
  const result = runGit(['status', '--porcelain'], cwd);
  return result.stdout.trim().length > 0;
}

function isBackupCommitMessage(message) {
  return message.startsWith(BACKUP_COMMIT_PREFIX);
}

function getLatestCommitMessage(cwd) {
  const result = runGit(['log', '-1', '--format=%s'], cwd);
  return result.stdout.trim();
}

// ============================================================
// Helpers: GitHub API
// ============================================================

async function fetchLatestRelease() {
  const token = fetchGitHubToken();
  const extraHeaders = token ? { Authorization: `token ${token}` } : {};

  const responseText = await httpsGet(GITHUB_API_HOST, RELEASES_LATEST_PATH, extraHeaders);
  const release = JSON.parse(responseText);

  const tagName = (release.tag_name || '').replace(/^v/, '');

  if (!tagName || !/^[\w.\-]+$/.test(tagName)) {
    throw new Error(`Invalid version string: ${tagName}`);
  }

  const changelog = release.body || '';
  const zipballUrl = release.zipball_url || '';

  return { tagName, changelog, zipballUrl };
}

// ============================================================
// Helpers: Archive extraction
// ============================================================

async function extractZip(zipBuffer, destDir) {
  ensureDirectory(destDir);

  const zipPath = path.join(destDir, '_clade_release.zip');
  fs.writeFileSync(zipPath, zipBuffer);

  // Use PowerShell's Expand-Archive (Windows)
  const escapedZipPath = zipPath.replace(/'/g, "''");
  const escapedDestDir = destDir.replace(/'/g, "''");
  const result = spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Expand-Archive -Force -Path '${escapedZipPath}' -DestinationPath '${escapedDestDir}'`,
    ],
    { encoding: 'utf8' }
  );

  // Fall back to unzip if PowerShell is unavailable
  if (result.status !== 0) {
    const unzipResult = spawnSync('unzip', ['-o', '-q', zipPath, '-d', destDir], {
      encoding: 'utf8',
    });
    if (unzipResult.status !== 0) {
      throw new Error(`zip extraction failed: ${result.stderr || unzipResult.stderr}`);
    }
  }

  fs.unlinkSync(zipPath);
}

function findReleaseDir(extractDir) {
  const entries = fs.readdirSync(extractDir);
  const dirs = entries.filter((e) => {
    const stat = fs.statSync(path.join(extractDir, e));
    return stat.isDirectory();
  });

  if (dirs.length === 1) {
    return path.join(extractDir, dirs[0]);
  }
  const cladeDir = dirs.find((d) => d.includes('clade'));
  if (cladeDir) {
    return path.join(extractDir, cladeDir);
  }
  return extractDir;
}

// ============================================================
// Helpers: File copy logic (English edition)
//
// Source: <releaseDir>/templates/en/.claude/<subdir>/<file>
// Dest:   <projectRoot>/.claude/<subdir>/<file>
// ============================================================

/**
 * Copy managed files from the English template directory in the release
 * to the project's .claude/ directory.
 * @param {object} manifest
 * @param {string} releaseDir
 * @param {string} projectRoot
 */
function copyFilesFromManifest(manifest, releaseDir, projectRoot) {
  const managed = manifest.managed_files;

  // commands
  for (const file of managed.commands) {
    const srcPath = path.join(releaseDir, RELEASE_SRC_PREFIX, 'commands', file);
    if (!fs.existsSync(srcPath)) continue;
    const destPath = path.join(projectRoot, '.claude', 'commands', file);
    copyFile(srcPath, destPath);
  }

  // hooks (skip clade-update.js itself to avoid self-overwrite during update)
  for (const file of managed.hooks) {
    if (file === 'clade-update.js') continue;

    const srcPath = path.join(releaseDir, RELEASE_SRC_PREFIX, 'hooks', file);
    if (!fs.existsSync(srcPath)) continue;
    const destPath = path.join(projectRoot, '.claude', 'hooks', file);
    copyFile(srcPath, destPath);
  }

  // rules
  for (const file of managed.rules) {
    const srcPath = path.join(releaseDir, RELEASE_SRC_PREFIX, 'rules', file);
    if (!fs.existsSync(srcPath)) continue;
    const destPath = path.join(projectRoot, '.claude', 'rules', file);
    copyFile(srcPath, destPath);
  }

  // agents
  for (const file of (managed.agents || [])) {
    const srcPath = path.join(releaseDir, RELEASE_SRC_PREFIX, 'agents', file);
    if (!fs.existsSync(srcPath)) continue;
    const destPath = path.join(projectRoot, '.claude', 'agents', file);
    copyFile(srcPath, destPath);
  }

  // skills (top-level: .claude/skills/)
  for (const file of (managed.skills || [])) {
    const srcPath = path.join(releaseDir, RELEASE_SRC_PREFIX, 'skills', file);
    if (!fs.existsSync(srcPath)) continue;
    const destPath = path.join(projectRoot, '.claude', 'skills', file);
    copyFile(srcPath, destPath);
  }

  // agent_skills (.claude/skills/agents/)
  for (const file of (managed.agent_skills || [])) {
    const srcPath = path.join(releaseDir, RELEASE_SRC_PREFIX, 'skills', 'agents', file);
    if (!fs.existsSync(srcPath)) continue;
    const destPath = path.join(projectRoot, '.claude', 'skills', 'agents', file);
    copyFile(srcPath, destPath);
  }

  // other (CLAUDE.md, VERSION, clade-manifest.json are handled separately)
  for (const file of managed.other) {
    if (file === 'CLAUDE.md' || file === 'clade-manifest.json' || file === 'VERSION') {
      continue;
    }

    const srcPath = path.join(releaseDir, RELEASE_SRC_PREFIX, file);
    if (!fs.existsSync(srcPath)) continue;
    const destPath = path.join(projectRoot, '.claude', file);
    copyFile(srcPath, destPath);
  }
}

/**
 * Detect diffs for interactive files (settings.json / settings.local.json) and
 * place <target>.new next to the target when there are differences.
 * @param {object} manifest
 * @param {string} releaseDir
 * @param {string} projectRoot
 * @returns {Array<{target: string, new: string|null, isNew: boolean}>}
 */
function processInteractiveFiles(manifest, releaseDir, projectRoot) {
  const managed = manifest.managed_files;
  const interactiveFiles = managed.interactive_files || [];
  const diffs = [];

  for (const entry of interactiveFiles) {
    const sourceName = typeof entry === 'string' ? entry : entry.source;
    const targetName = typeof entry === 'string' ? entry : entry.target;

    const srcPath = path.join(releaseDir, RELEASE_SRC_PREFIX, sourceName);
    if (!fs.existsSync(srcPath)) continue;

    const targetPath = path.join(projectRoot, '.claude', targetName);
    const newPath = targetPath + '.new';
    const newContent = fs.readFileSync(srcPath, 'utf8');

    if (!fs.existsSync(targetPath)) {
      copyFile(srcPath, targetPath);
      if (fs.existsSync(newPath)) {
        try { fs.unlinkSync(newPath); } catch (_) {}
      }
      diffs.push({ target: targetPath, new: null, isNew: true });
      continue;
    }

    const existingContent = fs.readFileSync(targetPath, 'utf8');
    if (existingContent === newContent) {
      if (fs.existsSync(newPath)) {
        try { fs.unlinkSync(newPath); } catch (_) {}
      }
      continue;
    }

    ensureDirectory(path.dirname(newPath));
    fs.writeFileSync(newPath, newContent, 'utf8');
    diffs.push({ target: targetPath, new: newPath, isNew: false });
  }

  return diffs;
}

/**
 * Copy protected files only when the target does not yet exist
 * (memory/memory.json etc. are never overwritten to preserve user state).
 * @param {object} manifest
 * @param {string} releaseDir
 * @param {string} projectRoot
 */
function processProtectedFiles(manifest, releaseDir, projectRoot) {
  const managed = manifest.managed_files;
  const protectedFiles = managed.protected_files || [];

  for (const file of protectedFiles) {
    const srcPath = path.join(releaseDir, RELEASE_SRC_PREFIX, file);
    if (!fs.existsSync(srcPath)) continue;

    const destPath = path.join(projectRoot, '.claude', file);
    if (fs.existsSync(destPath)) continue;

    copyFile(srcPath, destPath);
  }
}

/**
 * Update only the CLADE marker section in CLAUDE.md.
 * Returns { markerMissing: boolean }.
 * @param {string} localClaudeMdPath
 * @param {string} releaseClaudeMdPath
 */
function updateClaudeMdMarkerSection(localClaudeMdPath, releaseClaudeMdPath) {
  if (!fs.existsSync(localClaudeMdPath)) {
    if (fs.existsSync(releaseClaudeMdPath)) {
      copyFile(releaseClaudeMdPath, localClaudeMdPath);
    }
    return { markerMissing: false };
  }

  const localContent = fs.readFileSync(localClaudeMdPath, 'utf8');
  const startIdx = localContent.indexOf(CLADE_MARKER_START);
  const endIdx   = localContent.indexOf(CLADE_MARKER_END);

  if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
    return { markerMissing: true };
  }

  if (!fs.existsSync(releaseClaudeMdPath)) {
    return { markerMissing: false };
  }

  const releaseContent  = fs.readFileSync(releaseClaudeMdPath, 'utf8');
  const releaseStartIdx = releaseContent.indexOf(CLADE_MARKER_START);
  const releaseEndIdx   = releaseContent.indexOf(CLADE_MARKER_END);

  let newMarkerSection;
  if (releaseStartIdx !== -1 && releaseEndIdx !== -1 && releaseStartIdx < releaseEndIdx) {
    newMarkerSection = releaseContent.substring(
      releaseStartIdx,
      releaseEndIdx + CLADE_MARKER_END.length
    );
  } else {
    newMarkerSection = `${CLADE_MARKER_START}\n${releaseContent}\n${CLADE_MARKER_END}`;
  }

  const before = localContent.substring(0, startIdx);
  const after  = localContent.substring(endIdx + CLADE_MARKER_END.length);
  fs.writeFileSync(localClaudeMdPath, before + newMarkerSection + after, 'utf8');
  return { markerMissing: false };
}

// ============================================================
// Mode: --check
// ============================================================

async function runCheckMode(options = {}) {
  const currentVersion = readLocalVersion(options.versionFile);
  const { tagName: latestVersion, changelog } = await fetchLatestRelease();
  const hasUpdate = currentVersion !== latestVersion;

  const result = {
    current_version: currentVersion,
    latest_version:  latestVersion,
    has_update:      hasUpdate,
    changelog,
    changes: {
      en: { added: [], updated: [], removed: [] },
    },
  };

  process.stdout.write(JSON.stringify(result) + '\n');
}

// ============================================================
// Mode: --apply
// ============================================================

/**
 * --apply mode main process
 *
 * Two-stage execution:
 *   Stage 1 (this function): Download zip → copy new clade-update.js to disk → spawn new process
 *   Stage 2 (runApplyFilesMode): New script copies all managed files → commit
 *
 * This ensures that even when new handlers are added to clade-update.js itself,
 * the new code is used within the same update run.
 */
async function runApplyMode() {
  const projectRoot = getProjectRoot();

  // 1. Fetch latest release info
  const token = fetchGitHubToken();
  const extraHeaders = token ? { Authorization: `token ${token}` } : {};
  const { tagName: latestVersion, zipballUrl } = await fetchLatestRelease();

  // 2. Create backup commit
  let backupCommitCreated = false;
  const backupMessage = `${BACKUP_COMMIT_PREFIX} ${latestVersion}`;
  const addResult = runGit(['add', '-A']);
  if (addResult.status !== 0) {
    process.stderr.write(`git add failed: ${addResult.stderr}\n`);
    process.exit(1);
  }

  const commitResult = runGit(['commit', '-m', backupMessage]);
  if (commitResult.status !== 0) {
    if (!commitResult.stdout.includes('nothing to commit') &&
        !commitResult.stderr.includes('nothing to commit')) {
      process.stderr.write(`Backup commit failed: ${commitResult.stderr}\n`);
      process.exit(1);
    }
  } else {
    backupCommitCreated = true;
  }

  // 3. Download and extract release asset
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clade-update-'));

  try {
    const zipBuffer = await httpsDownload(zipballUrl, extraHeaders);
    await extractZip(zipBuffer, temporaryDir);
    const releaseDir = findReleaseDir(temporaryDir);

    // 4. Copy new clade-update.js to disk first (English edition)
    //    so the spawned child process loads the new code
    const newScriptSrc = path.join(releaseDir, RELEASE_SRC_PREFIX, 'hooks', 'clade-update.js');
    const currentScriptPath = path.resolve(__dirname, 'clade-update.js');
    if (fs.existsSync(newScriptSrc)) {
      fs.copyFileSync(newScriptSrc, currentScriptPath);
    }

    // 5. Spawn new script in a separate process to copy files (Stage 2)
    const child = spawnSync(
      'node',
      [currentScriptPath, '--apply-files', releaseDir, latestVersion],
      { stdio: 'inherit', cwd: projectRoot }
    );

    if (child.status !== 0) {
      throw new Error(`File copy process failed (exit code: ${child.status})`);
    }

    process.stdout.write(`clade updated to ${latestVersion}\n`);
  } catch (error) {
    process.stderr.write(`Error during update: ${error.message}\n`);
    if (backupCommitCreated) {
      process.stderr.write('Rolling back to backup commit...\n');
      runGit(['reset', '--hard', 'HEAD~1']);
    }
    process.exit(1);
  } finally {
    try {
      fs.rmSync(temporaryDir, { recursive: true, force: true });
    } catch (cleanupError) {
      process.stderr.write(
        `Warning: failed to remove temp directory: ${temporaryDir}\nPlease remove it manually.\n`
      );
    }
  }
}

// ============================================================
// Mode: --apply-files (internal, spawned by --apply)
// ============================================================

/**
 * --apply-files mode main process
 * Internal mode called by --apply via the new clade-update.js.
 * Reads the manifest from the release and copies all managed files, then commits.
 * @param {string} releaseDir - Root directory of the extracted release
 * @param {string} latestVersion - Release version
 */
async function runApplyFilesMode(releaseDir, latestVersion) {
  const projectRoot = getProjectRoot();
  let markerMissing = false;
  const interactiveDiffs = [];

  try {
    // Read manifest from the release (to use new section definitions)
    const releaseManifestPath = path.join(releaseDir, RELEASE_SRC_PREFIX, 'clade-manifest.json');
    if (!fs.existsSync(releaseManifestPath)) {
      throw new Error(`Release clade-manifest.json not found: ${releaseManifestPath}`);
    }
    const manifest = JSON.parse(fs.readFileSync(releaseManifestPath, 'utf8'));

    // Copy English template files: release/templates/en/.claude/ → project/.claude/
    copyFilesFromManifest(manifest, releaseDir, projectRoot);

    // Interactive files: stage .new files for files with diffs
    interactiveDiffs.push(...processInteractiveFiles(manifest, releaseDir, projectRoot));

    // Protected files: only placed on first install, never overwritten
    processProtectedFiles(manifest, releaseDir, projectRoot);

    // Update CLAUDE.md marker section from English template
    const localClaudeMdPath   = path.join(projectRoot, '.claude', 'CLAUDE.md');
    const releaseClaudeMdPath = path.join(releaseDir, RELEASE_SRC_PREFIX, 'CLAUDE.md');
    const result = updateClaudeMdMarkerSection(localClaudeMdPath, releaseClaudeMdPath);
    if (result.markerMissing) markerMissing = true;

    // Update VERSION file
    const versionPath = path.join(projectRoot, '.claude', 'VERSION');
    fs.writeFileSync(versionPath, latestVersion + '\n', 'utf8');

    // Update clade-manifest.json from release, preserving local language value
    const manifestPath = path.join(projectRoot, '.claude', 'clade-manifest.json');
    let localLanguage = 'en';
    if (fs.existsSync(manifestPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (typeof existing.language === 'string') {
          localLanguage = existing.language;
        }
      } catch (_) {
        // keep default
      }
    }
    const newManifest = JSON.parse(fs.readFileSync(releaseManifestPath, 'utf8'));
    newManifest.language = localLanguage;
    fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2) + '\n', 'utf8');

    // Completion commit
    runGit(['add', '-A']);
    runGit(['commit', '-m', `chore: update clade to ${latestVersion}`]);

    // Emit result JSON on stdout (consumed by the /update command for the interactive loop)
    const output = {
      success: true,
      version: latestVersion,
      marker_missing: markerMissing,
      interactive_diffs: interactiveDiffs.map((d) => ({
        target: d.target,
        new: d.new,
        isNew: d.isNew,
      })),
    };
    process.stdout.write(JSON.stringify(output) + '\n');

    if (markerMissing) {
      process.stderr.write(JSON.stringify({ marker_missing: true }) + '\n');
    }

    process.exit(0);
  } catch (error) {
    process.stderr.write(`Error copying files: ${error.message}\n`);
    process.exit(1);
  }
}

// ============================================================
// Mode: --rollback
// ============================================================

function runRollbackMode() {
  if (hasUncommittedChanges()) {
    process.stderr.write(
      'There are uncommitted changes. Please commit or stash them before running --rollback.\n'
    );
    process.exit(1);
  }

  const latestMessage = getLatestCommitMessage();
  if (!isBackupCommitMessage(latestMessage)) {
    process.stderr.write(
      'The latest commit is not a backup commit. Please run --apply first.\n'
    );
    process.exit(1);
  }

  const resetResult = runGit(['reset', '--hard', 'HEAD~1']);
  if (resetResult.status !== 0) {
    process.stderr.write(`git reset failed: ${resetResult.stderr}\n`);
    process.exit(1);
  }

  process.stdout.write('Rollback completed.\n');
}

// ============================================================
// Main
// ============================================================

const args = process.argv.slice(2);
const mode = args[0];

const versionFileIndex = args.indexOf('--version-file');
const versionFile = versionFileIndex !== -1 ? args[versionFileIndex + 1] : undefined;

const projectRootIndex = args.indexOf('--project-root');
if (projectRootIndex !== -1 && args[projectRootIndex + 1]) {
  _projectRootOverride = path.resolve(args[projectRootIndex + 1]);
}

if (mode === '--check') {
  runCheckMode({ versionFile }).catch((error) => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  });
} else if (mode === '--apply') {
  runApplyMode().catch((error) => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  });
} else if (mode === '--apply-files') {
  const releaseDir = args[1];
  const latestVersion = args[2];
  if (!releaseDir || !latestVersion) {
    process.stderr.write('Usage: node clade-update.js --apply-files <releaseDir> <version>\n');
    process.exit(1);
  }
  runApplyFilesMode(releaseDir, latestVersion).catch((error) => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  });
} else if (mode === '--rollback') {
  try {
    runRollbackMode();
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
} else {
  process.stderr.write(
    `Usage:
  node .claude/hooks/clade-update.js --check
  node .claude/hooks/clade-update.js --apply
  node .claude/hooks/clade-update.js --apply-files <releaseDir> <version>
  node .claude/hooks/clade-update.js --rollback
`
  );
  process.exit(1);
}
