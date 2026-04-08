# /cluster-promote Command

Analyzes Bash execution logs and session retrospectives to promote
project-specific skills or rules.

## Execution Steps

### Step 1: Collect Data

Read the following files:
1. `.claude/instincts/raw/bash-log.jsonl` — Read only if it exists
2. Search for `.claude/memory/sessions/*.tmp` with Glob and Read all files

### Step 2: Analysis

#### A. Extract Rule Candidates from Bash Log

Analyze each record in bash-log.jsonl to identify failures:
- Records with `err: true`
- Records where `out` contains failure keywords:
  `error`, `Error`, `failed`, `FAILED`, `denied`, `not found`, `No such file`,
  `cannot`, `invalid`, `refused`, `timed out`, `command not found`, etc.

Group similar errors into rule candidates.
Example: "Arguments too long → use heredoc instead"

#### B. Extract Skill/Rule Candidates from Session Retrospectives

Read the following sections in each `.tmp` file:
- `## Approaches That Worked` → Skill candidates (repeatedly successful procedures)
- `## Approaches That Were Tried but Failed` → Rule candidates (things to avoid)

Items mentioned across multiple sessions are treated as high-confidence candidates.

### Step 3: Present Candidates to User

```
## Promotion Candidates

### Skill Candidates (repeatedly successful procedures)
1. {skill name}: {summary} ({N} sessions mentioned)
2. ...

### Rule Candidates (Bash log failure patterns)
1. {rule name}: {what happened / how to avoid it} ({N} occurrences)
2. ...

### Rule Candidates (session retrospective failure patterns)
1. {rule name}: {what failed / lesson learned}
2. ...

Please select items to promote by number (e.g., 1,3) / all / none
```

### Step 4: Save Approved Items

**Skills** → Write to `.claude/skills/project/{name}.md`:
- No frontmatter, Markdown format describing the procedure
- Include: when to use, steps, and notes

**Rules** → Write to `.claude/rules/{name}.md`:
- Format: "Do not...", "When X, do Y"
- Include the impact of violating the rule

**Cluster info** → Write to `.claude/instincts/clusters/{YYYYMMDD}-{name}.json`:
```json
{
  "type": "skill | rule",
  "name": "{name}",
  "summary": "{one-line summary}",
  "promotedAt": "{YYYY-MM-DD}",
  "source": "bash-log | session-tmp"
}
```

### Step 5: Archive bash-log.jsonl

Only if bash-log.jsonl exists and has content:
1. Read the contents
2. Write to `.claude/instincts/raw/bash-log_{YYYYMMDD}_archived.jsonl`
3. Reset the original file (bash-log.jsonl) to `""` (empty string)

* Do not use shell commands (for cross-platform compatibility)
