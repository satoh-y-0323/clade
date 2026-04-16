# /agent-project-setup Command

Launches the project setup agent (project-setup) as a sub-agent.

## Execution Flow

The project setup agent requires multiple rounds of interaction (interviews and confirmations) with the user.
**Never spawn a new Agent on each turn.** Continue the same agent session via SendMessage.

### Step 1: Initial launch
Launch with `subagent_type: project-setup` specified in the Agent tool.
Include the programming language(s) in the prompt if already known.

### Step 2: Save the agentId
If the agent's output contains the following format, record the agentId:
```
agentId: {id} (use SendMessage with to: '{id}' to continue this agent)
```

### Step 3: Display the question or confirmation
Show the question or confirmation from the agent to the user and wait for a response.

### Step 4: Continue via SendMessage
Once the user responds, **do not spawn a new Agent**. Instead, continue via the SendMessage tool:
- `to`: the saved agentId
- `message`: the user's response

### Step 5: Repeat
Repeat until the agentId no longer appears in the output (i.e., `coding-conventions.md` generation is complete).

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
