# Claude Code Project Configuration

## Startup Protocol
Automatically executed at session start:
1. `.claude/hooks/session-start.js` runs automatically as a SessionStart hook
   → Previous session, memory.json, instincts, and skill list are injected into context
2. Present remaining tasks from the previous session to the user
3. Select an agent: `/agent-developer` / `/agent-architect` / `/agent-code-reviewer` / `/agent-security-reviewer`

For manual execution: `/init-session`

## Automatically Executed Hooks
| Event | Script | Purpose |
|---|---|---|
| SessionStart | `.claude/hooks/session-start.js` | Restore previous session, memory, and instincts |
| PreToolUse | `.claude/hooks/pre-tool.js` | Guard dangerous commands + record tool execution |
| PostToolUse | `.claude/hooks/post-tool.js` | Record tool results |
| Stop | `.claude/hooks/stop.js` | Save session + launch pattern extraction |
| PreCompact | `.claude/hooks/pre-compact.js` | Save session state before compaction |

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
