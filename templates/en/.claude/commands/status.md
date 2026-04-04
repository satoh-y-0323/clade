# /status Command

Displays the current session state, active rules, and instinct accumulation status.

## Execution Steps
1. Check the current agent and active rules
2. Check for session files:
   Search for `.claude/memory/sessions/*.tmp` with the Glob tool
3. Check the accumulation status of observation data:
   - Load `.claude/instincts/raw/observations.jsonl` with the Read tool and count lines
   - Search for `.claude/instincts/clusters/*.json` with the Glob tool
   - Search for `.claude/skills/project/*.md` with the Glob tool
4. Display in the following format:

---
## Current Status

### Session
- Today: {YYYYMMDD}
- Latest session file: {filename or none}
- Remaining task count: {count}

### Active Configuration
- Agent: {name or not selected}
- Active rules: {file list}
- Active skills: {skill list}

### Continuous Learning State
- Observation data: {count} records accumulated
- Project-specific skills: {count}
- Project-specific individual rules: {count}
- Instinct clusters: {count}

### Available Commands
- `/agent-interviewer` — Requirements gathering
- `/agent-architect` — Architecture and design
- `/agent-planner` — Planning and task assignment
- `/agent-developer` — Implementation
- `/agent-tester` — Testing
- `/agent-code-reviewer` `/agent-security-reviewer` — Review
- `/init-session` — Restore session
- `/end-session` — Save session
- `/cluster-promote` — Promote instincts
- `/promote` — Global deployment
---
