# Clade

[![version](https://img.shields.io/badge/version-1.3.3-blue)](CHANGELOG.md)

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
- [GitHub CLI (gh)](https://cli.github.com)
- Windows, macOS, or Linux

## CLI vs VS Code Extension

**Running via CLI is recommended.**

The VS Code extension currently has a known bug where project-level `permissions.allow` entries in `.claude/settings.json` are not respected. This causes confirmation dialogs to appear for every hook script execution, which prevents parallel background agents from completing correctly.

| | CLI | VS Code Extension |
|---|---|---|
| `permissions.allow` (project-level) | Works correctly | Not recognized (known bug) |
| Parallel background agents | Fully supported | Not available (dialog cannot appear in background) |
| Multi-line input | Enable with `/terminal-setup` (`Shift+Enter`) | Native support |

### Running in the VS Code Extension

Clade detects the VS Code extension at session start and notifies you of the limitation. You can either:

- **Continue in sequential mode** — Agents run one at a time. All features work, just without parallelism.
- **Switch to CLI** — Open the integrated terminal (`Ctrl+`` / `Cmd+``), run `claude`, then `/terminal-setup` to enable `Shift+Enter` for multi-line input, and `/init-session` to restore your previous session.

> This limitation will be resolved once [anthropics/claude-code#43787](https://github.com/anthropics/claude-code/issues/43787) is fixed.

---

## Getting Started

### 1. Clone this repository

```bash
git clone https://github.com/satoh-y-0323/clade.git clade
cd clade
```

### 2. Run the setup script

Choose the script that matches your preferred language:

**English version**

```powershell
# Windows (PowerShell)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

```bash
# macOS / Linux
chmod +x setup_en.sh
./setup_en.sh /path/to/your/project
```

**Japanese version**

```powershell
# Windows (PowerShell)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

```bash
# macOS / Linux
chmod +x setup.sh
./setup.sh /path/to/your/project
```

The path argument specifies the project you want to set up.  
This copies the `.claude/` directory into your project and initializes the session management hooks.

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

## Example

Here is a typical session using Clade to add a new feature.

### Step 1 — Requirements gathering

```
> /agent-interviewer

今回の作業はどのようなものでしょうか？
1. 新規開発
2. 機能追加  ← 選択
3. バグ修正
...

どのようなことを実現したいですか？
→ "メールとパスワードでログインできるようにしたい"

それはどのような場面で使いますか？
→ "ユーザーがセッションをまたいでデータを保存できるようにしたい"

どうなったら完成と判断しますか？
→ "登録・ログイン・自分のデータだけ見られる状態"

──────────────────────────────────────────
要件定義レポートを保存しました:
  .claude/reports/requirements-report-20260404-103012.md

このレポートを承認しますか？（yes / no）
> yes
──────────────────────────────────────────
```
![](docs/images/step1-1.png)  
![](docs/images/step1-2.png)  
![](docs/images/step1-3.png)  
![](docs/images/step1-4.png)  
![](docs/images/step1-5.png)  
![](docs/images/step1-6.png)  

### Step 2 — Design

```
> /agent-architect

requirements-report-20260404-103012.md を読み込み中...

[認証フロー・データモデル・API インターフェースを設計中...]

アーキテクチャ設計レポートを保存しました:
  .claude/reports/architecture-report-20260404-103521.md

この設計を承認しますか？（yes / no）
> yes
```
![](docs/images/step2-1.png)  
![](docs/images/step2-2.png)  

### Step 3 — Planning → Implementation → Testing → Review

```
> /agent-planner            # plan-report を生成
> /agent-tester             # 失敗するテストを作成（Red）
> /agent-developer          # 実装（Green → Refactor）
> /agent-tester             # テスト再実行・test-report を出力
> /agent-code-reviewer      # code-review-report を出力
> /agent-security-reviewer  # security-review-report を出力
```
![](docs/images/step3-1.png)  
![](docs/images/step3-2.png)  
![](docs/images/step3-3.png)  
![](docs/images/step3-4.png)  
![](docs/images/step3-5.png)  
![](docs/images/step3-6.png)  

Each step saves a timestamped report and waits for your approval before proceeding.

### Session restore

When you return to the project the next day:

```
> /init-session

## セッション再開 (2026-04-05)

### 前回セッション (2026-04-04)
残タスク:
- [ ] コードレビュー指摘対応: 認証ロジックをサービス層に分離する
- [ ] リファクタ後のテスト再実行

続きから作業しますか？それとも新しいタスクを開始しますか？
```

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
├── .claude/              # Japanese template (also the active config for this repo)
│   ├── agents/           # Agent definitions (YAML frontmatter + instructions)
│   ├── commands/         # Custom slash commands (/agent-xxx)
│   ├── hooks/            # Lifecycle hooks (session start/stop, tool pre/post)
│   ├── rules/            # Agent behavior rules (core + per-agent)
│   ├── skills/
│   │   └── project/      # Project-specific skill files (coding conventions, etc.)
│   ├── reports/          # Generated reports (auto-created)
│   ├── memory/           # Session memory (auto-managed)
│   └── CLAUDE.md         # Entry point for Claude Code
├── templates/
│   └── en/.claude/       # English template (same structure as above)
├── setup.ps1             # Setup script - Japanese (Windows)
├── setup.sh              # Setup script - Japanese (macOS / Linux)
├── setup_en.ps1          # Setup script - English (Windows)
├── setup_en.sh           # Setup script - English (macOS / Linux)
├── README.md
└── LICENSE
```

---

## License

[MIT License](LICENSE)
