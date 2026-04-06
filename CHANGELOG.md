# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.3.0] - 2026-04-06

### Features
- **VS Code extension environment check** — On session start, Clade now detects whether it is running inside the VS Code extension or the CLI. If the VS Code extension is detected, users are warned about the parallel background execution limitation and can choose to continue in sequential mode or switch to CLI with guided instructions.
- **Milestone-based workflow** — `plan-report` now supports milestones. When milestones are defined, the planner asks whether to run in `confirm` mode (pause after each milestone) or `auto` mode (continue automatically). The developer commits at each milestone boundary accordingly.

### Bug Fixes
- **`sandbox` config format** — Changed `sandbox` from `true` (boolean) to an object (`{ enabled, autoAllowBashIfSandboxed, ... }`). The boolean form caused a settings parse error on CLI startup, which silently disabled all `permissions.allow` entries.
- **Removed `httpProxyPort: null` and `socksProxyPort: null`** — These fields must be a number or omitted entirely; `null` caused a settings validation error.

### Documentation
- Removed GitHub MCP references from README setup instructions (`-MCP` / `--mcp` flag, PAT explanation, `github` MCP server entry in the built-in servers table)
- Added CLI recommendation and VS Code extension behavior explanation to README
- Added `CHANGELOG.md`

### Upgrade

Re-run the setup script on your existing project to apply the changes:

**English (Windows):**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**English (macOS/Linux):**
```bash
./setup_en.sh /path/to/your/project
```

**Japanese (Windows):**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**Japanese (macOS/Linux):**
```bash
./setup.sh /path/to/your/project
```

---

## [v1.2.0] - 2026-04-06

### Refactoring
- Replace GitHub MCP with gh CLI for GitHub operations
  - Remove `--mcp` / `-MCP` setup flag and PAT management
  - Add gh CLI presence and auth status check to setup scripts
  - `GITHUB_PERSONAL_ACCESS_TOKEN` is no longer required

### Features
- Add per-agent GitHub operation permissions
  - Read-only `gh` commands are auto-approved via `permissions.allow`
  - Write operations are gated by confirmation dialog
  - Permissions are defined directly in each agent file

### Bug Fixes
- Fix `permissions.allow` path patterns and hooks format in `settings.json`
- Allow absolute paths in `permissions.allow`

---

## [v1.1.1] - 2026-04-05

### Bug Fixes
- **English template: `settings.json` was missing** — Added `templates/en/.claude/settings.json` which was absent in v1.1.0. Users who set up with the English template were repeatedly prompted for permission every time a Clade hook script ran.
- Auto-approve all internal Clade hook scripts via `permissions.allow` (`write-report.js`, `record-approval.js`, `clear-file-history.js`, `enable-sandbox.js`, `manage-playwright-origins.js`)

---

## [v1.1.0] - 2026-04-04

### Features
- **English template** — Added `templates/en/.claude/` with full English translation of all template files
- Added `setup_en.ps1` (Windows) and `setup_en.sh` (macOS/Linux) for English setup
- **macOS/Linux support** — Added `setup.sh` for macOS/Linux users (Japanese template)

---

## [v1.0.0] - 2026-04-04

Initial release.

- 7 role-based agents: interviewer, architect, planner, developer, tester, code-reviewer, security-reviewer
- Structured workflow: Requirements → Design → Planning → Implementation → Testing → Review
- Human-in-the-loop approval at every phase
- Session memory: automatically saves and restores work across sessions
- MCP server support: Playwright, Memory, Sequential-thinking
- Project-contained by default — all config lives in `.claude/`
- Promote skills and rules to global scope with `/promote`
