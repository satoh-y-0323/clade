# /promote Command

Deploys project-specific skills or rules globally (~/.claude/) so they can be used across all projects.

## Execution Steps
1. List project-specific files:
   - Search for `.claude/skills/project/*.md` with the Glob tool
   - Search for `.claude/rules/**/individual/*.md` with the Glob tool
   - Check the `mcpServers` key in `.claude/settings.json` with the Read tool
   - Format and output the results

2. Present candidates in the following format:
   ```
   ## Global Deployment Candidates

   ### Skills
   1. {filename}: {first line of description}
   2. ...

   ### Rules
   1. {filename}: {first line of description}
   2. ...

   ### MCP Servers
   1. {server name}: {first line of description from corresponding skill file or "no skill file"}
   2. ...

   Please select items to deploy by number.
   * Project-specific descriptions that need to be generalized will be removed automatically.
   ```

3. Generalize selected files and configurations:
   - Replace project names, specific paths, and specific variable names with generic expressions
   - If an MCP server is selected, review the settings.json entry content and present it to the user
   - Confirm the generalized content with the user

4. Save globally (only run after user approval):
   - Skills → `~/.claude/skills/{name}.md`
   - Rules → `~/.claude/rules/{category}/{name}.md`
   - MCP Server → Append to `mcpServers` in `~/.claude/settings.json` + copy skill file to `~/.claude/skills/{name}-mcp.md`

5. Report deployment results:
   ```
   ## Deployment Complete
   - {filename} → ~/.claude/skills/{name}.md
   Will be available in all projects from the next session.
   ```

## Promotion Criteria Guidelines
- The same procedure or configuration has been effective in 2 or more different projects
- Can be described without project-specific names or paths
- Considered effective for other developers

## Notes When Promoting MCP Servers
- After promoting servers that require environment variables (API keys, etc.), each project still needs to configure `.env` or `settings.local.json` separately
- After appending to `~/.claude/settings.json`, Claude Code needs to be restarted

## Notes
This command also functions as a project-level configuration (GitHub template).
Global deployment is a manual user action and is never done automatically.
