# /agent-mcp-setup command

Starts the MCP setup agent (mcp-setup). The parent Claude handles the Q&A (interview) with the user, then launches the sub-agent in a single shot to add the MCP connection settings and generate skill files.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent only handles MCP addition and skill file generation.

## Execution flow

### Step 1: Read upstream reports (as needed)

If you want to check existing MCP skill files, search for `.claude/skills/project/*-mcp.md` using Glob.
Usually skip to Step 2.

### Step 2: Q&A

Conduct the following interview questions one by one (output one question at a time as text and wait for the answer before proceeding).

**Step 2-1: MCP server type**

```
What kind of MCP server would you like to add?

1. Public MCP server (published on npm / GitHub)
   Examples: GitHub MCP, Slack MCP, Notion MCP, Postgres MCP, etc.
2. Private or in-house MCP server (developed or operated internally)
   Examples: Internal API MCP server, custom tool MCP wrapper, etc.

Please tell me the number or server name.
```

**(For public MCP servers) Step 2-2a: Connection info confirmation**

After receiving the answer, organize the server information and present it to the user for confirmation:

```
I've checked the details for {server name}:

- Package: {npm package name}
- Launch command: {command}
- Required environment variables: {list}
- Available tools: {tool list}

I'll add this as project-scoped (project scope) for this project.
Shall I proceed? [yes / no]
Note: You can later promote it to global scope with /promote if you want to use it across all projects.
```

**(For private MCP servers) Steps 2-2b through 2-6: Connection info interview**

```
Step 2-2b: Please provide the server name (identifier).
   Examples: my-company-api, internal-db, etc.
```
(Wait for answer before proceeding)
```
Step 2-3b: Please specify the connection method.
   - stdio: Connect by launching a local process (command execution type)
   - sse / http: Connect via URL (remote server type)
```
(Wait for answer before proceeding)

(For stdio)
```
Step 2-4b: Please provide the launch command.
   Examples: node /path/to/server.js
             python -m my_mcp_server
             npx my-company-mcp-server
```

(For sse / http)
```
Step 2-4b: Please provide the server URL.
   Example: http://internal.example.com:3000
```
(Wait for answer before proceeding)
```
Step 2-5b: Are authentication or environment variables required?
   If so, please provide the key names and descriptions.
   Example: API_KEY (authentication key for the internal API), BASE_URL (server base URL)
```
(Wait for answer before proceeding)
```
Step 2-6b: Please describe what this MCP server can do.
   A brief description of the tools and features it provides would be helpful for the skill file.
```

**Step 2-7: Confirm settings**

Organize the interview results and present them to the user for confirmation:

```
I will add the following settings. Is that okay?

Server name: {name}
Scope: project (this project only)
Command: {command}  or  URL: {url}
Environment variables: {env vars}

[yes / no]
```

### Step 3: Organize Q&A results

Organize the user's answers into the following structure:
- MCP server type (public / private)
- Server name
- Connection method (stdio / sse / http)
- Connection info (command or URL)
- Required environment variables
- Description of provided tools and features

### Step 4: Single-shot sub-agent launch

Launch with `subagent_type: mcp-setup` via the Agent tool. Include the following in the prompt:

```
## Work request
Add MCP server connection settings and generate skill file

## Q&A results with user

### MCP server type
{public / private}

### Server info
- Server name: {name}
- Connection method: {stdio / sse / http}
- Command: {command (for stdio)}
- URL: {url (for sse/http)}
- Required environment variables: {list or none}
- Provided tools / features: {description}

## Output instructions
1. Add the MCP server using the `claude mcp add` command
2. Generate the skill file at `.claude/skills/project/{name}-mcp.md` (Write tool allowed)
3. Do not use AskUserQuestion / SendMessage
4. Exit after setup is complete (completion report is handled by the parent Claude)
5. The final message must include the connection status and skill file path
```

For regeneration after rejection, add the following to the prompt:
```
## Regeneration mode
- User's revision instructions: {instructions}
```

### Step 5: Receive results

Confirm the connection status and skill file path from the sub-agent's final output.

### Step 6: Approval confirmation

Present the following to the user as text:

```
The MCP server setup is complete.

Connection settings: Added to project scope
Skill file: {file path}

{If environment variable setup is required, provide the steps here}

Please review the content — is this setup okay? (yes / no)
If revisions are needed, please describe them.

If you want to use this across all projects, you can promote it globally with /promote.
```

### Step 7: Record approval

Since mcp-setup does not generate a fixed report file, recording approval is omitted.

### Step 8: Restart on rejection

If rejected, repeat from Step 4 with a new prompt that includes the revision instructions.

---

## Purpose
- Researching public MCP servers (npm / GitHub), configuring connections, and generating skill files
- Manually configuring private or in-house MCP servers and generating skill files
- Creating skill files only for already-configured MCP servers

## Notes
- Operates independently from the standard workflow (phases)
- This command is self-contained (no handoff to other agents)
- Do not write environment variable values (API keys, etc.) directly in files; manage them with .env
