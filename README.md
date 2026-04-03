# Clade

[日本語版はこちら](README.ja.md)

> **Pronunciation:** *Kleɪd* (クレイド)  
> **Origin:** *Claude* + *made* — and in biology, a **clade** means a group sharing a common ancestor. That team-of-one-origin feeling is exactly the spirit here.

**Clade** is a multi-agent development framework built on top of [Claude Code](https://claude.ai/code).  
It organizes specialized agents by role — interviewer, architect, planner, developer, tester, reviewer — and connects them through a structured workflow, all defined in plain Markdown. No code required.

---

## Features

- **Role-based agents** — Each agent has a clearly defined responsibility and rule set
- **Structured workflow** — Phases from requirements → design → planning → implementation → testing → review
- **Human-in-the-loop** — Every phase produces a report that requires your approval before moving on
- **Project-contained by default** — All configuration lives inside `.claude/` and travels with the project. Nothing leaks into your global environment without your explicit intent
- **Promote when ready** — Skills, rules, and MCP servers that prove useful across multiple projects can be elevated to global scope with `/promote`, on your terms
- **Fully customizable** — Tailor agents, rules, and skills to your team's conventions
- **No code required** — Everything is configured in Markdown files

---

## Requirements

- [Claude Code](https://claude.ai/code) (CLI or VS Code extension)
- Node.js v18 or later
- Git
- Windows (WSL not required)

---

## Getting Started

### 1. Clone this repository

```bash
git clone https://github.com/satoh-y-0323/clade.git clade
cd clade
```

### 2. Run the setup script

```powershell
# Windows (PowerShell)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1 -ProjectPath "C:\path\to\your\project"

# With GitHub MCP integration (requires a GitHub Personal Access Token)
.\setup.ps1 -ProjectPath "C:\path\to\your\project" -MCP
```

`-ProjectPath` specifies the full path to the project you want to set up.  
This copies the `.claude/` directory into your project and initializes the session management hooks.

`-MCP` enables the GitHub MCP server. You will be prompted to enter your GitHub Personal Access Token on first run. The token is stored in `.claude/settings.local.json` (gitignored).

### 3. Set up your coding conventions (recommended)

Open Claude Code in your project and run:

```
/agent-project-setup
```

This will ask about your language and coding conventions, then generate `.claude/skills/project/coding-conventions.md` automatically.

### 4. Start working

```
/agent-interviewer    # Start with requirements gathering
```

Or jump straight to any agent:

```
/agent-developer      # Start implementing
/agent-architect      # Start designing
```

---

## Workflow

```
Phase 1: Requirements & Design
  /agent-interviewer  →  requirements-report
  /agent-architect    →  architecture-report

Phase 2: Planning
  /agent-planner      →  plan-report

Phase 3: Implementation & Testing (TDD)
  /agent-tester       →  write failing tests (Red)
  /agent-developer    →  implement (Green → Refactor)
  /agent-tester       →  verify & test-report

Phase 4: Review
  /agent-code-reviewer      →  code-review-report
  /agent-security-reviewer  →  security-review-report
  /agent-planner            →  updated plan-report

Repeat Phase 3–4 until all issues are resolved.
```

All reports are saved in `.claude/reports/` with timestamps.  
Each phase waits for your approval before proceeding.

---

## Available Agents

| Command | Role |
|---|---|
| `/agent-interviewer` | Requirements gathering |
| `/agent-architect` | System design & architecture |
| `/agent-planner` | Task planning & coordination |
| `/agent-developer` | Implementation & debugging |
| `/agent-tester` | Test design & execution |
| `/agent-code-reviewer` | Code quality review |
| `/agent-security-reviewer` | Security vulnerability review |
| `/agent-project-setup` | Coding conventions setup |
| `/agent-mcp-setup` | MCP server configuration |

---

## Customization

### Coding conventions
Run `/agent-project-setup` to configure language-specific conventions.  
Supports any language — TypeScript, Python, C#, Go, Java, Ruby, and more.  
Custom team rules and corporate coding standards can be added on top.

### Skills
Add project-specific instructions to `.claude/skills/project/`.  
Files placed here are automatically picked up by the relevant agents.

### Rules
Modify `.claude/rules/` to adjust agent behavior globally or per-agent.

### Built-in MCP servers

Clade includes the following MCP servers out of the box:

| Server | Purpose |
|---|---|
| `filesystem` | Read/write files outside the project directory |
| `memory` | Persistent knowledge graph across sessions |
| `sequential-thinking` | Structured multi-step reasoning for complex tasks |
| `github` | Access GitHub Issues, PRs, and repositories (requires `-MCP` setup) |
| `playwright` | Browser automation and E2E testing (localhost only by default) |

The Playwright server restricts access to `localhost` by default. Use these commands to manage allowed origins per project:

```
/playwright-list-origins                          # Show current allowed origins
/playwright-add-origin https://staging.example.com   # Add an origin
/playwright-remove-origin https://staging.example.com # Remove an origin
```

Additional origins are stored in `.claude/settings.local.json` only — `settings.json` is never modified.

### Adding more MCP servers
Run `/agent-mcp-setup` to add public or private (internal) MCP servers. All servers are added to project scope (`.claude/settings.json`) and a skill file is generated automatically.

If a server proves useful across multiple projects, run `/promote` to elevate it to global scope (`~/.claude/settings.json`).

---

## Session Management

```
/init-session    # Restore previous session state
/end-session     # Save session and exit
/status          # Show current session status
```

Session state, memory, and learned patterns are automatically saved between sessions.

---

## Project Structure

```
clade/
├── .claude/             # Clade configuration (this is what setup.ps1 copies)
│   ├── agents/          # Agent definitions (YAML frontmatter + instructions)
│   ├── commands/        # Custom slash commands (/agent-xxx)
│   ├── hooks/           # Lifecycle hooks (session start/stop, tool pre/post)
│   ├── rules/           # Agent behavior rules (core + per-agent)
│   ├── skills/
│   │   └── project/     # Project-specific skill files (coding conventions, etc.)
│   ├── reports/         # Generated reports (auto-created)
│   ├── memory/          # Session memory (auto-managed)
│   └── CLAUDE.md        # Entry point for Claude Code
├── setup.ps1            # Setup script for existing projects
├── README.md
└── LICENSE
```

---

## License

[MIT License](LICENSE)
