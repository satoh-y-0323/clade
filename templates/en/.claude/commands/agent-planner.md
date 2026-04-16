# /agent-planner Command

Launches the planning agent (planner) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/planner.md` to review the rules before starting work.

## Execution Flow

The planner requires user interaction for milestone confirmation and report approval.
**Do NOT spawn a new Agent for each user response.** Use SendMessage to continue the same agent.

### Step 1: Initial Launch
Launch with `subagent_type: planner` specified in the Agent tool.
Include the current work context (paths of existing reports, user's request) in the prompt.

### Step 2: Save agentId
If the agent's output contains the following pattern, record the agentId:
```
agentId: {id} (use SendMessage with to: '{id}' to continue this agent)
```

### Step 3: Display Question or Confirmation
Display the question or approval confirmation from the agent's output to the user and wait for a response.

### Step 4: Continue with SendMessage
When the user responds, **do NOT spawn a new Agent**. Use the SendMessage tool to continue:
- `to`: the saved agentId
- `message`: the user's response

### Step 5: Repeat
End when the agentId no longer appears in the output (report has been written and approved).

## Use Cases
- Creating work plans based on requirements and architecture reports
- Assigning tasks to each agent
- Creating work plan reports (`plan-report-*.md`)

## Notes
- Does not edit or write to source files
- On first call, only reference `requirements-report` and `architecture-report` (test/review reports do not yet exist, so skip them)
- On update calls, reference all reports to reflect differences
