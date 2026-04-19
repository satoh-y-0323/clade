# /agent-architect command

Starts the architecture and design agent (architect). The parent Claude handles Q&A with the user, then launches the sub-agent in a single shot to generate the report.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent is launched in a single shot after Q&A is complete.

## Execution flow

### Step 1: Read upstream reports

Search for `.claude/reports/requirements-report-*.md` using Glob and read the latest file.
If no requirements-report exists, skip and confirm requirements directly during Q&A.

### Step 2: Q&A

Based on the contents of the requirements-report (especially the "handover to architect" and "points to dig deeper into" sections), output the following questions one by one and wait for the user's response (output one question at a time, then proceed after receiving the answer).

**Q1: Clarification**

Confirm the points listed in the requirements-report's "handover to architect" section with the user:

```
I've reviewed the requirements definition report. Before proceeding with the design, let me confirm a few points.

{Compose and present questions based on each item in the handover section}

If no requirements-report exists, ask: "What feature or system are you designing?"
```

**Q2: Tradeoff selection**

Confirm the major technical choices:

```
There are several options to consider for the design. Which approach would you like to adopt?

{Present the main tradeoffs derived from the requirements. For example:}
- Performance-first vs. development speed-first
- Monolithic vs. microservices
- etc.
```

**Q3: Constraints and priorities**

```
Let me confirm the design constraints and priorities.

- Are there any quality characteristics you particularly want to prioritize (performance, security, maintainability, etc.)?
- Are there any existing technology stacks or libraries that must be kept?
```

### Step 3: Organize Q&A results

Organize the user's answers into the following structure:
- Confirmed technical requirements and constraints
- Tradeoff selection results
- Priority quality characteristics
- Design premises

### Step 4: Single-shot sub-agent launch

Launch with `subagent_type: architect` via the Agent tool. Include the following in the prompt:

```
## Work request
Create architecture design report

## Upstream report path
- requirements-report: {path or "none"}

## Q&A results with user

### Q1: Clarification answers
A: {answer}

### Q2: Tradeoff selection
A: {answer}

### Q3: Constraints and priorities
A: {answer}

## Output instructions
- Output destination: `.claude/reports/architecture-report-*.md` (via write-report.js)
- The final message must include the report file path (format: `File: .claude/reports/architecture-report-YYYYMMDD-HHmmss.md`)
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

Extract the report file path from the sub-agent's final output using the regex `.claude/reports/architecture-report-\d{8}-\d{6}\.md`.

### Step 6: Approval confirmation

Present the following to the user as text:

```
The architecture design report has been saved to `{file path}`. Please review the content — do you approve this design? (yes / no)
If revisions are needed, please describe them.
```

### Step 7: Record approval

```bash
node .claude/hooks/record-approval.js {filename} {yes|no} architecture "{comment}"
```

### Step 8: Restart on rejection

If rejected, repeat from Step 4 with a new prompt that includes the revision instructions and the previous report path.

---

## Purpose
- System design, architecture decisions, and technology selection
- Creating ADRs (Architecture Decision Records)
- Creating architecture design reports (`architecture-report-*.md`)

## Notes
- Always check the latest `requirements-report-*.md` before starting work (Step 1)
