# /agent-interviewer command

Starts the requirements interviewer agent. The parent Claude handles Q&A with the user, then launches the sub-agent in a single shot to generate the report.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent is launched in a single shot after Q&A is complete.

## Execution flow

### Step 1: Read upstream reports

Search for `.claude/reports/requirements-report-*.md` using Glob.
If found, read the latest file to understand the previous requirements (for detecting differences from prior requirements).
If not found, skip.

### Step 2: Q&A

Output the following questions one by one as text and wait for the user's response (output one question at a time, then proceed after receiving the answer).

**Q1: Type of work**

```
What kind of work is this?
1. New development (building something from scratch)
2. Feature addition (adding functionality to something existing)
3. Bug fix (fixing something that isn't working)
4. Refactoring (reorganizing code without changing behavior)
5. Other
```

(For feature additions or bug fixes: after receiving the answer, search existing code with Glob/Grep/Read before proceeding to Q2)

**Q2: What do you want done**

```
What would you like to achieve?
```

**Q3: Why is it needed**

```
In what situations will this be used? Please share the background.
```

**Q4: Completion criteria**

```
How will you judge when it's complete?
```

**Q5: Priority**

```
Is this urgent, or do you have time to spare?
```

**Q6: Constraints and concerns**

```
Are there any things you don't want to happen, or approaches you want to avoid?
```

**Q7: Confirmation and agreement**

```
I've organized the interview content. Let me confirm:

- Type of work: {type}
- What you want: {request}
- Reason/background: {background}
- Completion criteria: {criteria}
- Priority: {priority}
- Constraints: {constraints}

Is this understanding correct? Please let me know if there are any corrections or additions.
```

### Step 3: Organize Q&A results

Organize the user's answers into the following structure:
- Type of work
- What they want (summary of request)
- Reason/background
- Completion criteria
- Priority/urgency
- Constraints/concerns
- Existing code investigation results (for feature additions or bug fixes)

### Step 4: Single-shot sub-agent launch

Launch with `subagent_type: interviewer` via the Agent tool. Include the following in the prompt:

```
## Work request
Create requirements definition report

## Upstream report path (if present)
- Previous requirements-report: {path or "none"}

## Q&A results with user

### Q1: Type of work
A: {answer}

### Q2: What you want
A: {answer}

### Q3: Reason/background
A: {answer}

### Q4: Completion criteria
A: {answer}

### Q5: Priority
A: {answer}

### Q6: Constraints/concerns
A: {answer}

### Existing code investigation results (for feature additions or bug fixes)
{results or none}

## Output instructions
- Output destination: `.claude/reports/requirements-report-*.md` (via write-report.js)
- The final message must include the report file path (format: `File: .claude/reports/requirements-report-YYYYMMDD-HHmmss.md`)
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

Extract the report file path from the sub-agent's final output using the regex `.claude/reports/requirements-report-\d{8}-\d{6}\.md`.

### Step 6: Approval confirmation

Present the following to the user as text:

```
The requirements definition report has been saved to `{file path}`. Please review the content — do you approve this report? (yes / no)
If revisions are needed, please describe them.
```

### Step 7: Record approval

To prevent shell injection, pass the comment via a tmp file:

1. Run `node .claude/hooks/clear-tmp-file.js --path .claude/tmp/approval-comment.md`
2. Use the Write tool to save the user's approval comment to `.claude/tmp/approval-comment.md` (empty string if no comment)
3. Run:

```bash
node .claude/hooks/record-approval.js {filename} {yes|no} requirements --comment-file .claude/tmp/approval-comment.md
```

### Step 8: Restart on rejection

If rejected, repeat from Step 4 with a new prompt that includes the revision instructions and the previous report path.

---

## Purpose
- Pre-work interviewing before feature additions, bug fixes, refactoring, etc.
- Creating requirements definition reports (`requirements-report-*.md`)

## Notes
- Do not edit or write source files
- Do not propose implementation approaches (that is the architect's role)
