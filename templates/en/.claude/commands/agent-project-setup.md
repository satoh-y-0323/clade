# /agent-project-setup Command

Launches the project setup agent (project-setup) as a sub-agent.

## Execution Flow

The project setup agent requires multiple rounds of interaction (interviews and confirmations) with the user.
**Never spawn a new Agent on each turn.** Continue the same agent session via SendMessage.

### Step 1: Initial launch
Launch with `subagent_type: project-setup` specified in the Agent tool.
Include the following in the prompt:
- Programming language(s) to use (if known)
- Do not use the AskUserQuestion tool; return questions and confirmations as plain text **one at a time** (the parent Claude will relay them to the user). Do not output multiple questions at once.
- agentId output instructions (write without placeholder format, as shown below):
  "Whenever you output something that requires a response (a question or confirmation), output your actual agentId at the end of your response in this format:
  `agentId: <actual-ID> (use SendMessage with to: '<actual-ID>' to continue this agent)`
  Replace `<actual-ID>` with the real ID string assigned to you by Agent Teams.
  Do not output placeholders or 'undefined'."

### Step 2: Save the agentId
If the agent's output contains the following format, record the agentId:
```
agentId: <id> (use SendMessage with to: '<id>' to continue this agent)
```
**Important:**
- If multiple agentId lines are output, **use the last one** (the real ID assigned by Agent Teams always appears last)
- Once a valid agentId is saved, do not overwrite or discard it even if subsequent responses do not include an agentId. Keep using the saved one.

### Step 3: Display the question or confirmation
Show the question or confirmation from the agent to the user and wait for a response.

### Step 4: Continue via SendMessage
Once the user responds, **do not spawn a new Agent**. Instead, continue via the SendMessage tool:
- `to`: the saved agentId
- `message`: the user's response

### Step 5: Repeat
Return to Step 3 when the agent outputs the next question or confirmation.
**Termination condition:** End when the agent has generated `coding-conventions.md` and reported completion.
Do NOT use the presence or absence of agentId as the termination signal.

### Step 6: Session Termination (on error or interruption)
If the user requests cancellation or an error occurs, send the following via SendMessage to terminate the agent:
```
The session is being cancelled at the user's request.
```

## Use Cases
- Configuring coding conventions at project start
- Updating or adding conventions (incorporating company-specific rules, etc.)
- Re-configuring conventions when languages change or are added

## Generated Files
`.claude/skills/project/coding-conventions.md`

Agents that reference this file:
- `/agent-developer` — compliance with conventions during implementation
- `/agent-code-reviewer` — review based on conventions
- `/agent-tester` — reflected in test naming and structure
- `/agent-architect` — reflected in language and pattern selection

## Notes
- Operates independently of the standard workflow (phase structure)
- This command is self-contained (no handoff to other agents needed)
- It is recommended to run this once at project start
