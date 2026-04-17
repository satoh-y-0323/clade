# MCP Servers Skill

## Overview

This project is configured with official MCP servers from Anthropic and modelcontextprotocol.
All servers run on-demand via `npx -y`, so no global installation is required.

Configuration files:
- `.claude/settings.json` — server definitions (committed to the repo, no secrets)
- `.claude/settings.local.json` — credentials (gitignored, local only)

---

## Available Tools

### filesystem (no authentication required)

Safely operates on files under the project root.
Allowed directory: project root (`.`)

| Tool name | Description | When to use |
|---|---|---|
| read_text_file | Read a text file | Check source code / logs |
| read_media_file | Read an image or audio file as base64 | Check images |
| read_multiple_files | Read multiple files at once | Check related files together |
| write_file | Create or overwrite a file | Create new files |
| edit_file | Pattern-based partial edit (supports dry-run) | Pinpoint fixes |
| create_directory | Create a directory | Build folder structure |
| list_directory | List directory contents | Check structure |
| list_directory_with_sizes | List with sizes | Check disk usage |
| move_file | Move or rename a file / directory | Refactoring |
| search_files | Search files by glob pattern | Locate related files |
| directory_tree | Get directory structure as JSON | Overview of the project |
| get_file_info | Get metadata like timestamps and permissions | Check file attributes |
| list_allowed_directories | Check allowed directories | Check access permissions |

---

### memory (no authentication required)

A knowledge-graph-based persistent memory system.
Records entities (concepts, people, things) and their relations, and can be referenced across sessions.
Data is stored in `memory.jsonl`.

| Tool name | Description | When to use |
|---|---|---|
| create_entities | Add an entity | Record new concepts or requirements |
| create_relations | Create a relation between entities | Record dependencies or associations |
| add_observations | Append facts to an existing entity | Accumulate investigation results / notes |
| delete_entities | Delete entities and their relations | Clean up obsolete records |
| delete_observations | Delete specific facts | Update outdated information |
| delete_relations | Delete a relation | Re-examine associations |
| read_graph | Retrieve the entire knowledge graph | Overview of all records |
| search_nodes | Search entities by name, type, or content | Look up specific info |
| open_nodes | Retrieve entities by name | Detailed inspection |

---

### sequential-thinking (no authentication required)

Supports problem solving through a step-by-step thinking process.
Useful for complex requirements analysis, design decisions, and debugging.

| Tool name | Description | When to use |
|---|---|---|
| sequential_thinking | Unfold thoughts step by step | Decompose / analyze complex problems |

Thinking steps can be revised or branched, allowing you to change direction midway.

---

## How to use in this project

- **filesystem**: Claude Code's built-in file tools cover most cases, but `directory_tree` and `get_file_info` offer operations not available in the built-in set.
- **memory**: Record project-specific terminology, design decisions, and FAQs to carry context across sessions.
- **sequential-thinking**: Use proactively when requirements are complex or you need to organize design choices.
- **GitHub operations** (creating issues/PRs, checking Actions, etc.) are performed via the `gh` CLI through the Bash tool. If not authenticated, run `gh auth login`.

---

## Usage examples

```
# Record project constraints in the knowledge graph
Use memory's create_entities to record that "this project uses .NET 8".

# Analyze requirements step by step
Use sequential-thinking to analyze this feature request step by step.

# Check GitHub issues
Use `gh issue list` to list open issues.

# Create a PR
Use `gh pr create` to create a pull request.
```
