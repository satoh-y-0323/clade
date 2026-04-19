# /agent-code-reviewer command

Starts the code review agent (code-reviewer). The parent Claude organizes the context, then launches the sub-agent in a single shot to generate the report.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent is launched in a single shot after context is organized.

## Execution flow

### Step 1: Read upstream reports

Search using Glob and read the latest of the following if they exist:
- `.claude/reports/requirements-report-*.md` (confirm requirements and completion criteria)
- `.claude/reports/architecture-report-*.md` (confirm design intent and interface specs)
- `.claude/reports/plan-report-*.md` (confirm assigned tasks)

### Step 2: Identify review targets

Identify the review targets (files, PRs, commit range, etc.) from the user's request.
If unclear, check the latest changes with git status / git log.

### Step 3: Organize context

Organize the following:
- Review target files and change range
- Upstream report paths (if present)
- Special notes from the user (areas to focus on, etc.)

### Step 4: Single-shot sub-agent launch

Launch with `subagent_type: code-reviewer` via the Agent tool. Include the following in the prompt:

```
## Work request
Create code review report

## Upstream report paths (if present)
- requirements-report: {path or "none"}
- architecture-report: {path or "none"}
- plan-report: {path or "none"}

## Review targets
{target files, PR, or commit range}

## Special notes
{areas the user wants focused on, or "none"}

## Output instructions
- Output destination: `.claude/reports/code-review-report-*.md` (via write-report.js)
- The final message must include the report file path (format: `File: .claude/reports/code-review-report-YYYYMMDD-HHmmss.md`)
- Do not use AskUserQuestion / SendMessage
- Exit after generating the report (approval confirmation is handled by the parent Claude)
```

For regeneration after rejection, add the following to the prompt:
```
## Regeneration mode
- Previous report: {previous report path}
- User's revision instructions: {instructions}
```

### Step 5: Receive report path

Extract the report file path from the sub-agent's final output using the regex `.claude/reports/code-review-report-\d{8}-\d{6}\.md`.

### Step 6: Approval confirmation

Present the following to the user as text:

```
The code review report has been saved to `{file path}`. Please review the content — do you approve this report? (yes / no)
If revisions are needed, please describe them.
```

### Step 7: Record approval

```bash
node .claude/hooks/record-approval.js {filename} {yes|no} code-review "{comment}"
```

### Step 8: Restart on rejection

If rejected, repeat from Step 4 with a new prompt that includes the revision instructions and the previous report path.

---

## Purpose
- Reviewing code quality, maintainability, and performance
- Verifying alignment with requirements and design
- Creating code review reports (`code-review-report-*.md`)

## Notes
- Does not edit or write to source files
- Security vulnerability assessment is handled by security-reviewer
