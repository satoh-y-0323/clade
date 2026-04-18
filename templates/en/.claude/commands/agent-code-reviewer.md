# /agent-code-reviewer Command

Launches the code review agent (code-reviewer) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/code-reviewer.md` to review the rules before starting work.

## Behavior

### Step 1: Launch Sub-Agent
Launch with `subagent_type: code-reviewer` specified in the Agent tool.
Include the current work context (user's request and presence of existing reports) in the prompt.

### Step 2: Receive Report Path
Retrieve the report file path from the agent's return message.

### Step 3: Approval Confirmation
Use the AskUserQuestion tool to ask the user:
"I have saved the code review report to `{file path}`.
Please review the content and let me know: do you approve this report? (yes / no)
If no, please provide your reason."

### Step 4: Record Approval
```
node .claude/hooks/record-approval.js {reportFileName} {yes|no} code-review "{comment}"
```

### Step 5: If Rejected
Append the rejection reason to the prompt, re-launch the code-reviewer sub-agent, and repeat from Step 2.

## Use Cases
- Reviewing code quality, maintainability, and performance
- Verifying alignment with requirements and design
- Creating code review reports (`code-review-report-*.md`)

## Notes
- Does not edit or write to source files
- Security vulnerability assessment is handled by security-reviewer
