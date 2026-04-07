# Claude Code Project Configuration

## Startup Protocol
Automatically executed at session start:
1. `.claude/hooks/session-start.js` runs automatically as a SessionStart hook
   → Previous session, memory.json, instincts, and skill list are injected into context
2. **Check the execution environment (see "Environment Check" below)**
3. Present remaining tasks from the previous session to the user
4. Select an agent: `/agent-developer` / `/agent-architect` / `/agent-code-reviewer` / `/agent-security-reviewer`

For manual execution: `/init-session`

## Environment Check

> **Note:** Running via CLI is recommended. The VS Code extension currently has a bug that prevents parallel background agents from working correctly.

### When launched from the VS Code extension

If the system prompt contains `VSCode Extension Context`, the session is running inside the VS Code extension. In that case, notify the user and ask for confirmation:

```
⚠️ You are running inside the VS Code extension.

The VS Code extension currently has a bug: when agents are run in parallel in the background,
confirmation dialogs cannot be displayed and tasks may not complete correctly.

Running via CLI is recommended, but you can continue in sequential (non-parallel) mode.

Continue in sequential mode?
  [yes] Continue the session in sequential mode (no parallel background execution)
  [no]  Show CLI migration instructions and exit
```

- **If yes**: Do not use parallel or background agent execution for the rest of this session. Use sequential execution only.
- **If no**: Show the following instructions and end the session:
  1. Open the integrated terminal in VS Code (`Ctrl+\`` / `Cmd+\``)
  2. Run `claude` to launch the CLI
  3. Run `/terminal-setup` to enable multi-line input with `Shift+Enter`
  4. Run `/init-session` to restore the previous session state

### When launched from the CLI

Normal behavior. Do not show any environment check message.

## Automatically Executed Hooks
| Event | Script | Purpose |
|---|---|---|
| SessionStart | `.claude/hooks/session-start.js` | Restore previous session, memory, and instincts |
| PreToolUse | `.claude/hooks/pre-tool.js` | Guard dangerous commands + record tool execution |
| PostToolUse | `.claude/hooks/post-tool.js` | Record tool results |
| Stop | `.claude/hooks/stop.js` | Save session + launch pattern extraction |
| PreCompact | `.claude/hooks/pre-compact.js` | Save session state before compaction |

## Settings Files

### `settings.json`
Project-wide settings committed to the repository. Defines permissions, hooks, sandbox, and MCP servers.

### `settings.local.json` (required for parallel development)
User-specific settings **not committed to the repository** (add to `.gitignore`). Required for `isolation: "worktree"` agents to function correctly.

> **Important:** `isolation: "worktree"` agents do **not** read `settings.json` — they only read `settings.local.json`. Without this file, parallel agents will lack the permissions to write files or run git commands, causing them to fail silently.

The setup script (`setup_en.sh` / `setup_en.ps1`) automatically deploys this from `.claude/settings.local.json.example`. To create manually:

```json
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Write(**)",
      "Edit(**)",
      "Glob(**)",
      "Grep(**)",
      "Bash(git:*)",
      "Bash(node*)"
    ]
  }
}
```

## Language
Always respond to the user in English. Exceptions: code, commands, and file paths.

## Global Rules
@rules/core.md

## Available Agents
Agents are selected via custom commands:
- `/agent-interviewer`        → Requirements gathering (outputs requirements-report, no source editing)
- `/agent-architect`          → Architecture and design (outputs architecture-report)
- `/agent-planner`            → Planning and task assignment (outputs plan-report, no source editing)
- `/agent-developer`          → Implementation and debugging (testing is handled by tester)
- `/agent-tester`             → Test design, execution, and reporting (no source editing)
- `/agent-code-reviewer`      → Code quality, maintainability, and performance review (no source editing)
- `/agent-security-reviewer`  → Security vulnerability assessment (no source editing)

### Utility Agents (outside standard workflow, standalone)
- `/agent-project-setup`      → Configure coding conventions, generate coding-conventions.md
- `/agent-mcp-setup`          → Research, configure, and generate skill files for MCP servers

## Project Context
Project-specific skills are automatically applied if they exist:
- Files under `.claude/skills/project/`

## Notes
- Always run `/end-session` before ending a session
- Use `/cluster-promote` for pattern promotion
- Use `/promote` for global deployment
