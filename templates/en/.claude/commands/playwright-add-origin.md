# /playwright-add-origin Command

Adds an allowed origin for Playwright MCP.
Only writes to settings.local.json (does not modify settings.json).

## Arguments
- `$ARGUMENTS`: The origin to add (e.g., `https://staging.example.com`)

## Execution Steps
1. If no argument is specified, say "Please specify the origin to add (e.g., /playwright-add-origin https://staging.example.com)" and stop.
2. Run the following using the Bash tool (replace `$ARGUMENTS` with the actual origin):
   ```
   node .claude/hooks/manage-playwright-origins.js add $ARGUMENTS
   ```
3. Present the output to the user.
