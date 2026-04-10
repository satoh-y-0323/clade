# /cluster-promote Command

Analyzes Bash execution logs and session retrospectives to promote
project-specific skills or rules.

## Execution Steps

### Step 1: Extract Candidates

Run the following to get the candidate JSON:
```
Bash: node .claude/hooks/cluster-promote-core.js scan --json
```

If the script exits with code 1, display the stderr content to the user and stop.

### Step 2: Present Candidates to User

Format the JSON output and present it as follows:

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

### Step 3: Save Approved Items

**Skills** → Write to `.claude/skills/project/{name}.md`:
- No frontmatter, Markdown format describing the procedure
- Include: when to use, steps, and notes

**Rules** → Write to `.claude/rules/{name}.md`:
- Format: "Do not...", "When X, do Y"
- Include the impact of violating the rule

**After saving a rule, always run the following:**
```
Bash: node .claude/hooks/update-clade-section.js add-rule {name}
```
- exit 0: Successfully appended (or CLADE marker not found — no-op)
- exit 2: Already exists in CLAUDE.md — no-op (this is fine)
- exit 1: Write error → warn the user and instruct them to manually add `@rules/{name}.md` to the `## Global Rules (Clade Managed)` section in `.claude/CLAUDE.md`

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

### Step 4: Archive bash-log.jsonl

Only if bash-log.jsonl exists and has content:
1. Read the contents
2. Write to `.claude/instincts/raw/bash-log_{YYYYMMDD}_archived.jsonl`
3. Reset the original file (bash-log.jsonl) to `""` (empty string)

* Do not use shell commands (for cross-platform compatibility)
