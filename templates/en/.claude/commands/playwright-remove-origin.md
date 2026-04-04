# /playwright-remove-origin Command

Removes an added origin for Playwright MCP.
Only deletes from settings.local.json (cannot delete base origins from settings.json).

## Arguments
- `$ARGUMENTS`: The origin to remove (e.g., `https://staging.example.com`)

## Execution Steps
1. If no argument is specified, say "Please specify the origin to remove (e.g., /playwright-remove-origin https://staging.example.com)" and stop.
2. Run the following using the Bash tool (replace `$ARGUMENTS` with the actual origin):
   ```
   node .claude/hooks/manage-playwright-origins.js remove $ARGUMENTS
   ```
3. Present the output to the user.
