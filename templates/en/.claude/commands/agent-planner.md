# /agent-planner Command

Launches the planning agent (planner) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/planner.md` to review the rules before starting work.

## Execution Flow

The planner requires user interaction for milestone confirmation and report approval.
**Do NOT spawn a new Agent for each user response.** Use SendMessage to continue the same agent.

### Step 1: Initial Launch
Launch with `subagent_type: planner` specified in the Agent tool.
Include the following in the prompt:
- Current work context (paths of existing reports, user's request)
- Do not use the AskUserQuestion tool; return questions and confirmations as plain text (the parent Claude will relay them to the user)
- agentId output instructions (write without placeholder format, as shown below):
  "Whenever you output something that requires a response (approval confirmation, etc.), output your actual agentId at the end of your response in this format:
  `agentId: <actual-ID> (use SendMessage with to: '<actual-ID>' to continue this agent)`
  Replace `<actual-ID>` with the real ID string assigned to you by Agent Teams.
  Do not output placeholders or 'undefined'."

### Step 2: Save agentId
If the agent's output contains the following pattern, record the agentId:
```
agentId: <id> (use SendMessage with to: '<id>' to continue this agent)
```
**Important:**
- If multiple agentId lines are output, **use the last one** (the real ID assigned by Agent Teams always appears last)
- Once a valid agentId is saved, do not overwrite or discard it even if subsequent responses do not include an agentId. Keep using the saved one.

### Step 3: Display Question or Confirmation
Display the question or approval confirmation from the agent's output to the user and wait for a response.

### Step 4: Continue with SendMessage
When the user responds, **do NOT spawn a new Agent**. Use the SendMessage tool to continue:
- `to`: the saved agentId
- `message`: the user's response

### Step 5: Repeat
Return to Step 3 when the agent outputs the next question or confirmation.
**Termination condition:** End when the agent has output the report and the user has approved it.
Do NOT use the presence or absence of agentId as the termination signal.

### Step 6: Session Termination (on error or interruption)
If the user requests cancellation or an error occurs, send the following via SendMessage to terminate the agent:
```
The session is being cancelled at the user's request.
```

## Use Cases
- Creating work plans based on requirements and architecture reports
- Assigning tasks to each agent
- Creating work plan reports (`plan-report-*.md`)

## Notes
- Does not edit or write to source files
- On first call, only reference `requirements-report` and `architecture-report` (test/review reports do not yet exist, so skip them)
- On update calls, reference all reports to reflect differences
