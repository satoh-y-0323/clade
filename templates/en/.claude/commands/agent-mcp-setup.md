# /agent-mcp-setup Command

Launches the MCP setup agent (mcp-setup) as a sub-agent.

## Execution Flow

The MCP setup agent requires multiple rounds of interaction (interviews and confirmations) with the user.
**Never spawn a new Agent on each turn.** Continue the same agent session via SendMessage.

### Step 1: Initial launch
Launch with `subagent_type: mcp-setup` specified in the Agent tool.
Include the name of the MCP server to add in the prompt if already known.

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
Repeat until the agentId no longer appears in the output (i.e., connection setup and skill file generation are complete).

## Use Cases
- Researching public MCP servers (npm / GitHub), configuring connections, and generating skill files
- Manually configuring private or in-house MCP servers and generating skill files
- Only creating skill files for already-configured MCP servers

## Notes
- Operates independently of the standard workflow (phase structure)
- This command is self-contained (no handoff to other agents needed)
- Do not write environment variable values (API keys, etc.) directly in files; manage them with .env
