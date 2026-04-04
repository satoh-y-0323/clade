# /agent-mcp-setup Command

Launches the MCP setup agent (mcp-setup) as a sub-agent.

## Behavior
Launch with `subagent_type: mcp-setup` specified in the Agent tool.

## Use Cases
- Researching public MCP servers (npm / GitHub), configuring connections, and generating skill files
- Manually configuring private or in-house MCP servers and generating skill files
- Only creating skill files for already-configured MCP servers

## Notes
- Operates independently of the standard workflow (phase structure)
- This command is self-contained (no handoff to other agents needed)
- Do not write environment variable values (API keys, etc.) directly in files; manage them with .env
