# /agent-doc-writer command

Launches the document writer agent (doc-writer) as a subagent.

## Execution Flow

The document writer requires multiple rounds of interaction (interviews and confirmations) with the user.
**Never spawn a new Agent on each turn.** Continue the same agent session via SendMessage.

### Step 1: Initial launch
Start the agent using the Agent tool with `subagent_type: doc-writer`.
Include the target file and a brief description of the document you want to create in the prompt, if known.

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
Repeat until the agentId no longer appears in the output (i.e., document generation and saving is complete).

## Use cases
- Generating Mermaid diagrams (flowcharts, class diagrams, ER diagrams, sequence diagrams)
- Creating or updating README files
- Writing operation manuals and runbooks
- Creating API specifications
- Reverse-engineering specifications from existing code

## Output files
The output destination is selected by the user during the interview:
- `.claude/reports/doc-*.md` (temporary storage)
- Any path within the project (e.g., `docs/architecture.md`)
- Display only (no file saved)

## Notes
- Operates independently from the standard workflow (phases)
- This command is self-contained (no handoff to other agents)
- Does not modify source code
