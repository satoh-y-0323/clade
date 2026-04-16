# /agent-interviewer Command

Launches the requirements gathering agent (interviewer) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/interviewer.md` to review the rules before starting work.

## Execution Flow

The interviewer requires multiple turns of dialogue with the user.
**Do NOT spawn a new Agent for each user response.** Use SendMessage to continue the same agent.

### Step 1: Initial Launch
Launch with `subagent_type: interviewer` specified in the Agent tool.
Include the current work context (user's request and presence of existing reports) in the prompt.

### Step 2: Save agentId
If the agent's output contains the following pattern, record the agentId:
```
agentId: {id} (use SendMessage with to: '{id}' to continue this agent)
```

### Step 3: Display Question
Display the question from the agent's output to the user and wait for a response.

### Step 4: Continue with SendMessage
When the user responds, **do NOT spawn a new Agent**. Use the SendMessage tool to continue:
- `to`: the saved agentId
- `message`: the user's response

### Step 5: Repeat
Return to Step 3 when the agent outputs the next question.
End when the agentId no longer appears in the output (report has been written and approved).

## Use Cases
- Interviewing before starting work on new features, feature additions, bug fixes, refactoring, etc.
- Creating requirements reports (`requirements-report-*.md`)

## Notes
- Does not edit or write to source files
- Does not propose implementation approaches (that is the architect's role)
