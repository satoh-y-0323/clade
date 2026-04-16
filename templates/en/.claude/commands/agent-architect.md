# /agent-architect Command

Launches the architecture and design agent (architect) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/architect.md` to review the rules before starting work.

## Execution Flow

The architect requires user approval after outputting the report.
**Do NOT spawn a new Agent for each user response.** Use SendMessage to continue the same agent.

### Step 1: Initial Launch
Launch with `subagent_type: architect` specified in the Agent tool.
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
- System design, architecture decisions, and technology selection
- Creating ADRs (Architecture Decision Records)
- Creating architecture design reports (`architecture-report-*.md`)

## Notes
- Always check the latest `requirements-report-*.md` before starting work
